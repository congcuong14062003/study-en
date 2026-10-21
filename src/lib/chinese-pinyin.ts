/** Comparable readings: preserve tone/ü distinctions; unstressed syllables are tone 5. */
export function normalizeChineseReading(value: string) {
  return value.toLowerCase().trim().split(/[\s’']+/u).map((syllable) => {
    const decomposed = syllable.replaceAll("u:", "ü").normalize("NFD");
    const mark = /[\u0304\u0301\u030c\u0300]/u.exec(decomposed)?.[0];
    const tones: Record<string, number> = { "\u0304": 1, "\u0301": 2, "\u030c": 3, "\u0300": 4 };
    const tone = /[1-5]$/u.exec(syllable)?.[0] || (mark ? tones[mark] : 5);
    const base = decomposed.replace(/u\u0308/gu, "v").replace(/[^a-z]/gu, "");
    return base ? `${base}${tone}` : "";
  }).join("");
}
