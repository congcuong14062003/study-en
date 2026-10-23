import { z } from "zod";
import { exampleSentenceTranslation } from "./vocabulary-example";

export const speakingTranslationInput = z.object({ text: z.string().trim().min(1).max(1000) });
export type SpeakingTranslationResult = { text: string; translation: string; source: "builtin" | "saved" | "ai" };
const builtin = new Map([
  ["I usually wake up at seven o'clock.", "Tôi thường thức dậy lúc bảy giờ."],
  ["Could I have a cup of coffee, please?", "Vui lòng cho tôi một tách cà phê được không?"],
  ["I'd like to book a room for two nights.", "Tôi muốn đặt một phòng trong hai đêm."],
  ["We should discuss the deadline at our next meeting.", "Chúng ta nên thảo luận về thời hạn trong cuộc họp tiếp theo."],
  ["Learning a language opens the door to new possibilities.", "Học một ngôn ngữ mở ra những khả năng mới."],
]);
const keyFor = (text: string) => text.normalize("NFKC").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
export function builtinSpeakingTranslation(text: string) { return builtin.get(keyFor(text)) || null; }

export function createSpeakingTranslationLoader(now = Date.now) {
  const cache = new Map<string, { value: SpeakingTranslationResult; expires: number }>();
  const pending = new Map<string, Promise<SpeakingTranslationResult>>();
  return async (rawText: string, findSaved: (text: string) => Promise<string | null>, generate: (text: string) => Promise<string>) => {
    const { text } = speakingTranslationInput.parse({ text: rawText });
    const fixed = builtinSpeakingTranslation(text);
    if (fixed) return { text, translation: fixed, source: "builtin" } as SpeakingTranslationResult;
    const saved = exampleSentenceTranslation(text, await findSaved(text));
    if (saved && !/\p{Script=Han}/u.test(saved)) return { text, translation: saved, source: "saved" } as SpeakingTranslationResult;
    const key = keyFor(text);
    const cached = cache.get(key);
    if (cached && cached.expires > now()) return { ...cached.value, text };
    cache.delete(key);
    let request = pending.get(key);
    if (!request) {
      if (pending.size >= 40) throw new Error("Đang tạo nhiều bản dịch. Vui lòng thử lại sau.");
      request = (async () => {
        const translation = exampleSentenceTranslation(text, await generate(text));
        if (!translation || translation.length > 6000 || /\p{Script=Han}/u.test(translation)) throw new Error("Chưa nhận được bản dịch tiếng Việt phù hợp. Vui lòng thử lại.");
        const value: SpeakingTranslationResult = { text, translation, source: "ai" };
        if (cache.size >= 200) cache.delete(cache.keys().next().value!);
        cache.set(key, { value, expires: now() + 7 * 86400000 });
        return value;
      })().finally(() => pending.delete(key));
      pending.set(key, request);
    }
    return { ...await request, text };
  };
}
