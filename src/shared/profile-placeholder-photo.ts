// Copyright (c) 2026 Manjeet2684. All rights reserved.

/**
 * Build a deterministic, self-contained SVG avatar for fictional seeded profiles.
 * This avoids contacting a third-party image host and leaking demo visitors'
 * network metadata to that host.
 */
const AVATAR_BACKGROUNDS = [
  "#334155", "#475569", "#365E68", "#6B526D",
  "#8A5A44", "#4F647D", "#58634A", "#765C70",
] as const;

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&apos;";
      default: return character;
    }
  });
}

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  const firstWord = words[0] ?? "";
  const lastWord = words[words.length - 1] ?? "";
  const initials = words.length >= 2
    ? `${Array.from(firstWord)[0] ?? ""}${Array.from(lastWord)[0] ?? ""}`
    : Array.from(firstWord).slice(0, 2).join("");
  return escapeXml(initials.toLocaleUpperCase("en-US") || "YU");
}

export function createPlaceholderProfilePhotoUrl(name: string, variant: number): string {
  const safeVariant = Number.isSafeInteger(variant) ? Math.abs(variant) : 0;
  const background = AVATAR_BACKGROUNDS[safeVariant % AVATAR_BACKGROUNDS.length] ?? AVATAR_BACKGROUNDS[0];
  const initials = initialsFor(name);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="760" viewBox="0 0 600 760">',
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">',
    `<stop offset="0%" stop-color="${background}"/><stop offset="100%" stop-color="#18212F"/>`,
    '</linearGradient></defs>',
    '<rect width="600" height="760" rx="36" fill="url(#bg)"/>',
    '<circle cx="300" cy="260" r="148" fill="#FFFFFF" fill-opacity=".10"/>',
    '<circle cx="300" cy="260" r="116" fill="#FFFFFF" fill-opacity=".08"/>',
    `<text x="300" y="315" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="132" font-weight="600">${initials}</text>`,
    '<path d="M72 760c22-144 107-220 228-220s206 76 228 220" fill="#FFFFFF" fill-opacity=".10"/>',
    '<text x="300" y="690" text-anchor="middle" fill="#FFFFFF" fill-opacity=".82" font-family="Arial, sans-serif" font-size="24" letter-spacing="5">YUGORA</text>',
    '</svg>',
  ].join("");
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
