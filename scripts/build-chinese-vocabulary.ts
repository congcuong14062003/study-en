// Rebuilds a committed data artifact; never connects to a database or calls AI.
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { chineseTopics } from "../prisma/chinese-content";
import { normalizeChineseReading as reading } from "../src/lib/chinese-pinyin";

const hskRevision = "7ac65bf1a6387d35f1ade478906172a19311c7f9";
const dictionaryRevision = "9ab0b8ea1d3749b0039ec2fea52ea050eec012ab";
const sentenceRevision = "857dfbab91027ebd97df01260e91b817cb6b4854";
const root = "https://raw.githubusercontent.com/";
const downloads: { url: string; sha256: string }[] = [];
async function download(path: string) {
  const url = root + path;
  let response: Response | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (response.ok) break;
    } catch {
      if (attempt === 2) throw new Error(`Cannot fetch pinned source: ${url}`);
    }
  }
  if (!response) throw new Error(`No response from source: ${url}`);
  if (!response.ok) throw new Error(`Source returned ${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  downloads.push({ url, sha256: createHash("sha256").update(bytes).digest("hex") });
  return bytes.toString("utf8");
}
type Entry = { simplified: string; level: string[]; frequency: number; forms: { transcriptions: { pinyin: string }; meanings: string[] }[] };
type Dictionary = Record<string, { pinyin: string; definition: string }>;
type Sentence = { id: string; hsk_level: number; chinese: string; pinyin: string; translation: { en: string }; tokens: { word: string; pinyin: string }[] };
async function main() {
  const [dictionaryText, sentenceText, hskLicense, hskText] = await Promise.all([
    download(`thaoshibe/chugiai-zh-en-vi/${dictionaryRevision}/cvdict_full.json`),
    download(`no7z/hsk-sentences-audio/${sentenceRevision}/dist/sentences.json`),
    download(`drkameleon/complete-hsk-vocabulary/${hskRevision}/LICENSE`),
    download(`drkameleon/complete-hsk-vocabulary/${hskRevision}/complete.json`),
  ]);
  const dictionary: Dictionary = JSON.parse(dictionaryText);
  const sentences: Sentence[] = JSON.parse(sentenceText);
  const examples = new Map<string, Sentence[]>();
  for (const sentence of sentences) {
    if (!sentence.chinese || !sentence.pinyin || !sentence.translation?.en || sentence.chinese.length > 120) continue;
    for (const token of sentence.tokens) {
      if (!sentence.chinese.includes(token.word)) continue;
      const key = `${token.word}:${reading(token.pinyin)}`;
      const list = examples.get(key) || [];
      if (!list.some((item) => item.id === sentence.id)) list.push(sentence);
      examples.set(key, list);
    }
  }
  for (const list of examples.values()) list.sort((a, b) => a.hsk_level - b.hsk_level || a.chinese.length - b.chinese.length || a.id.localeCompare(b.id));
  const seen = new Set(chineseTopics.flatMap((topic) => topic.words.map((word) => word[0])));
  const rows = [];
  const counts: Record<string, number> = {};
  const candidates = (JSON.parse(hskText) as Entry[]).map((entry) => ({
    entry, hskLevel: Math.min(...entry.level.filter((level) => /^new-[1-6]$/.test(level)).map((level) => Number(level.slice(4)))),
  })).filter((item) => Number.isFinite(item.hskLevel)).sort((a, b) => a.hskLevel - b.hskLevel || a.entry.frequency - b.entry.frequency || a.entry.simplified.localeCompare(b.entry.simplified));
  for (const { entry, hskLevel } of candidates) {
      const vi = dictionary[entry.simplified];
      const form = entry.forms[0];
      if (!form) continue;
      const word = { hanzi: entry.simplified, pinyin: form.transcriptions.pinyin, translations: form.meanings };
      if (seen.has(word.hanzi) || !/^\p{Script=Han}+$/u.test(word.hanzi)) continue;
      // The mirror retains only one reading per headword. Reject polyphonic mismatches.
      if (!vi?.definition || reading(vi.pinyin) !== reading(word.pinyin)) continue;
      const sentence = examples.get(`${word.hanzi}:${reading(word.pinyin)}`)?.[0];
      if (!sentence || !word.translations.length) continue;
      const meaning = vi.definition.split("/").filter((part) => !/^(?:LT:|CL:|biến thể|xem |họ \b)/iu.test(part)).join("; ").trim();
      if (!meaning || meaning.length > 1500) continue;
      rows.push({
        id: `zh-import-${createHash("sha256").update(word.hanzi).digest("hex").slice(0, 20)}`,
        language: "zh", word: word.hanzi, pinyin: word.pinyin, ipa: "", meaning,
        definition: word.translations.join("; "), partOfSpeech: "từ/cụm từ",
        example: sentence.chinese, translation: "", category: `HSK ${hskLevel} · 3.0 (2021)`,
        level: hskLevel === 1 ? "Nhập môn" : hskLevel === 2 ? "Cơ bản" : hskLevel <= 4 ? "Trung cấp" : "Nâng cao",
        synonyms: [], antonyms: [], collocations: [], wordFamily: [],
        source: { hskLevel, dictionaryPinyin: vi.pinyin, sentenceId: sentence.id, sentencePinyin: sentence.pinyin, sentenceEnglish: sentence.translation.en },
      });
      seen.add(word.hanzi);
      counts[hskLevel] = (counts[hskLevel] || 0) + 1;
      if (rows.length === 3000) break;
  }
  if (rows.length !== 3000) throw new Error(`Only ${rows.length} words have matching readings, Vietnamese meanings and real examples; artifact not written.`);
  const data = JSON.stringify(rows, null, 2) + "\n";
  const attribution = {
    title: "3,000 Chinese vocabulary entries for Vietnamese learners", license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", count: rows.length, counts,
    sha256: createHash("sha256").update(data).digest("hex"),
    sources: [
      { author: "Yanis Zafirópulos; upstream CC-CEDICT contributors, clem109/hsk-vocabulary and elkmovie/hsk30", project: "Complete HSK Vocabulary (new-1 through new-6 labels and dictionary definitions)", url: "https://github.com/drkameleon/complete-hsk-vocabulary", revision: hskRevision, license: "MIT code; CC BY-SA 4.0 dictionary data", notice: hskLicense },
      { author: "Phong Phan / CVDICT; CC-CEDICT contributors; mirror by thaoshibe", project: "Chinese–Vietnamese dictionary", url: "https://github.com/thaoshibe/chugiai-zh-en-vi", original: "https://github.com/ph0ngp/CVDICT", revision: dictionaryRevision, license: "CC BY-SA 4.0" },
      { author: "no7z / hsk-sentences-audio contributors; CC-CEDICT contributors", project: "Chinese sentence text and Pinyin; not the audio files", url: "https://github.com/no7z/hsk-sentences-audio", revision: sentenceRevision, license: "CC BY-SA 4.0" },
    ],
    changes: "Selected 3,000 additional Han headwords outside the hand-authored starter pack. Matched dictionary/example readings, chose shortest low-level token-matched example, reformatted fields, mapped upstream new-N categories to app levels. No audio copied. No Vietnamese sentence translations synthesized; these remain empty for existing on-demand translation.",
    caveat: "Community dictionary translations and sentence data may contain errors. Levels use upstream new-N (HSK 3.0 / 2021) labels, not CEFR or an official curriculum. Vietnamese example translations require separately configured AI on demand.",
    downloads: downloads.sort((a, b) => a.url.localeCompare(b.url)),
  };
  await mkdir("prisma/data", { recursive: true });
  await mkdir("public/data", { recursive: true });
  await writeFile("prisma/data/chinese-vocabulary-3000.json", data);
  await writeFile("public/data/chinese-vocabulary-attribution.json", JSON.stringify(attribution, null, 2) + "\n");
  console.log(JSON.stringify({ count: rows.length, counts, sha256: attribution.sha256 }));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
