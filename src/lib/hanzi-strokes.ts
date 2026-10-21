export type HanziStrokeData = {
  strokes: string[];
  medians: [number, number][][];
};

const hanzi = /^\p{Script=Han}$/u;
export const HANZI_DATA_SOURCE = "https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/";

export function hanziCharacters(text: string) {
  return Array.from(text).filter((character) => hanzi.test(character));
}

// Remote data becomes SVG attributes, never HTML. Accept only bounded paths and coordinates.
export function parseHanziStrokeData(value: unknown): HanziStrokeData {
  if (!value || typeof value !== "object") throw new Error("Dữ liệu nét chữ không hợp lệ.");
  const { strokes, medians } = value as Partial<HanziStrokeData>;
  if (!Array.isArray(strokes) || !strokes.length || strokes.length > 64 ||
      !strokes.every((path) => typeof path === "string" && path.length > 0 && path.length <= 20000 && /^[MmLlHhVvCcSsQqTtAaZz\d\s.,+\-]+$/.test(path)) ||
      !Array.isArray(medians) || medians.length !== strokes.length ||
      !medians.every((points) => Array.isArray(points) && points.length >= 2 && points.length <= 300 &&
        points.every((point) => Array.isArray(point) && point.length === 2 &&
          point.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate) && coordinate >= -256 && coordinate <= 1280)))) {
    throw new Error("Dữ liệu nét chữ không hợp lệ.");
  }
  return { strokes, medians };
}

export function medianPath(points: [number, number][]) {
  return points.map(([x, y], index) => `${index ? "L" : "M"}${x} ${y}`).join(" ");
}

export function createHanziDataLoader(fetcher: typeof fetch = fetch) {
  const cache = new Map<string, HanziStrokeData>();
  const pending = new Map<string, Promise<HanziStrokeData>>();
  return function load(character: string): Promise<HanziStrokeData> {
    if (!hanzi.test(character)) return Promise.reject(new Error("Hãy chọn một chữ Hán."));
    const saved = cache.get(character);
    if (saved) return Promise.resolve(saved);
    const existing = pending.get(character);
    if (existing) return existing;
    const request = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetcher(`${HANZI_DATA_SOURCE}${encodeURIComponent(character)}.json`, {
          signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer",
        });
        if (response.status === 404) throw new Error(`Chưa có dữ liệu nét viết cho chữ “${character}”.`);
        if (!response.ok) throw new Error("Không tải được nét chữ. Anh kiểm tra kết nối rồi thử lại nhé.");
        const text = await response.text();
        if (text.length > 256000) throw new Error("Dữ liệu nét chữ quá lớn.");
        const data = parseHanziStrokeData(JSON.parse(text));
        if (cache.size >= 100) cache.delete(cache.keys().next().value!);
        cache.set(character, data);
        return data;
      } finally {
        clearTimeout(timeout);
      }
    })();
    pending.set(character, request);
    void request.then(() => pending.delete(character), () => pending.delete(character));
    return request;
  };
}

export const loadHanziStrokeData = createHanziDataLoader();
