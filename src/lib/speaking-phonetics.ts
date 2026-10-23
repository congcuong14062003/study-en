import { z } from "zod";

export const phoneticsInputSchema = z.object({ text: z.string().trim().min(1).max(1000).refine((text) => /[a-z]/i.test(text) && !/\p{Script=Han}/u.test(text), "IPA này chỉ dành cho câu tiếng Anh.") });
export const englishIpaSchema = z.object({
  ipa: z.string().trim().min(3).max(6000).regex(/^\/[\p{Script=Latin}\p{M}ˈˌːˑ˞ʰʲ .,!?:;()\-‿|]+\/$/u, "Phiên âm IPA chưa đúng định dạng."),
});
export type EnglishPhonetics = { ipa: string; source: "builtin" | "ai"; locale: "en-US" };
export function phoneticTextKey(text: string) { return text.normalize("NFKC").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim().toLowerCase(); }

// Broad American-English readings of the five original speaking exercises; not Vietnamese respellings.
const starterReadings: [string, string][] = [
  ["I usually wake up at seven o'clock.", "/aɪ ˈjuːʒuəli weɪk ʌp ət ˈsɛvən əˈklɑːk/"],
  ["Could I have a cup of coffee, please?", "/kʊd aɪ hæv ə kʌp əv ˈkɑːfi pliːz/"],
  ["I'd like to book a room for two nights.", "/aɪd laɪk tə bʊk ə ruːm fər tuː naɪts/"],
  ["We should discuss the deadline at our next meeting.", "/wiː ʃʊd dɪˈskʌs ðə ˈdɛdlaɪn ət aʊr nɛkst ˈmiːtɪŋ/"],
  ["Learning a language opens the door to new possibilities.", "/ˈlɝːnɪŋ ə ˈlæŋɡwɪdʒ ˈoʊpənz ðə dɔːr tə nuː ˌpɑːsəˈbɪlətiz/"],
];
const readings = new Map(starterReadings.map(([text, ipa]) => [phoneticTextKey(text), ipa]));
export function builtinEnglishPhonetics(text: string): EnglishPhonetics | null {
  const ipa = readings.get(phoneticTextKey(text));
  return ipa ? { ipa, source: "builtin", locale: "en-US" } : null;
}

/** Bounded, process-local cache; failures remain retryable and concurrent requests share one generation. */
export function createEnglishPhoneticsLoader(now = Date.now, maxEntries = 200) {
  const cache = new Map<string, { result: EnglishPhonetics; expires: number }>();
  const pending = new Map<string, Promise<EnglishPhonetics>>();
  return async (rawText: string, generate: (text: string) => Promise<unknown>) => {
    const { text } = phoneticsInputSchema.parse({ text: rawText });
    const builtin = builtinEnglishPhonetics(text);
    if (builtin) return builtin;
    const key = phoneticTextKey(text);
    const saved = cache.get(key);
    if (saved && saved.expires > now()) return saved.result;
    cache.delete(key);
    let request = pending.get(key);
    if (!request) {
      if (pending.size >= 40) throw new Error("Đang tạo nhiều phiên âm. Vui lòng thử lại sau.");
      request = (async () => {
        const parsed = englishIpaSchema.parse(await generate(text));
        const result: EnglishPhonetics = { ...parsed, source: "ai", locale: "en-US" };
        if (cache.size >= maxEntries) cache.delete(cache.keys().next().value!);
        cache.set(key, { result, expires: now() + 7 * 86400000 });
        return result;
      })().finally(() => pending.delete(key));
      pending.set(key, request);
    }
    return request;
  };
}
