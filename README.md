# document-agent

Claude-powered Admin Document for **OpenCraft — AI Transformation Company**. Generates SPH and MoU PDFs from React components via [@react-pdf/renderer](https://react-pdf.org/).

## How it works

Every prompt in this project triggers the **Admin Document** behavior (see `CLAUDE.md`). You ask for a document; Claude prepares the data JSON and runs the Bun renderer.

```
                       doc_number.py next       (auto-allocate, e.g. 001/SPH-OC/2026)
                              ↓
templates/<type>.tsx  +  tmp/<flat>.json  →  bun render.tsx  →  documents/<type>/<flat>.pdf
       ↑                                                                ↓
       └─── data/brand.json (auto-injected)               doc_number.py record (append to JSON)

                                       data/pricelist.json   (must check)
                                       data/doc-numbers.json (auto-managed)
```

**Doc number format:** `NNN/<TYPE>-OC/YYYY` — e.g. `001/SPH-OC/2026`, `007/MOU-OC/2026`. Sequence resets per year per type.

## Repo layout

```
.
├── CLAUDE.md
├── package.json              # Bun / TS deps
├── tsconfig.json
├── templates/
│   ├── shared/
│   │   ├── brand.ts          # Loads data/brand.json with types
│   │   ├── theme.ts          # Colors, font sizes, page padding
│   │   ├── types.ts          # SPHData, MoUData, etc.
│   │   ├── Logo.tsx          # OpenCraft logo (SVG + wordmark)
│   │   └── Footer.tsx        # Fixed page footer (every page)
│   ├── sph.tsx               # Surat Pengajuan Harga
│   └── mou.tsx               # Memorandum of Understanding
├── samples/                  # Reference data JSONs
│   ├── sph_sample.json
│   └── mou_sample.json
├── brand/
│   └── logo.svg              # Legacy SVG (logo is now in Logo.tsx)
├── data/
│   ├── brand.json            # Company info (single source of truth)
│   ├── doc-numbers.json      # Used doc numbers (auto-managed)
│   └── pricelist.json        # Authoritative AI services pricing
├── scripts/
│   ├── doc_number.py         # Allocate / record doc numbers
│   └── render.tsx            # react-pdf renderer (Bun)
├── tmp/                      # Per-doc data JSONs (intermediate)
└── documents/{sph,mou}/      # Final PDFs
```

## Requirements

- **Bun** ≥ 1.0 (runs TypeScript + JSX natively, no build step)
- **Python 3.8+** (for `doc_number.py`)

Install deps once:

```bash
bun install
```

## Usage

Just talk to Claude in this repo. Examples:

> "Buatkan SPH untuk PT Acme, proyek AI workflow automation, 3 solusi (basic / standard / premium)"

> "Bikin MoU untuk klien PT XYZ, paket Opsi 2, durasi 90 hari"

Claude will:
1. Check the pricelist for items you mention.
2. Allocate the next doc number.
3. Build a data JSON and render to PDF.
4. Report the PDF path and total.

## Manual render

```bash
# Render SPH from a JSON payload
bun scripts/render.tsx sph samples/sph_sample.json documents/sph/sample.pdf

# Render MoU
bun scripts/render.tsx mou samples/mou_sample.json documents/mou/sample.pdf
```

## Doc number CLI

```bash
python3 scripts/doc_number.py next sph                  # → 001/SPH-OC/2026
python3 scripts/doc_number.py flat "001/SPH-OC/2026"    # → 001_SPH-OC_2026
python3 scripts/doc_number.py record sph \
  "001/SPH-OC/2026" "PT Acme" "AI automation" \
  "documents/sph/001_SPH-OC_2026.pdf"
```

## Customizing

- **Brand info:** edit [data/brand.json](data/brand.json) — name, CEO, contact, location, tagline.
- **Logo:** edit [templates/shared/Logo.tsx](templates/shared/Logo.tsx) — uses react-pdf SVG primitives (`<Rect>`, `<Circle>`, `<Line>`).
- **Colors / typography:** edit [templates/shared/theme.ts](templates/shared/theme.ts).
- **Pricelist:** edit [data/pricelist.json](data/pricelist.json).
- **Template layout:** edit the `.tsx` template directly. All styles use react-pdf `StyleSheet`.
- **Doc number format:** edit `PREFIX` map in [scripts/doc_number.py](scripts/doc_number.py).
