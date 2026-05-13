#!/usr/bin/env bun
/**
 * Render a document to PDF via @react-pdf/renderer.
 *
 *   bun scripts/render.tsx <sph|mou> <data.json> <output.pdf>
 *
 * The data JSON is the per-document payload (see templates/shared/types.ts).
 * Brand info is auto-loaded from data/brand.json.
 */
import React from "react";
import { renderToFile } from "@react-pdf/renderer";
import fs from "node:fs";
import path from "node:path";

import { SPHDocument } from "../templates/sph";
import { MoUDocument } from "../templates/mou";

const [type, dataPath, outputPath] = process.argv.slice(2);

if (!type || !dataPath || !outputPath) {
  console.error("Usage: bun scripts/render.tsx <sph|mou> <data.json> <output.pdf>");
  process.exit(2);
}

if (!fs.existsSync(dataPath)) {
  console.error(`Data file not found: ${dataPath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

let element: React.ReactElement;
switch (type) {
  case "sph":      element = <SPHDocument data={data} />; break;
  case "mou":      element = <MoUDocument data={data} />; break;
  default:
    console.error(`Unknown type: ${type}. Use 'sph' or 'mou'.`);
    process.exit(2);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
await renderToFile(element, outputPath);

const size = fs.statSync(outputPath).size;
console.log(`OK  ${outputPath}  (${(size / 1024).toFixed(1)} KB)`);
