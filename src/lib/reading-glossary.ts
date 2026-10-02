export type GlossaryEntry = {
  id: string;
  word: string;
  meaning: string;
  ipa?: string | null;
  partOfSpeech?: string | null;
};

// Short grammatical words are often absent from the curated vocabulary list.
const commonMeanings: Record<string, string> = {
  a: "một", an: "một", the: "(mạo từ xác định)", i: "tôi", you: "bạn",
  he: "anh ấy", she: "cô ấy", it: "nó", we: "chúng tôi", they: "họ",
  me: "tôi", him: "anh ấy", her: "cô ấy; của cô ấy", us: "chúng tôi",
  them: "họ", my: "của tôi", your: "của bạn", his: "của anh ấy",
  our: "của chúng tôi", their: "của họ", this: "này", that: "đó",
  these: "những cái này", those: "những cái kia", who: "ai", what: "cái gì",
  when: "khi nào; khi", where: "ở đâu", why: "tại sao", how: "như thế nào",
  and: "và", or: "hoặc", but: "nhưng", if: "nếu", because: "bởi vì",
  so: "vì vậy", as: "như; khi", than: "hơn", to: "đến; để", of: "của",
  in: "trong", on: "trên", at: "ở; vào", by: "bởi; cạnh", for: "cho; vì",
  from: "từ", with: "với", about: "về", before: "trước", after: "sau",
  into: "vào trong", over: "ở trên", under: "ở dưới", up: "lên", down: "xuống",
  is: "là; thì; ở", am: "là; thì; ở", are: "là; thì; ở",
  was: "đã là; đã ở", were: "đã là; đã ở", be: "là; thì; ở",
  been: "đã từng là", being: "đang là", do: "làm", does: "làm", did: "đã làm",
  have: "có", has: "có", had: "đã có", can: "có thể", could: "có thể",
  will: "sẽ", would: "sẽ; muốn", should: "nên", must: "phải",
  not: "không", no: "không", yes: "vâng; có", all: "tất cả",
  some: "một vài", any: "bất kỳ", more: "nhiều hơn", most: "nhiều nhất",
  very: "rất", just: "chỉ; vừa mới", only: "chỉ", also: "cũng",
  here: "ở đây", there: "ở đó", then: "sau đó", now: "bây giờ",
  please: "làm ơn", ready: "sẵn sàng", put: "đặt; để", themself: "chính họ",
};

export function splitReadingWords(text: string) {
  return text.split(/([A-Za-z]+(?:['’\-][A-Za-z]+)*)/g).filter(Boolean);
}

export function isReadingWord(token: string) {
  return /^[A-Za-z]+(?:['’\-][A-Za-z]+)*$/.test(token);
}

export function readingWordContext(text: string, start: number, length: number) {
  return text
    .slice(Math.max(0, start - 100), Math.min(text.length, start + length + 100))
    .replace(/\s+/g, " ")
    .trim();
}

export function buildGlossary(entries: GlossaryEntry[]) {
  return new Map(entries.map((entry) => [entry.word.toLowerCase(), entry]));
}

export function lookupReadingWord(token: string, glossary: Map<string, GlossaryEntry>) {
  const lower = token.toLowerCase();
  const exact = glossary.get(lower);
  if (exact) return exact;
  if (commonMeanings[lower]) return { id: `common-${lower}`, word: lower, meaning: commonMeanings[lower] };

  const stems = [
    ...(lower.endsWith("ies") ? [`${lower.slice(0, -3)}y`] : []),
    ...(lower.endsWith("es") ? [lower.slice(0, -2)] : []),
    ...(lower.endsWith("s") ? [lower.slice(0, -1)] : []),
    ...(lower.endsWith("ied") ? [`${lower.slice(0, -3)}y`] : []),
    ...(lower.endsWith("ed") ? [lower.slice(0, -2), lower.slice(0, -1)] : []),
    ...(lower.endsWith("ing") ? [lower.slice(0, -3), `${lower.slice(0, -3)}e`] : []),
  ];
  for (const stem of stems) {
    const match = glossary.get(stem);
    if (match) return match;
  }
  return null;
}
