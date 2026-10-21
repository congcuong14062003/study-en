import { z } from "zod";

export const learningLanguageSchema = z.enum(["en", "zh"]);
export type LearningLanguage = z.infer<typeof learningLanguageSchema>;
export const learningLanguages = {
  en: {
    name: "Tiếng Anh", native: "English", speech: "en-US",
    levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
  },
  zh: {
    name: "Tiếng Trung", native: "中文 · Giản thể", speech: "zh-CN",
    levels: ["Nhập môn", "Cơ bản", "Trung cấp", "Nâng cao"],
  },
} as const;

export function learningLanguage(value?: string | null): LearningLanguage {
  return value === "zh" ? "zh" : "en";
}
export function speechLanguage(text: string) {
  return /\p{Script=Han}/u.test(text) ? "zh-CN" : "en-US";
}
export function languageTextUnits(text: string) {
  return /\p{Script=Han}/u.test(text)
    ? Array.from(text.matchAll(/\p{Script=Han}/gu)).length
    : text.trim().split(/\s+/).filter(Boolean).length;
}
export function segmentLearningText(text: string) {
  if (!/\p{Script=Han}/u.test(text))
    return text.split(/([A-Za-z]+(?:['’\-][A-Za-z]+)*)/g).filter(Boolean);
  return Array.from(
    new Intl.Segmenter("zh", { granularity: "word" }).segment(text),
    (part) => part.segment,
  );
}
