import { hanziCharacters } from "./hanzi-strokes";

/** Local conversion: lazy-load the dictionary only when a learner requests Pinyin. */
export async function chinesePinyinReading(text: string, savedPinyin?: string | null) {
  if (!hanziCharacters(text).length) return "";
  if (savedPinyin?.trim()) return savedPinyin.trim();
  const { pinyin } = await import("pinyin-pro");
  return pinyin(text, { toneType: "symbol", type: "array", nonZh: "consecutive", toneSandhi: false })
    .join(" ").replace(/\s+([，。！？；：、,.!?;:])/gu, "$1").trim();
}
