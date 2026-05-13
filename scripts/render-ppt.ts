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

const pres = buildDeck(data);
await pres.writeFile({ fileName: outputPath });

const size = fs.statSync(outputPath).size;
console.log(`OK  ${outputPath}  (${(size / 1024).toFixed(1)} KB)`);
