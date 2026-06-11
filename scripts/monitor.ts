#!/usr/bin/env bun
/**
 * monitor.ts — report a finished document to the OpenCraft monitoring stack.
 *
 * After a document is rendered, this:
 *   1. Uploads the file to S3   (bucket from AWS_S3_BUCKET).
 *   2. Writes telemetry to Supabase (centralize-apps): a heartbeat, an
 *      agent_runs row, and an agent_documents row with the S3 location.
 *
 * The dashboard (opencraft-centralized) reads those rows and presigns a link
 * to the S3 object. Nothing here ever blocks document generation — every
 * failure is logged and swallowed (telemetry must not break real work).
 *
 * Used two ways:
 *   - imported:  await reportDocument({ type, dataPath, outputPath, ... })
 *   - CLI:       bun scripts/monitor.ts <sph|mou|deck> <data.json> <file> [status]
 *
 * Configuration (read from process.env; Bun auto-loads .env):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY      — required to report
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY     — required to upload
 *   AWS_S3_BUCKET, AWS_S3_REGION                 — required to upload
 *   MONITOR_AGENT_SLUG   (default "document-agent")
 *   MONITOR_S3_PREFIX    (default "document-agent")
 */
import fs from "node:fs";
import path from "node:path";

export type DocType = "sph" | "mou" | "deck";
export type DocStatus = "generated" | "failed";

export interface ReportInput {
  type: DocType;
  dataPath: string; // per-document JSON, used to derive title / client / number
  outputPath: string; // local rendered file
  format?: "pdf" | "pptx"; // artifact format (defaults from extension)
  status?: DocStatus; // defaults to "generated"
  durationMs?: number;
  errorMsg?: string;
  // Stable dedupe id. Defaults to the data JSON's doc_number; pass this for
  // artifacts without a doc number (e.g. decks → use the file slug).
  externalId?: string;
}

interface Env {
  supabaseUrl: string;
  serviceKey: string;
  awsKey: string;
  awsSecret: string;
  bucket: string;
  region: string;
  slug: string;
  prefix: string;
}

function readEnv(): Env | null {
  const e = process.env;
  const supabaseUrl = e.SUPABASE_URL;
  const serviceKey = e.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.warn("[monitor] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — skipping report.");
    return null;
  }
  return {
    supabaseUrl: supabaseUrl.replace(/\/+$/, ""),
    serviceKey,
    awsKey: e.AWS_ACCESS_KEY_ID ?? "",
    awsSecret: e.AWS_SECRET_ACCESS_KEY ?? "",
    bucket: e.AWS_S3_BUCKET ?? "",
    region: e.AWS_S3_REGION ?? "",
    slug: e.MONITOR_AGENT_SLUG ?? "document-agent",
    prefix: (e.MONITOR_S3_PREFIX ?? "document-agent").replace(/^\/+|\/+$/g, ""),
  };
}

// ── Title / client extraction from the per-doc data JSON ────
function deriveMeta(type: DocType, data: Record<string, unknown>): {
  title: string;
  client: string | null;
  docNumber: string | null;
} {
  const docNumber = (data.doc_number as string) ?? null;
  if (type === "sph") {
    const recipient = (data.recipient as { org?: string }) ?? {};
    return {
      title: (data.subject as string) ?? (data.subject_short as string) ?? "SPH",
      client: recipient.org ?? null,
      docNumber,
    };
  }
  if (type === "mou") {
    const client = (data.client as { org?: string }) ?? {};
    const pkg = data.package ? ` (${data.package})` : "";
    return {
      title: client.org ? `MoU — ${client.org}${pkg}` : "MoU",
      client: client.org ?? null,
      docNumber,
    };
  }
  return {
    title: (data.title as string) ?? (data.subject as string) ?? "Deck",
    client: ((data.client as { org?: string }) ?? {}).org ?? null,
    docNumber,
  };
}

// Rough word count from all string values in the data payload.
function estimateWords(value: unknown): number {
  if (typeof value === "string") {
    const t = value.trim();
    return t ? t.split(/\s+/).length : 0;
  }
  if (Array.isArray(value)) return value.reduce((s, v) => s + estimateWords(v), 0);
  if (value && typeof value === "object") {
    return Object.values(value).reduce((s: number, v) => s + estimateWords(v), 0);
  }
  return 0;
}

function flatNumber(docNumber: string | null, fallback: string): string {
  return (docNumber ?? fallback).replace(/[\/\s]+/g, "_");
}

// ── Supabase PostgREST helpers (service-role; bypasses RLS) ──
async function pgrest(
  env: Env,
  method: string,
  pathAndQuery: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<unknown> {
  const res = await fetch(`${env.supabaseUrl}/rest/v1/${pathAndQuery}`, {
    method,
    headers: {
      apikey: env.serviceKey,
      authorization: `Bearer ${env.serviceKey}`,
      "content-type": "application/json",
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${method} ${pathAndQuery} → ${res.status} ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function getAgentId(env: Env): Promise<number> {
  const rows = (await pgrest(
    env,
    "GET",
    `agents?slug=eq.${encodeURIComponent(env.slug)}&select=id`,
  )) as { id: number }[];
  if (!rows?.length) throw new Error(`Agent '${env.slug}' not found in registry`);
  return rows[0].id;
}

// ── S3 upload via Bun's native S3 client (no extra deps) ────
async function uploadToS3(
  env: Env,
  localPath: string,
  key: string,
  contentType: string,
): Promise<void> {
  // @ts-expect-error Bun global is provided by the Bun runtime.
  const S3Client = Bun.S3Client;
  const client = new S3Client({
    accessKeyId: env.awsKey,
    secretAccessKey: env.awsSecret,
    region: env.region,
    bucket: env.bucket,
  });
  const bytes = fs.readFileSync(localPath);
  await client.file(key).write(bytes, { type: contentType });
}

/**
 * Report one finished document. Safe to call unconditionally — it no-ops
 * (with a warning) when monitoring env is not configured, and never throws.
 */
export async function reportDocument(input: ReportInput): Promise<void> {
  const env = readEnv();
  if (!env) return;

  try {
    const status: DocStatus = input.status ?? "generated";
    const data = fs.existsSync(input.dataPath)
      ? (JSON.parse(fs.readFileSync(input.dataPath, "utf-8")) as Record<string, unknown>)
      : {};
    const { title, client, docNumber } = deriveMeta(input.type, data);
    const externalId = input.externalId ?? docNumber;
    const format = input.format ?? (path.extname(input.outputPath).slice(1) || "pdf");
    const contentType =
      format === "pptx"
        ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        : "application/pdf";

    const agentId = await getAgentId(env);
    const nowIso = new Date().toISOString();

    // Heartbeat — marks the agent online.
    await pgrest(env, "PATCH", `agents?slug=eq.${encodeURIComponent(env.slug)}`, {
      last_heartbeat_at: nowIso,
    });

    // Run — one per document (already finished when we report).
    const runRows = (await pgrest(
      env,
      "POST",
      "agent_runs?on_conflict=agent_id,external_id",
      {
        agent_id: agentId,
        external_id: externalId,
        status: status === "generated" ? "succeeded" : "failed",
        items_processed: status === "generated" ? 1 : 0,
        duration_ms: input.durationMs ?? null,
        error_msg: input.errorMsg ?? null,
        started_at: nowIso,
        finished_at: nowIso,
      },
      { Prefer: "return=representation,resolution=merge-duplicates" },
    )) as { id: number }[];
    const runId = runRows?.[0]?.id ?? null;

    // Upload the artifact to S3 (only on success and when AWS is configured).
    let s3Key: string | null = null;
    let sizeBytes: number | null = null;
    if (status === "generated" && fs.existsSync(input.outputPath)) {
      sizeBytes = fs.statSync(input.outputPath).size;
      if (env.awsKey && env.awsSecret && env.bucket && env.region) {
        const base = `${flatNumber(externalId, path.parse(input.outputPath).name)}.${format}`;
        s3Key = `${env.prefix}/${input.type}/${base}`;
        await uploadToS3(env, input.outputPath, s3Key, contentType);
      } else {
        console.warn("[monitor] AWS S3 env not set — recording metadata without upload.");
      }
    }

    // Document history row (upsert on agent_id+external_id).
    await pgrest(
      env,
      "POST",
      "agent_documents?on_conflict=agent_id,external_id",
      {
        agent_id: agentId,
        run_id: runId,
        external_id: externalId,
        title,
        doc_type: input.type,
        tool: client,
        status,
        word_count: estimateWords(data) || null,
        size_bytes: sizeBytes,
        duration_ms: input.durationMs ?? null,
        s3_bucket: s3Key ? env.bucket : null,
        s3_key: s3Key,
        s3_region: s3Key ? env.region : null,
        error_msg: input.errorMsg ?? null,
        metadata: { client, doc_number: docNumber, format },
        generated_at: nowIso,
      },
      { Prefer: "resolution=merge-duplicates" },
    );

    // Domain metric for the dashboard charts.
    await pgrest(env, "POST", "agent_metrics", {
      agent_id: agentId,
      run_id: runId,
      metric_key: status === "generated" ? "documents_generated" : "generation_failures",
      value: 1,
      labels: { type: input.type },
      recorded_at: nowIso,
    });

    console.log(
      `[monitor] reported ${input.type} ${docNumber ?? title}` +
        (s3Key ? ` → s3://${env.bucket}/${s3Key}` : " (no upload)"),
    );
  } catch (err) {
    // Never break the agent because telemetry failed.
    console.warn(`[monitor] report failed (ignored): ${(err as Error).message}`);
  }
}

// ── CLI ─────────────────────────────────────────────────────
if (import.meta.main) {
  const [type, dataPath, outputPath, status] = process.argv.slice(2);
  if (!type || !dataPath || !outputPath) {
    console.error("Usage: bun scripts/monitor.ts <sph|mou|deck> <data.json> <file> [generated|failed]");
    process.exit(2);
  }
  await reportDocument({
    type: type as DocType,
    dataPath,
    outputPath,
    status: (status as DocStatus) ?? "generated",
  });
}
