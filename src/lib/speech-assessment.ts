import { z } from "zod";

const score = z.number().finite().min(0).max(100);
const scores = z.object({
  AccuracyScore: score,
  FluencyScore: score,
  CompletenessScore: score,
  PronScore: score,
});
const wordScore = z.object({
  AccuracyScore: score,
  ErrorType: z.string().max(60).optional(),
});
export type SpeechAssessment = {
  text: string;
  accuracy: number;
  fluency: number;
  completeness: number;
  pronunciation: number;
  words: {
    word: string;
    accuracy: number;
    error: string;
    phonemes: { phoneme: string; accuracy: number }[];
  }[];
};
export const speechAssessmentInput = z.object({
  locale: z.enum(["en-US", "zh-CN"]),
  reference: z.string().trim().min(1).max(500),
});
export function speechConfiguration(
  env: Record<string, string | undefined> = process.env,
) {
  const key = env.AZURE_SPEECH_KEY?.trim();
  const region = env.AZURE_SPEECH_REGION?.trim();
  return key && region && /^[a-z][a-z0-9]{1,30}$/.test(region)
    ? { key, region }
    : null;
}
export function normalizeSpeechAssessment(raw: unknown): SpeechAssessment {
  const payload = z
    .object({
      RecognitionStatus: z.literal("Success"),
      NBest: z.array(z.record(z.string(), z.unknown())).min(1).max(20),
    })
    .parse(raw);
  const best = payload.NBest[0];
  const result = scores.parse(best.PronunciationAssessment || best);
  const words = z
    .array(z.record(z.string(), z.unknown()))
    .max(1000)
    .parse(best.Words);
  return {
    text: z.string().max(10000).parse(best.Display),
    accuracy: result.AccuracyScore,
    fluency: result.FluencyScore,
    completeness: result.CompletenessScore,
    pronunciation: result.PronScore,
    words: words.map((word) => {
      const rating = wordScore.parse(word.PronunciationAssessment || word);
      const phonemes = z
        .array(z.record(z.string(), z.unknown()))
        .max(100)
        .parse(word.Phonemes || []);
      return {
        word: z.string().max(200).parse(word.Word),
        accuracy: rating.AccuracyScore,
        error: rating.ErrorType || "None",
        phonemes: phonemes.map((entry) => ({
          phoneme: z.string().max(80).parse(entry.Phoneme),
          accuracy: z
            .object({ AccuracyScore: score })
            .parse(entry.PronunciationAssessment || entry).AccuracyScore,
        })),
      };
    }),
  };
}
export async function assessSpeech(
  config: { key: string; region: string },
  input: z.infer<typeof speechAssessmentInput>,
  audio: Uint8Array,
  fetcher: typeof fetch = fetch,
) {
  const parameters = {
    ReferenceText: input.reference,
    GradingSystem: "HundredMark",
    Granularity: "Phoneme",
    Dimension: "Comprehensive",
    EnableMiscue: true,
    ...(input.locale === "en-US" ? { PhonemeAlphabet: "IPA" } : {}),
  };
  const response = await fetcher(
    `https://${config.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${input.locale}&format=detailed`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": config.key,
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        "Pronunciation-Assessment": Buffer.from(
          JSON.stringify(parameters),
        ).toString("base64"),
        Accept: "application/json",
      },
      body: audio as unknown as BodyInit,
      signal: AbortSignal.timeout(30000),
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "Azure đang giới hạn lượt dùng. Vui lòng thử lại sau."
        : "Chưa chấm được âm thanh. Kiểm tra cấu hình Azure hoặc thử lại sau.",
    );
  try {
    return normalizeSpeechAssessment(await response.json());
  } catch {
    throw new Error(
      "Chưa nhận được kết quả phát âm đầy đủ. Hãy đọc rõ câu mẫu rồi thử lại.",
    );
  }
}
