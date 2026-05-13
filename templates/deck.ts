/**
 * PowerPoint deck template — opening + closing slides only.
 *
 * Built with `pptxgenjs` (industry-standard .pptx generator for Node).
 * Brand colors / logo come from data/brand.json + brand/logo.png.
 *
 * Cover slide  : orange top bar, logo top-left, big title centered,
 *                client block bottom-left, date bottom-right.
 * Closing slide: navy background, white "Terima Kasih" headline,
 *                contact info + logo, thin orange bottom bar.
 */
import PptxGenJS from "pptxgenjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brand } from "../templates/shared/brand";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, "../brand/logo.png");

// ─── Brand palette (mirrors data/brand-guidelines.json — extracted from
// opencraft-landing.netlify.app). pptxgenjs takes hex WITHOUT '#'.
const COLORS = {
  primary:     "2563EB",   // Brand Blue (Tailwind blue-600)
  primaryDark: "1E4FCC",
  accent:      "10A37F",   // AI Green
  ink:         "141B2E",   // Headings / inverted bg
  text:        "141B2E",
  textMuted:   "6E7990",
  textFaint:   "B7BFCC",
  slateSoft:   "C8CFD9",
  white:       "FFFFFF",
  bg:          "FFFFFF",
};

export interface DeckData {
  title: string;
  subtitle?: string;
  client?: string;
  date?: string;
  closing_headline?: string;
}

export function buildDeck(data: DeckData): PptxGenJS {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE";
  pres.title  = data.title;
  pres.author = brand.name;
  pres.company = brand.name;

  // Slide dimensions in inches (LAYOUT_WIDE = 13.333 × 7.5)
  const W = 13.333;
  const H = 7.5;

  // ─── COVER SLIDE ──────────────────────────────────────────────────
  const cover = pres.addSlide();
  cover.background = { color: COLORS.bg };

  // Top accent bar
  cover.addShape("rect", {
    x: 0, y: 0, w: W, h: 0.18,
    fill: { color: COLORS.accent },
    line: { color: COLORS.accent },
  });

  // Logo top-left
  cover.addImage({
    path: LOGO_PATH,
    x: 0.6, y: 0.55, w: 1.1, h: 1.1,
  });

  // Tagline next to logo
  cover.addText(brand.tagline.toUpperCase(), {
    x: 1.85, y: 1.0, w: 5, h: 0.3,
    fontSize: 10,
    fontFace: "Calibri",
    color: COLORS.textMuted,
    bold: true,
    charSpacing: 4,
  });

  // Main title — centered vertically in middle band
  cover.addText(data.title, {
    x: 0.6, y: 2.7, w: W - 1.2, h: 1.3,
    fontSize: 44,
    fontFace: "Calibri",
    bold: true,
    color: COLORS.text,
    align: "left",
    valign: "middle",
  });

  if (data.subtitle) {
    cover.addText(data.subtitle, {
      x: 0.6, y: 4.0, w: W - 1.2, h: 0.6,
      fontSize: 20,
      fontFace: "Calibri",
      color: COLORS.textMuted,
      align: "left",
    });
  }

  // Thin accent rule between title block and meta
  cover.addShape("rect", {
    x: 0.6, y: 5.4, w: 0.6, h: 0.08,
    fill: { color: COLORS.accent },
    line: { color: COLORS.accent },
  });

  // Client block bottom-left
  if (data.client) {
    cover.addText("DISIAPKAN UNTUK", {
      x: 0.6, y: 5.7, w: 4, h: 0.3,
      fontSize: 9, fontFace: "Calibri", bold: true,
      color: COLORS.textFaint, charSpacing: 3,
    });
    cover.addText(data.client, {
      x: 0.6, y: 6.0, w: 6, h: 0.5,
      fontSize: 18, fontFace: "Calibri", bold: true,
      color: COLORS.text,
    });
  }

  // Date bottom-right
  if (data.date) {
    cover.addText("DATE", {
      x: W - 3, y: 5.7, w: 2.4, h: 0.3,
      fontSize: 9, fontFace: "Calibri", bold: true,
      color: COLORS.textFaint, charSpacing: 3,
      align: "right",
    });
    cover.addText(data.date, {
      x: W - 3, y: 6.0, w: 2.4, h: 0.5,
      fontSize: 16, fontFace: "Calibri",
      color: COLORS.text,
      align: "right",
    });
  }

  // ─── CLOSING SLIDE ────────────────────────────────────────────────
  const closing = pres.addSlide();
  closing.background = { color: COLORS.ink };

  // Bottom accent bar (brand blue — keeps continuity with cover top bar)
  closing.addShape("rect", {
    x: 0, y: H - 0.18, w: W, h: 0.18,
    fill: { color: COLORS.primary },
    line: { color: COLORS.primary },
  });

  // Headline centered
  closing.addText(data.closing_headline ?? "Terima Kasih", {
    x: 0, y: 2.2, w: W, h: 1.5,
    fontSize: 60,
    fontFace: "Calibri",
    bold: true,
    color: COLORS.white,
    align: "center",
  });

  // Decorative rule under headline — brand blue accent
  closing.addShape("rect", {
    x: W / 2 - 0.4, y: 3.85, w: 0.8, h: 0.08,
    fill: { color: COLORS.primary },
    line: { color: COLORS.primary },
  });

  // Subline
  closing.addText("Mari berkolaborasi untuk transformasi AI bisnis Anda.", {
    x: 0, y: 4.1, w: W, h: 0.5,
    fontSize: 16,
    fontFace: "Calibri",
    italic: true,
    color: COLORS.slateSoft,
    align: "center",
  });

  // Contact info — single line, centered
  const contactLine = `${brand.contact.email}    ·    ${brand.contact.phone}    ·    ${brand.contact.website}`;
  closing.addText(contactLine, {
    x: 0, y: 5.3, w: W, h: 0.4,
    fontSize: 13,
    fontFace: "Calibri",
    color: COLORS.white,
    align: "center",
  });

  // Logo bottom-right (small)
  closing.addImage({
    path: LOGO_PATH,
    x: W - 1.5, y: H - 1.6, w: 1.0, h: 1.0,
  });

  // Company name + tagline bottom-left
  closing.addText(brand.name, {
    x: 0.6, y: H - 1.4, w: 4, h: 0.4,
    fontSize: 16, fontFace: "Calibri", bold: true,
    color: COLORS.white,
  });
  closing.addText(brand.tagline.toUpperCase(), {
    x: 0.6, y: H - 1.0, w: 4, h: 0.3,
    fontSize: 9, fontFace: "Calibri",
    color: COLORS.slateSoft, charSpacing: 3,
  });

  return pres;
}
