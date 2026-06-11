#!/usr/bin/env bun
/**
 * Render a PowerPoint deck via pptxgenjs.
 *
 *   bun scripts/render-ppt.ts <data.json> <output.pptx>
 *
 * For now produces opening + closing slides only (project-content slides
 * are filled per engagement). Brand info auto-loads from data/brand.json.
 */
import fs from "node:fs";
import path from "node:path";
import { buildDeck, type DeckData } from "../templates/deck";
import { reportDocument } from "./monitor";

const [dataPath, outputPath] = process.argv.slice(2);

if (!dataPath || !outputPath) {
  console.error("Usage: bun scripts/render-ppt.ts <data.json> <output.pptx>");
  process.exit(2);
}

if (!fs.existsSync(dataPath)) {
  console.error(`Data file not found: ${dataPath}`);
  process.exit(1);
}

const data: DeckData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const t0 = performance.now();
const pres = buildDeck(data);
await pres.writeFile({ fileName: outputPath });
const durationMs = Math.round(performance.now() - t0);

const size = fs.statSync(outputPath).size;
console.log(`OK  ${outputPath}  (${(size / 1024).toFixed(1)} KB)`);

// Report only the FINAL deck — skip the cheap "_draft" preview renders so the
// monitoring history shows delivered decks, not intermediate previews.
// Decks are unnumbered, so dedupe by file slug. No-ops without monitoring env.
const slug = path.parse(outputPath).name;
if (!/draft/i.test(slug)) {
  await reportDocument({
    type: "deck",
    dataPath,
    outputPath,
    format: "pptx",
    status: "generated",
    durationMs,
    externalId: slug,
  });
}
