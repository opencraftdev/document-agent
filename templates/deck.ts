/**
 * PowerPoint deck template — DRAFT MODE is plain typography only.
 *
 * Built with `pptxgenjs`. Brand colors / logo come from data/brand.json +
 * brand/logo.png.
 *
 * Two rendering modes per content slide:
 *
 *   1. PLAIN CONTENT (default) — typography only. No diagrams, no charts,
 *      no decorative shapes, no badges, no tiles. This is the cheap fast
 *      draft the user reviews before paying for image generation.
 *
 *   2. FULL-BLEED (after polish) — if `image_path` is set on the slide
 *      data, the AI-generated image IS the entire slide. The renderer
 *      skips all native text/chrome — the image already contains
 *      headline, body, visualization, and brand mark baked in.
 *
 * Diagrams and visualizations live ONLY in the polish step
 * (`scripts/polish-deck.py` → fal.ai gpt-image-2). See CLAUDE.md → Deck
 * conventions for the prompt convention.
 */
import PptxGenJS from "pptxgenjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brand } from "../templates/shared/brand";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, "../brand/logo.png");

// ─── Brand palette ───────────────────────────────────────────────────
const COLORS = {
  primary:     "2563EB",
  accent:      "10A37F",
  ink:         "141B2E",
  inkSoft:     "23304A",
  text:        "141B2E",
  textMuted:   "6E7990",
  textFaint:   "B7BFCC",
  slateSoft:   "C8CFD9",
  surface:     "F5F7FB",
  border:      "E2E6EE",
  white:       "FFFFFF",
  bg:          "FFFFFF",
};

// ─── Slide types ─────────────────────────────────────────────────────

/**
 * Common polish-pipeline fields available on every content slide.
 *
 *   image_topic  — one-sentence "what does this slide say".
 *   image_visual — 2–4 sentences describing the visual structure.
 *   image_prompt — raw escape-hatch prompt (bypasses brand scaffold).
 *   image_path   — set automatically by polish-deck.py after generation;
 *                  when present, the renderer goes full-bleed and
 *                  skips all native text/chrome for this slide.
 */
export interface Polishable {
  image_topic?:  string;
  image_visual?: string;
  image_prompt?: string;
  image_path?:   string;
}

export type ContentSlide =
  | SectionSlide
  | PillarsSlide
  | FeatureSlide
  | StatsSlide
  | ChartSlide
  | RoadmapSlide;

export interface SectionSlide extends Polishable {
  kind: "section";
  label: string;
  headline: string;
  subhead?: string;
}

export interface PillarsSlide extends Polishable {
  kind: "pillars";
  title: string;
  subtitle?: string;
  pillars: { num: string; title: string; body: string }[];
}

export interface FeatureSlide extends Polishable {
  kind: "feature";
  eyebrow?: string;
  title: string;
  lead: string;
  bullets: string[];
  price?: { build: string; maintenance: string };
  note?: string;
}

export interface StatsSlide extends Polishable {
  kind: "stats";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  stats: { value: string; label: string; caption?: string }[];
  takeaway?: string;
}

export interface ChartSlide extends Polishable {
  kind: "chart";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  chartType: "bar" | "donut";        // hint for polish prompt only — no native chart rendering
  categories: string[];
  series: { name: string; values: number[] }[];
  unit?: string;
  takeaway?: string;
}

export interface RoadmapSlide extends Polishable {
  kind: "roadmap";
  title: string;
  subtitle?: string;
  phases: {
    phase: string;
    timing: string;
    title: string;
    deliverables: string[];
    price: string;
  }[];
}

export interface DeckData {
  title: string;
  subtitle?: string;
  client?: string;
  date?: string;
  closing_headline?: string;
  closing_subline?: string;
  slides?: ContentSlide[];
}

// ─── Layout constants ────────────────────────────────────────────────
const W = 13.333;
const H = 7.5;

// ─── Page chrome (small, typography-only) ────────────────────────────
function addContentChrome(slide: PptxGenJS.Slide, pageNum: number, totalPages: number) {
  // Thin brand-blue accent bar across the top
  slide.addShape("rect", {
    x: 0, y: 0, w: W, h: 0.06,
    fill: { color: COLORS.primary }, line: { color: COLORS.primary },
  });

  // Logo + brand name top-left
  slide.addImage({ path: LOGO_PATH, x: 0.55, y: 0.28, w: 0.45, h: 0.45 });
  slide.addText(brand.name, {
    x: 1.05, y: 0.32, w: 3, h: 0.4,
    fontSize: 12, fontFace: "Calibri", bold: true, color: COLORS.text,
  });

  // Page number top-right
  slide.addText(`${String(pageNum).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`, {
    x: W - 1.5, y: 0.32, w: 1, h: 0.4,
    fontSize: 10, fontFace: "Calibri", color: COLORS.textFaint, align: "right",
  });

  // Bottom brand strip
  slide.addText(`${brand.name} · ${brand.tagline}`, {
    x: 0.6, y: H - 0.45, w: W - 1.2, h: 0.3,
    fontSize: 8, fontFace: "Calibri", color: COLORS.textFaint, charSpacing: 2,
  });
}

// ─── Slide renderers (PLAIN CONTENT ONLY — no diagrams) ──────────────

function renderSection(slide: PptxGenJS.Slide, data: SectionSlide) {
  slide.background = { color: COLORS.bg };

  // Eyebrow — small, centered, uppercase
  slide.addText(data.label, {
    x: 0.6, y: 1.6, w: W - 1.2, h: 0.4,
    fontSize: 12, fontFace: "Calibri", bold: true,
    color: COLORS.primary, charSpacing: 6, align: "center",
  });

  // Headline — billboard scale, centered
  slide.addText(data.headline, {
    x: 0.6, y: 2.4, w: W - 1.2, h: 2.6,
    fontSize: 64, fontFace: "Calibri", bold: true,
    color: COLORS.text, valign: "middle", align: "center",
  });

  // Subhead — short one line, centered, smaller
  if (data.subhead) {
    slide.addText(data.subhead, {
      x: 1.5, y: 5.3, w: W - 3.0, h: 1.2,
      fontSize: 18, fontFace: "Calibri",
      color: COLORS.textMuted, valign: "top", align: "center",
    });
  }
}

function renderPillars(slide: PptxGenJS.Slide, data: PillarsSlide) {
  slide.background = { color: COLORS.bg };

  slide.addText(data.title, {
    x: 0.6, y: 1.1, w: W - 1.2, h: 0.9,
    fontSize: 44, fontFace: "Calibri", bold: true,
    color: COLORS.text, align: "center",
  });
  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 1.5, y: 2.15, w: W - 3.0, h: 0.5,
      fontSize: 16, fontFace: "Calibri",
      color: COLORS.textMuted, align: "center",
    });
  }

  const startY = 3.4;
  const rowH   = 1.0;
  data.pillars.forEach((p, i) => {
    const y = startY + i * rowH;

    slide.addText(p.num, {
      x: 0.8, y, w: 1.0, h: rowH,
      fontSize: 32, fontFace: "Calibri", bold: true,
      color: COLORS.primary, valign: "top",
    });

    slide.addText(p.title, {
      x: 2.0, y, w: W - 2.6, h: 0.45,
      fontSize: 20, fontFace: "Calibri", bold: true,
      color: COLORS.text, valign: "top",
    });

    slide.addText(p.body, {
      x: 2.0, y: y + 0.45, w: W - 2.6, h: 0.5,
      fontSize: 13, fontFace: "Calibri", color: COLORS.textMuted, valign: "top",
    });
  });
}

function renderFeature(slide: PptxGenJS.Slide, data: FeatureSlide) {
  slide.background = { color: COLORS.bg };

  if (data.eyebrow) {
    slide.addText(data.eyebrow, {
      x: 0.6, y: 1.1, w: W - 1.2, h: 0.3,
      fontSize: 11, fontFace: "Calibri", bold: true,
      color: COLORS.primary, charSpacing: 5, align: "center",
    });
  }

  slide.addText(data.title, {
    x: 0.6, y: 1.55, w: W - 1.2, h: 1.0,
    fontSize: 44, fontFace: "Calibri", bold: true,
    color: COLORS.text, align: "center",
  });

  slide.addText(data.lead, {
    x: 1.5, y: 2.7, w: W - 3.0, h: 0.6,
    fontSize: 17, fontFace: "Calibri", color: COLORS.textMuted, italic: true,
    align: "center",
  });

  const bullets = data.bullets.map(b => ({
    text: b,
    options: { bullet: { code: "25A0" } },
  }));
  slide.addText(bullets, {
    x: 2.0, y: 3.7, w: W - 4.0, h: 2.5,
    fontSize: 16, fontFace: "Calibri", color: COLORS.text,
    paraSpaceAfter: 8, valign: "top",
  });

  if (data.price) {
    slide.addText([
      { text: "Harga Pembangunan:  ", options: { color: COLORS.textMuted } },
      { text: data.price.build,      options: { bold: true, color: COLORS.text } },
    ], {
      x: 0.6, y: H - 1.6, w: W - 1.2, h: 0.35,
      fontSize: 13, fontFace: "Calibri",
    });
    slide.addText([
      { text: "Maintenance / Bulan:  ", options: { color: COLORS.textMuted } },
      { text: data.price.maintenance, options: { bold: true, color: COLORS.text } },
    ], {
      x: 0.6, y: H - 1.2, w: W - 1.2, h: 0.35,
      fontSize: 13, fontFace: "Calibri",
    });
  }

  if (data.note) {
    slide.addText(data.note, {
      x: 0.6, y: H - 0.75, w: W - 1.2, h: 0.3,
      fontSize: 10, fontFace: "Calibri", color: COLORS.textMuted, italic: true,
    });
  }
}

function renderStats(slide: PptxGenJS.Slide, data: StatsSlide) {
  slide.background = { color: COLORS.bg };

  if (data.eyebrow) {
    slide.addText(data.eyebrow, {
      x: 0.6, y: 1.1, w: W - 1.2, h: 0.3,
      fontSize: 11, fontFace: "Calibri", bold: true,
      color: COLORS.primary, charSpacing: 5, align: "center",
    });
  }
  slide.addText(data.title, {
    x: 0.6, y: 1.55, w: W - 1.2, h: 1.0,
    fontSize: 44, fontFace: "Calibri", bold: true,
    color: COLORS.text, align: "center",
  });
  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 1.5, y: 2.7, w: W - 3.0, h: 0.5,
      fontSize: 16, fontFace: "Calibri",
      color: COLORS.textMuted, align: "center",
    });
  }

  // Plain rows — value (massive), label (bold), caption (muted)
  const startY = 3.7;
  const rowH   = 0.95;
  data.stats.forEach((s, i) => {
    const y = startY + i * rowH;

    slide.addText(s.value, {
      x: 0.8, y, w: 3.0, h: rowH,
      fontSize: 44, fontFace: "Calibri", bold: true,
      color: COLORS.primary, valign: "top",
    });

    slide.addText(s.label, {
      x: 4.2, y: y + 0.05, w: W - 4.9, h: 0.45,
      fontSize: 16, fontFace: "Calibri", bold: true,
      color: COLORS.text, valign: "top",
    });

    if (s.caption) {
      slide.addText(s.caption, {
        x: 4.2, y: y + 0.5, w: W - 4.9, h: 0.45,
        fontSize: 12, fontFace: "Calibri",
        color: COLORS.textMuted, italic: true, valign: "top",
      });
    }
  });

  if (data.takeaway) {
    slide.addText(data.takeaway, {
      x: 0.6, y: H - 1.05, w: W - 1.2, h: 0.45,
      fontSize: 14, fontFace: "Calibri", bold: true, italic: true,
      color: COLORS.accent, align: "center",
    });
  }
}

function renderChart(slide: PptxGenJS.Slide, data: ChartSlide) {
  slide.background = { color: COLORS.bg };

  if (data.eyebrow) {
    slide.addText(data.eyebrow, {
      x: 0.6, y: 1.1, w: W - 1.2, h: 0.3,
      fontSize: 11, fontFace: "Calibri", bold: true,
      color: COLORS.primary, charSpacing: 5, align: "center",
    });
  }
  slide.addText(data.title, {
    x: 0.6, y: 1.55, w: W - 1.2, h: 1.0,
    fontSize: 40, fontFace: "Calibri", bold: true,
    color: COLORS.text, align: "center",
  });
  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 1.5, y: 2.7, w: W - 3.0, h: 0.5,
      fontSize: 16, fontFace: "Calibri",
      color: COLORS.textMuted, align: "center",
    });
  }

  // Plain data table (no actual chart rendered — polish step does the viz)
  const colCount = data.categories.length + 1;     // +1 for series-name col
  const colW     = (W - 1.2) / colCount;
  const headerY  = 3.1;
  const rowH     = 0.4;

  // Header row
  slide.addText("Kategori", {
    x: 0.6, y: headerY, w: colW, h: rowH,
    fontSize: 11, fontFace: "Calibri", bold: true, color: COLORS.textMuted,
    charSpacing: 1,
  });
  data.categories.forEach((cat, i) => {
    slide.addText(cat, {
      x: 0.6 + (i + 1) * colW, y: headerY, w: colW, h: rowH,
      fontSize: 11, fontFace: "Calibri", bold: true, color: COLORS.textMuted,
      align: "right",
    });
  });

  // Series rows
  data.series.forEach((s, i) => {
    const y = headerY + (i + 1) * rowH;
    slide.addText(s.name, {
      x: 0.6, y, w: colW, h: rowH,
      fontSize: 12, fontFace: "Calibri", color: COLORS.text,
    });
    s.values.forEach((v, j) => {
      slide.addText(String(v), {
        x: 0.6 + (j + 1) * colW, y, w: colW, h: rowH,
        fontSize: 12, fontFace: "Calibri", color: COLORS.text,
        align: "right",
      });
    });
  });

  if (data.unit) {
    slide.addText(`Satuan: ${data.unit}`, {
      x: 0.6, y: H - 1.45, w: W - 1.2, h: 0.3,
      fontSize: 10, fontFace: "Calibri", italic: true, color: COLORS.textMuted,
    });
  }

  if (data.takeaway) {
    slide.addText(data.takeaway, {
      x: 0.6, y: H - 1.05, w: W - 1.2, h: 0.45,
      fontSize: 13, fontFace: "Calibri", bold: true, italic: true,
      color: COLORS.accent, align: "center",
    });
  }
}

function renderRoadmap(slide: PptxGenJS.Slide, data: RoadmapSlide) {
  slide.background = { color: COLORS.bg };

  slide.addText(data.title, {
    x: 0.6, y: 1.1, w: W - 1.2, h: 0.9,
    fontSize: 40, fontFace: "Calibri", bold: true,
    color: COLORS.text, align: "center",
  });
  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 1.5, y: 2.1, w: W - 3.0, h: 0.5,
      fontSize: 16, fontFace: "Calibri",
      color: COLORS.textMuted, align: "center",
    });
  }

  // Vertical phase list — each row: phase·timing | title | deliverables | price
  const startY = 2.8;
  const phaseH = 1.1;
  data.phases.forEach((p, i) => {
    const y = startY + i * phaseH;

    slide.addText(`${p.phase}  ·  ${p.timing}`, {
      x: 0.6, y, w: 3.5, h: 0.35,
      fontSize: 12, fontFace: "Calibri", bold: true,
      color: COLORS.primary, charSpacing: 2,
    });

    slide.addText(p.title, {
      x: 0.6, y: y + 0.32, w: W - 4.2, h: 0.35,
      fontSize: 14, fontFace: "Calibri", bold: true,
      color: COLORS.text, valign: "top",
    });

    slide.addText(p.deliverables.join("  ·  "), {
      x: 0.6, y: y + 0.68, w: W - 4.2, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: COLORS.textMuted,
    });

    slide.addText(p.price, {
      x: W - 3.4, y: y + 0.18, w: 2.8, h: 0.5,
      fontSize: 14, fontFace: "Calibri", bold: true,
      color: COLORS.primary, align: "right",
    });
  });
}

// ─── Cover & closing (plain typography) ──────────────────────────────

function renderCover(pres: PptxGenJS, data: DeckData) {
  const cover = pres.addSlide();
  cover.background = { color: COLORS.bg };

  // Thin brand-blue accent bar at top
  cover.addShape("rect", {
    x: 0, y: 0, w: W, h: 0.08,
    fill: { color: COLORS.primary }, line: { color: COLORS.primary },
  });

  cover.addImage({ path: LOGO_PATH, x: 0.6, y: 0.55, w: 1.1, h: 1.1 });
  cover.addText(brand.tagline.toUpperCase(), {
    x: 1.85, y: 1.0, w: 5, h: 0.3,
    fontSize: 10, fontFace: "Calibri", bold: true,
    color: COLORS.textMuted, charSpacing: 4,
  });

  cover.addText(data.title, {
    x: 0.6, y: 2.7, w: W - 1.2, h: 1.7,
    fontSize: 44, fontFace: "Calibri", bold: true,
    color: COLORS.text, valign: "middle",
  });

  if (data.subtitle) {
    cover.addText(data.subtitle, {
      x: 0.6, y: 4.45, w: W - 1.2, h: 1.0,
      fontSize: 17, fontFace: "Calibri",
      color: COLORS.textMuted, valign: "top",
    });
  }

  if (data.client) {
    cover.addText("DISIAPKAN UNTUK", {
      x: 0.6, y: 5.85, w: 4, h: 0.3,
      fontSize: 9, fontFace: "Calibri", bold: true,
      color: COLORS.textFaint, charSpacing: 3,
    });
    cover.addText(data.client, {
      x: 0.6, y: 6.15, w: 6, h: 0.5,
      fontSize: 18, fontFace: "Calibri", bold: true, color: COLORS.text,
    });
  }

  if (data.date) {
    cover.addText("TANGGAL", {
      x: W - 3, y: 5.85, w: 2.4, h: 0.3,
      fontSize: 9, fontFace: "Calibri", bold: true,
      color: COLORS.textFaint, charSpacing: 3, align: "right",
    });
    cover.addText(data.date, {
      x: W - 3, y: 6.15, w: 2.4, h: 0.5,
      fontSize: 16, fontFace: "Calibri", color: COLORS.text, align: "right",
    });
  }
}

function renderClosing(pres: PptxGenJS, data: DeckData) {
  const closing = pres.addSlide();
  closing.background = { color: COLORS.ink };

  // Bottom brand-blue accent bar
  closing.addShape("rect", {
    x: 0, y: H - 0.08, w: W, h: 0.08,
    fill: { color: COLORS.primary }, line: { color: COLORS.primary },
  });

  closing.addText(data.closing_headline ?? "Terima Kasih", {
    x: 0, y: 2.5, w: W, h: 1.5,
    fontSize: 60, fontFace: "Calibri", bold: true,
    color: COLORS.white, align: "center",
  });

  closing.addText(
    data.closing_subline ?? "Mari berkolaborasi untuk transformasi AI bisnis Anda.",
    {
      x: 0, y: 4.2, w: W, h: 0.5,
      fontSize: 16, fontFace: "Calibri", italic: true,
      color: COLORS.slateSoft, align: "center",
    },
  );

  const contactLine = `${brand.contact.email}    ·    ${brand.contact.phone}    ·    ${brand.contact.website}`;
  closing.addText(contactLine, {
    x: 0, y: 5.3, w: W, h: 0.4,
    fontSize: 13, fontFace: "Calibri", color: COLORS.white, align: "center",
  });

  closing.addImage({ path: LOGO_PATH, x: W - 1.5, y: H - 1.6, w: 1.0, h: 1.0 });
  closing.addText(brand.name, {
    x: 0.6, y: H - 1.4, w: 4, h: 0.4,
    fontSize: 16, fontFace: "Calibri", bold: true, color: COLORS.white,
  });
  closing.addText(brand.tagline.toUpperCase(), {
    x: 0.6, y: H - 1.0, w: 4, h: 0.3,
    fontSize: 9, fontFace: "Calibri",
    color: COLORS.slateSoft, charSpacing: 3,
  });
}

// ─── Main builder ────────────────────────────────────────────────────
export function buildDeck(data: DeckData): PptxGenJS {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE";
  pres.title   = data.title;
  pres.author  = brand.name;
  pres.company = brand.name;

  const contentSlides = data.slides ?? [];
  const totalPages    = contentSlides.length + 2;

  renderCover(pres, data);

  contentSlides.forEach((slideData, idx) => {
    const slide = pres.addSlide();

    // Polished: AI image IS the slide — skip native rendering entirely.
    if (slideData.image_path) {
      slide.background = { color: COLORS.bg };
      slide.addImage({
        path: slideData.image_path,
        x: 0, y: 0, w: W, h: H,
        sizing: { type: "cover", w: W, h: H },
      });
      return;
    }

    // Draft: plain typography + page chrome
    addContentChrome(slide, idx + 2, totalPages);
    switch (slideData.kind) {
      case "section":  renderSection(slide, slideData);  break;
      case "pillars":  renderPillars(slide, slideData);  break;
      case "feature":  renderFeature(slide, slideData);  break;
      case "stats":    renderStats(slide, slideData);    break;
      case "chart":    renderChart(slide, slideData);    break;
      case "roadmap":  renderRoadmap(slide, slideData);  break;
    }
  });

  renderClosing(pres, data);

  return pres;
}
