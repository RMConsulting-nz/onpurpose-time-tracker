// R Mackay Consulting brand palette + tint helpers.

export const BRAND_COLORS = [
  { key: 'terracotta', label: 'Terracotta', hex: '#C4472C' },
  { key: 'teal', label: 'Teal', hex: '#147D80' },
  { key: 'amber', label: 'Amber', hex: '#E0A02E' },
  { key: 'magenta', label: 'Magenta', hex: '#B5306E' },
  { key: 'turquoise', label: 'Turquoise', hex: '#2FA6A0' },
  { key: 'moss', label: 'Moss', hex: '#4A8B3F' },
];

function hexToRgb(hex) {
  const n = hex.replace('#', '');
  return {
    r: parseInt(n.substring(0, 2), 16),
    g: parseInt(n.substring(2, 4), 16),
    b: parseInt(n.substring(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  const c = (v) => Math.round(v).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

// Mixes `hex` toward white by `amount` (0 = original color, 1 = pure white).
export function mixWithWhite(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (v) => v + (255 - v) * amount;
  return rgbToHex(mix(r), mix(g), mix(b));
}

// 18 total swatches: 6 full brand colors + 6 pastel tints (~70% white) + 6 mid tints (~35% white).
export function buildSwatches() {
  const swatches = [];
  for (const c of BRAND_COLORS) {
    swatches.push({ id: `${c.key}-full`, hex: c.hex, label: `${c.label}` });
  }
  for (const c of BRAND_COLORS) {
    swatches.push({ id: `${c.key}-mid`, hex: mixWithWhite(c.hex, 0.35), label: `${c.label} mid` });
  }
  for (const c of BRAND_COLORS) {
    swatches.push({ id: `${c.key}-pastel`, hex: mixWithWhite(c.hex, 0.7), label: `${c.label} pastel` });
  }
  return swatches;
}

export const SWATCHES = buildSwatches();

// Picks a readable text color (dark or white) for a given background hex.
export function textColorFor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#241C16' : '#FFFFFF';
}

export function defaultZoneColor(index) {
  const bases = BRAND_COLORS;
  return bases[index % bases.length].hex;
}
