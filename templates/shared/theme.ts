/**
 * Brand theme — keep in sync with data/brand-guidelines.json
 * (the JSON is the canonical spec; this file is its TypeScript runtime mirror).
 *
 * Palette derived from opencraft-landing.netlify.app (Tailwind blue-600 +
 * AI green + slate scale).
 */

export const colors = {
  // Brand
  primary:      "#2563EB",   // Brand Blue (Tailwind blue-600)
  primaryDark:  "#1E4FCC",   // Hover / deeper emphasis
  primaryLight: "#4E72EB",   // Subtle highlights
  primarySoft:  "#84A1FF",   // Decorative gradient pair

  accent:       "#10A37F",   // AI Green — automation/success emphasis
  accentSoft:   "#E8F7F1",   // Light fill behind green text

  // Text
  ink:          "#141B2E",   // Headings on light surfaces
  text:         "#141B2E",   // Body text
  textMuted:    "#6E7990",   // Slate-500 — labels, captions
  textFaint:    "#B7BFCC",   // Slate-400 — footer text, legal copy
  textHeading:  "#0F1422",   // Deeper heading ink

  // Backgrounds
  bg:           "#FFFFFF",
  bgSubtle:     "#F8F9FA",   // Party boxes, milestone cards
  bgAlt:        "#F8F9FA",   // alias of bgSubtle for back-compat
  bgPackage:    "#F5F7FB",   // Paket card, total row, package band
  bgAccent:     "#EFF4FF",   // light brand-blue tint
  bgInverted:   "#141B2E",   // Closing slide / inverted hero

  // Borders
  border:       "#D9DCE2",   // Slate-200
  borderLight:  "#E5E7EB",   // Footer divider
  borderMid:    "#C8CFD9",   // Table border

  // Status
  optional:     "#C1272D",   // (Optional) tags — kept red for visibility
};

export const fontSize = {
  xs:   7.5,
  sm:   9,
  base: 10.5,
  md:   11,
  lg:   12,
  xl:   14,
  h2:   16,
  h1:   22,
  hero: 60,
};

// react-pdf has Helvetica built-in. To upgrade to Plus Jakarta Sans
// (the actual web font), register TTF via Font.register() once and swap
// these values to "Plus Jakarta Sans" + weight variants.
export const font = {
  regular:    "Helvetica",
  bold:       "Helvetica-Bold",
  italic:     "Helvetica-Oblique",
  boldItalic: "Helvetica-BoldOblique",
};

// page padding (pts): top right bottom left
export const pagePadding = { top: 40, right: 50, bottom: 90, left: 50 };
