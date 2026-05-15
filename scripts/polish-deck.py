#!/usr/bin/env python3
"""Polish a deck — turn each marked slide into a fully-designed image via fal.ai gpt-image-2.

For every slide that has `image_topic` + `image_visual` (or `image_prompt` as
the escape hatch), the script asks gpt-image-2 to render the ENTIRE slide
(text + 3D illustration + brand mark) as a single 16:9 PNG. The pptxgenjs
renderer then embeds the image full-bleed and skips all native text.

Visual direction is locked to the OpenCraft brand: soft 3D modern-SaaS hero
illustrations (Stripe / Linear / Apple keynote feel), centered compositions,
brand-blue gradient with a single teal-green accent — see `STYLE_BLOCK` and
the per-kind prompt builders below.

Workflow:
    bun scripts/render-ppt.ts <data.json> <draft.pptx>            # plain typography
    # user reviews + confirms
    python3 scripts/polish-deck.py <data.json> --out <polished.json>
    bun scripts/render-ppt.ts <polished.json> <final.pptx>        # fully-designed

Requires FAL_KEY (in .env at repo root, or environment variable).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.request import urlretrieve

import fal_client
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

if not os.environ.get("FAL_KEY"):
    raise SystemExit(
        "FAL_KEY not set.\n"
        "  1. Get a key: https://fal.ai/dashboard/keys\n"
        "  2. Add to .env at repo root:  FAL_KEY=your_key_here\n"
        "  3. Or:  export FAL_KEY=...  before running."
    )


# ═══════════════════════════════════════════════════════════════════════
#  STYLE_BLOCK — brand-locked visual direction shared by every prompt.
#
#  This is the canonical "house style" for OpenCraft pitch decks. It is
#  derived directly from brand/logo.png: three interlocking hands in a
#  blue-gradient triangle with a single teal-green palm accent. We
#  translate that DNA into slide illustrations:
#
#    • Bold, soft 3D forms (Stripe / Linear / Apple-keynote aesthetic).
#    • Rounded organic shapes — NEVER sharp-cornered flat vectors.
#    • Smooth blue gradient surfaces with subtle ambient-occlusion shadows.
#    • Exactly ONE teal-green accent per slide on the most important node.
#    • Generous whitespace; the illustration is a hero, not a background.
#    • Centered compositions (text frames the illustration above + below).
#
#  Do not soften this language — it is what makes the deck feel "OpenCraft".
# ═══════════════════════════════════════════════════════════════════════

STYLE_BLOCK = """\
STYLE — soft 3D modern-SaaS hero illustration, locked direction:
- Render as bold soft 3D illustrations in the visual language of Stripe / Linear / \
Apple-keynote marketing graphics. Rounded organic forms. Smooth gradient surfaces. \
Subtle ambient-occlusion / floor shadows for depth. Minimal and elegant — never \
cluttered, never busy.
- NOT photorealistic. NOT flat vector. NOT hand-drawn. NOT a literal 3D render with \
realistic textures — keep it stylized, clean, and brand-aligned.
- Editorial sans-serif typography for headlines (large, bold, dark navy).

PALETTE — strict, use ONLY these tones plus white for legibility:
- Background: pure white (#FFFFFF)
- Headlines and "OpenCraft" wordmark: deep navy (#141B2E)
- Primary 3D shape tones: electric blue (#2563EB) with light-blue (#84A1FF) gradient \
highlights; deeper navy (#141B2E) for grounding/heavier forms
- Single teal-green accent (#10A37F → soft turquoise gradient) used ONCE per slide on \
the most important focal element — mirrors the green palm in the OpenCraft logo
- Body copy and eyebrow labels: muted slate gray (#6E7990)
- Floor shadows: very faint warm slate, soft and diffuse

LAYOUT — centered composition (NEVER text-left / visual-right split):
- Thin electric-blue accent bar (≈6 px) across the very top of the slide
- All text elements horizontally centered relative to the slide
- The hero 3D illustration is centered horizontally and dominates the visual middle band
- Small "OpenCraft" wordmark in deep navy at the bottom-right corner
- Generous airy whitespace around the illustration; the deck must feel calm and premium

GLOBAL CONSTRAINTS:
- 16:9 aspect ratio
- NO photographs, NO faces, NO photorealistic textures
- NO flat-vector aesthetic, NO geometric infographic icons, NO line-art only — must \
read as soft 3D illustration
- NO logos beyond the OpenCraft wordmark, NO watermarks
"""


# ─── Per-kind prompt builders ──────────────────────────────────────────

def _quote(items: list[str]) -> str:
    return "\n".join(f'  {i+1}. "{s}"' for i, s in enumerate(items) if s)


def build_section_prompt(slide: dict) -> str:
    label    = slide.get("label", "")
    headline = slide.get("headline", "")
    subhead  = slide.get("subhead", "")
    topic    = slide.get("image_topic", "")
    visual   = slide.get("image_visual", "")

    return f"""\
A clean, fully-designed section-divider slide for an OpenCraft pitch deck. Aspect ratio 16:9.

LAYOUT (centered):
- Thin electric-blue accent bar across the very top.
- Top-center: uppercase eyebrow label in muted slate gray, generous letter-spacing.
- Below eyebrow: large bold dark-navy headline, centered, editorial sans-serif, \
≈64–80pt visual weight. Hero typography.
- Middle of the slide: the soft-3D hero illustration described under VISUAL — centered, \
dominating the visual middle band, anchored by a faint floor shadow.
- Below illustration: short one-line subhead in muted slate gray, centered.
- Bottom-right corner: small "OpenCraft" wordmark in deep navy.

VISUAL TOPIC: {topic}
VISUAL STRUCTURE: {visual}

{STYLE_BLOCK}
TEXT TO RENDER (these EXACT strings, correctly spelled, sharp and readable):
{_quote([label, headline, subhead, "OpenCraft"])}

NO other text in the image. NO labels on the illustration.
"""


def build_pillars_prompt(slide: dict) -> str:
    title    = slide.get("title", "")
    subtitle = slide.get("subtitle", "")
    pillars  = slide.get("pillars", [])
    topic    = slide.get("image_topic", "")
    visual   = slide.get("image_visual", "")

    pillar_lines = "\n".join(
        f'   Pillar {p.get("num", str(i+1))}: "{p.get("title","")}" — "{p.get("body","")}"'
        for i, p in enumerate(pillars)
    )

    strings: list[str] = [title, subtitle]
    for p in pillars:
        if p.get("num"):   strings.append(p["num"])
        if p.get("title"): strings.append(p["title"])
        if p.get("body"):  strings.append(p["body"])
    strings.append("OpenCraft")

    return f"""\
A clean, fully-designed pillars slide for an OpenCraft pitch deck. Aspect ratio 16:9.

LAYOUT (centered):
- Thin electric-blue accent bar across the very top.
- Top-center: bold dark-navy title in editorial sans-serif, centered. Optional muted \
slate gray subtitle directly below, centered.
- Middle: {len(pillars)} pillars arranged horizontally as equal-width columns, centered \
on the slide. Each pillar is rendered as a soft 3D form (a rounded podium, a floating \
glossy sphere, a stacked rounded prism — choose whichever reads most premium). One pillar \
carries the single teal-green accent; the others are blue-gradient. Each pillar shows: a \
floating numbered marker in electric blue ABOVE the 3D form, the bold pillar title in \
dark navy directly below the form, and a 2–3 line body paragraph in muted slate beneath \
the title.
- Bottom-right corner: small "OpenCraft" wordmark in deep navy.
- Subtle floor shadow under each pillar to ground the 3D forms.

PILLARS:
{pillar_lines}

VISUAL TOPIC: {topic}
VISUAL STRUCTURE: {visual}

{STYLE_BLOCK}
TEXT TO RENDER (these EXACT strings, correctly spelled and complete):
{_quote(strings)}
"""


def build_feature_prompt(slide: dict) -> str:
    eyebrow = slide.get("eyebrow", "")
    title   = slide.get("title", "")
    lead    = slide.get("lead", "")
    bullets = slide.get("bullets", [])
    price   = slide.get("price") or {}
    note    = slide.get("note", "")
    topic   = slide.get("image_topic", "")
    visual  = slide.get("image_visual", "")

    bullet_lines = "\n".join(f'   • "{b}"' for b in bullets)
    strings: list[str] = [eyebrow, title, lead, *bullets]
    if price.get("build"):
        strings.append(f"Harga Pembangunan: {price['build']}")
    if price.get("maintenance"):
        strings.append(f"Maintenance / Bulan: {price['maintenance']}")
    if note:
        strings.append(note)
    strings.append("OpenCraft")

    return f"""\
A clean, fully-designed feature slide for an OpenCraft pitch deck. Aspect ratio 16:9.

LAYOUT (centered):
- Thin electric-blue accent bar across the very top.
- Top-center: small uppercase eyebrow in electric blue (if present), then bold dark-navy \
title in editorial sans-serif, centered. Short italic muted-slate lead one line below the \
title, centered.
- Center-stage: a soft 3D hero illustration of the feature (NOT a UI mockup — keep it \
abstract and conceptual, see VISUAL below). Centered horizontally.
- Below illustration: bulleted feature list rendered as dark-navy body text with small \
electric-blue square bullets. Bullets are centered as a block (left-aligned within the \
block).
- Bottom-left: two compact price lines — "Harga Pembangunan: <value>" and "Maintenance / \
Bulan: <value>". Values in bold dark navy, labels in muted slate.
- Bottom-right corner: small "OpenCraft" wordmark in deep navy.

BULLETS:
{bullet_lines}

VISUAL TOPIC: {topic}
VISUAL STRUCTURE: {visual}

{STYLE_BLOCK}
TEXT TO RENDER (these EXACT strings, correctly spelled and complete):
{_quote(strings)}
"""


def build_stats_prompt(slide: dict) -> str:
    eyebrow  = slide.get("eyebrow", "")
    title    = slide.get("title", "")
    subtitle = slide.get("subtitle", "")
    stats    = slide.get("stats", [])
    takeaway = slide.get("takeaway", "")
    topic    = slide.get("image_topic", "")
    visual   = slide.get("image_visual", "")

    stat_lines = "\n".join(
        f'   • "{s.get("value","")}" — "{s.get("label","")}"' +
        (f' (caption: "{s["caption"]}")' if s.get("caption") else "")
        for s in stats
    )

    strings: list[str] = [eyebrow, title, subtitle]
    for s in stats:
        if s.get("value"):   strings.append(s["value"])
        if s.get("label"):   strings.append(s["label"])
        if s.get("caption"): strings.append(s["caption"])
    if takeaway:
        strings.append(takeaway)
    strings.append("OpenCraft")

    return f"""\
A clean, fully-designed stats slide for an OpenCraft pitch deck. Aspect ratio 16:9.

LAYOUT (centered):
- Thin electric-blue accent bar across the very top.
- Top-center: optional electric-blue eyebrow + bold dark-navy title + muted-slate \
subtitle, all centered.
- Middle: {len(stats)} stat tiles arranged in a clean row, horizontally centered. Each \
tile is a soft 3D rounded card (electric-blue gradient face, subtle floor shadow, slight \
inner highlight). The HUGE stat value floats above the tile in dark navy editorial bold; \
the label sits inside the tile in dark navy bold; the caption sits in muted slate below \
the label. ONE tile (the most important) gets a teal-green accent — gradient top edge or \
glowing rim.
- Below the tiles: italic teal-green takeaway line, centered.
- Bottom-right corner: small "OpenCraft" wordmark in deep navy.

STATS:
{stat_lines}

VISUAL TOPIC: {topic}
VISUAL STRUCTURE: {visual}

{STYLE_BLOCK}
TEXT TO RENDER (these EXACT strings, correctly spelled and complete):
{_quote(strings)}
"""


def build_chart_prompt(slide: dict) -> str:
    eyebrow    = slide.get("eyebrow", "")
    title      = slide.get("title", "")
    subtitle   = slide.get("subtitle", "")
    chart_type = slide.get("chartType", "bar")
    categories = slide.get("categories", [])
    series     = slide.get("series", [])
    unit       = slide.get("unit", "")
    takeaway   = slide.get("takeaway", "")
    topic      = slide.get("image_topic", "")
    visual     = slide.get("image_visual", "")

    cat_csv = ", ".join(f'"{c}"' for c in categories)
    series_lines = "\n".join(
        f'   Series "{s.get("name","")}": values = {s.get("values", [])}'
        for s in series
    )

    strings: list[str] = [eyebrow, title, subtitle, *categories]
    for s in series:
        if s.get("name"): strings.append(s["name"])
        for v in s.get("values", []):
            strings.append(str(v))
    if unit:     strings.append(unit)
    if takeaway: strings.append(takeaway)
    strings.append("OpenCraft")

    chart_visual = (
        "Vertical 3D bars sitting on a faint floor — each bar a smooth rounded prism with "
        "an electric-blue gradient face and a soft shadow. The tallest / most important "
        "bar carries the single teal-green accent on its top cap."
        if chart_type == "bar"
        else
        "A 3D donut ring rendered as a soft glossy torus, electric-blue gradient with one "
        "slice highlighted in teal-green. Subtle floor shadow underneath."
    )

    return f"""\
A clean, fully-designed chart slide for an OpenCraft pitch deck. Aspect ratio 16:9.

LAYOUT (centered):
- Thin electric-blue accent bar across the very top.
- Top-center: optional electric-blue eyebrow + bold dark-navy title + muted-slate \
subtitle, all centered.
- Middle: a soft 3D {chart_type} chart rendered as illustration (NOT a screenshot of \
Excel or Tableau). {chart_visual} Category labels under bars / around the donut in dark \
navy. Value labels on/near each data point in dark navy. Axis line in muted slate (bar \
chart only).
- Below chart: italic teal-green takeaway line, centered.
- Bottom-right corner: small "OpenCraft" wordmark in deep navy.

CHART DATA:
   Categories: {cat_csv}
{series_lines}
{f'   Unit: {unit}' if unit else ''}

VISUAL TOPIC: {topic}
VISUAL STRUCTURE: {visual}

{STYLE_BLOCK}
TEXT TO RENDER (these EXACT strings, correctly spelled and complete):
{_quote(strings)}
"""


def build_roadmap_prompt(slide: dict) -> str:
    title    = slide.get("title", "")
    subtitle = slide.get("subtitle", "")
    phases   = slide.get("phases", [])
    topic    = slide.get("image_topic", "")
    visual   = slide.get("image_visual", "")

    phase_lines = "\n".join(
        f'   Phase {p.get("phase","")} ({p.get("timing","")}): "{p.get("title","")}" — '
        f'deliverables = {p.get("deliverables", [])}, price = "{p.get("price","")}"'
        for p in phases
    )

    strings: list[str] = [title, subtitle]
    for p in phases:
        for k in ("phase", "timing", "title", "price"):
            if p.get(k): strings.append(p[k])
        strings.extend(p.get("deliverables", []))
    strings.append("OpenCraft")

    return f"""\
A clean, fully-designed roadmap slide for an OpenCraft pitch deck. Aspect ratio 16:9.

LAYOUT (centered):
- Thin electric-blue accent bar across the very top.
- Top-center: bold dark-navy title + muted-slate subtitle, centered.
- Middle: a horizontal 3D timeline of {len(phases)} phase cards arranged left-to-right, \
horizontally centered on the slide. Each card is a soft 3D rounded block (electric-blue \
gradient face, subtle floor shadow). The cards are connected by a smooth curved 3D path \
in electric blue with small glowing milestone nodes at each junction — ONE node in \
teal-green (the most important milestone). Each card shows: phase + timing label in \
small caps electric blue at the top of the card, phase title in bold dark navy, a short \
deliverables list in muted slate, and the phase price in bold dark navy at the bottom.
- Bottom-right corner: small "OpenCraft" wordmark in deep navy.

PHASES:
{phase_lines}

VISUAL TOPIC: {topic}
VISUAL STRUCTURE: {visual}

{STYLE_BLOCK}
TEXT TO RENDER (these EXACT strings, correctly spelled and complete):
{_quote(strings)}
"""


BUILDERS = {
    "section": build_section_prompt,
    "pillars": build_pillars_prompt,
    "feature": build_feature_prompt,
    "stats":   build_stats_prompt,
    "chart":   build_chart_prompt,
    "roadmap": build_roadmap_prompt,
}


def build_prompt(slide: dict) -> str | None:
    """Return the full prompt for a slide, or None if it shouldn't be polished."""
    if slide.get("image_prompt"):
        return slide["image_prompt"]  # escape hatch — raw prompt

    if not (slide.get("image_topic") and slide.get("image_visual")):
        return None

    builder = BUILDERS.get(slide.get("kind", ""))
    if not builder:
        return None
    return builder(slide)


def generate(idx: int, prompt: str, out_path: Path, quality: str) -> Path:
    """Generate one image via fal.ai gpt-image-2 and save it locally."""
    snippet = prompt.split("\n", 1)[0][:70]
    print(f"  [slide {idx:02d}] generating  ·  {snippet}…", flush=True)
    result = fal_client.subscribe(
        "fal-ai/gpt-image-2",
        arguments={
            "prompt":        prompt,
            "image_size":    "landscape_16_9",
            "quality":       quality,
            "output_format": "png",
            "num_images":    1,
        },
        with_logs=False,
    )
    images = result.get("images") or []
    if not images:
        raise RuntimeError(f"fal.ai returned no images: {result}")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    urlretrieve(images[0]["url"], out_path)
    print(f"  [slide {idx:02d}] ✓ saved → {out_path.relative_to(ROOT)}", flush=True)
    return out_path


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("data_in", help="Input deck JSON")
    ap.add_argument("--out",     required=True, help="Output JSON (with image_path filled)")
    ap.add_argument("--img-dir", default=str(ROOT / "tmp" / "deck_images"),
                    help="Where to save generated PNGs (default: tmp/deck_images/)")
    ap.add_argument("--workers", type=int, default=4,
                    help="Max parallel fal.ai calls (default: 4)")
    ap.add_argument("--quality", choices=["low", "medium", "high"], default="medium",
                    help="Image quality tier (default: medium)")
    ap.add_argument("--force",   action="store_true",
                    help="Regenerate even if image_path is already set")
    args = ap.parse_args()

    data_path = Path(args.data_in)
    if not data_path.exists():
        raise SystemExit(f"Data file not found: {data_path}")

    data    = json.loads(data_path.read_text())
    img_dir = Path(args.img_dir).resolve()
    img_dir.mkdir(parents=True, exist_ok=True)

    slides = data.get("slides", [])
    tasks: list[tuple[int, str, Path]] = []
    for i, slide in enumerate(slides):
        prompt = build_prompt(slide)
        if not prompt:
            continue
        if slide.get("image_path") and not args.force:
            continue
        tasks.append((i, prompt, img_dir / f"slide_{i:02d}.png"))

    if not tasks:
        print("Nothing to polish — no slides need image generation.")
        Path(args.out).write_text(json.dumps(data, indent=2) + "\n")
        return

    print(
        f"Polishing {len(tasks)} slide(s) via fal.ai gpt-image-2 "
        f"(quality={args.quality}, workers={args.workers})…\n"
    )

    errors: list[tuple[int, str]] = []
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = {ex.submit(generate, i, p, o, args.quality): (i, o) for i, p, o in tasks}
        for fut in as_completed(futures):
            i, out_path = futures[fut]
            try:
                path = fut.result()
                slides[i]["image_path"] = str(path.relative_to(ROOT))
            except Exception as e:
                errors.append((i, str(e)))
                print(f"  [slide {i:02d}] ✗ {e}", file=sys.stderr)

    Path(args.out).write_text(json.dumps(data, indent=2) + "\n")

    if errors:
        print(f"\nDone with {len(errors)} error(s). Wrote partial output to {args.out}.",
              file=sys.stderr)
        sys.exit(1)

    print(f"\n✓ Polish complete. Wrote {args.out}")
    print(f"  Next: bun scripts/render-ppt.ts {args.out} <output.pptx>")


if __name__ == "__main__":
    main()
