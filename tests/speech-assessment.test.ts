import test from "node:test";
import assert from "node:assert/strict";
import { assessSpeech, normalizeSpeechAssessment, speechAssessmentInput, speechConfiguration } from "../src/lib/speech-assessment";
import { encodeSpeechWav, MAX_WAV_BYTES, validateSpeechWav } from "../src/lib/speech-audio";
const rating = { AccuracyScore: 82, FluencyScore: 79, CompletenessScore: 100, PronScore: 84 };
const fixture = () => ({ RecognitionStatus: "Success", NBest: [{ Display: "Hello.", ...rating, Words: [{ Word: "Hello", AccuracyScore: 65, ErrorType: "Mispronunciation", Phonemes: [{ Phoneme: "h", AccuracyScore: 62 }] }] }] });

test("WAV encoder produces the bounded PCM16 mono16k contract and rejects corrupt/long audio", () => {
  const wav = encodeSpeechWav(new Float32Array(16000));
  validateSpeechWav(wav);
  assert.equal(wav.length, 32044);
  assert.equal(new DataView(wav.buffer).getUint32(24, true), 16000);
  const altered = wav.slice(); altered[24] = 1;
  assert.throws(() => validateSpeechWav(altered));
  assert.throws(() => validateSpeechWav(wav.slice(0, -1)));
  assert.throws(() => encodeSpeechWav(new Float32Array(3199)));
  assert.throws(() => encodeSpeechWav(new Float32Array(480001)));
  assert.equal(encodeSpeechWav(new Float32Array(480000)).length, MAX_WAV_BYTES);
});
test("Azure results support REST and nested scores without inventing missing scores", () => {
  const flat = normalizeSpeechAssessment(fixture());
  assert.equal(flat.pronunciation, 84); assert.equal(flat.words[0].phonemes[0].accuracy, 62);
  const nested = { RecognitionStatus: "Success", NBest: [{ Display: "Hello.", PronunciationAssessment: rating, Words: [{ Word: "Hello", PronunciationAssessment: { AccuracyScore: 65, ErrorType: "Mispronunciation" } }] }] };
  assert.equal(normalizeSpeechAssessment(nested).words[0].accuracy, 65);
  assert.throws(() => normalizeSpeechAssessment({ RecognitionStatus: "NoMatch", NBest: [] }));
  assert.throws(() => normalizeSpeechAssessment({ RecognitionStatus: "Success", NBest: [{ Display: "Hello", AccuracyScore: 100, Words: [] }] }));
  assert.throws(() => normalizeSpeechAssessment({ RecognitionStatus: "Success", NBest: [{ Display: "Hello", ...rating, PronScore: 101, Words: [] }] }));
});
test("credentials are server-only, region cannot redirect requests, input locale/reference are bounded", () => {
  assert.equal(speechConfiguration({}), null);
  assert.equal(speechConfiguration({ AZURE_SPEECH_KEY: "fixture", AZURE_SPEECH_REGION: "evil.com/path" }), null);
  assert.ok(speechConfiguration({ AZURE_SPEECH_KEY: "fixture", AZURE_SPEECH_REGION: "southeastasia" }));
  assert.throws(() => speechAssessmentInput.parse({ locale: "fr-FR", reference: "Hello" }));
  assert.throws(() => speechAssessmentInput.parse({ locale: "en-US", reference: "a".repeat(501) }));
});
test("provider gets actual audio and a base64 scripted reference, Chinese is not mislabeled IPA", async () => {
  for (const locale of ["en-US", "zh-CN"] as const) {
    let calls = 0;
    const bytes = encodeSpeechWav(new Float32Array(16000));
    const result = await assessSpeech({ key: "fixture-key", region: "southeastasia" }, { locale, reference: locale === "zh-CN" ? "你好。" : "Hello." }, bytes, (async (url, options) => {
      calls++; assert.match(String(url), new RegExp(`language=${locale}`));
      assert.equal(options!.body, bytes);
      const headers = options!.headers as Record<string, string>;
      assert.equal(headers["Ocp-Apim-Subscription-Key"], "fixture-key");
      const params = JSON.parse(Buffer.from(headers["Pronunciation-Assessment"], "base64").toString());
      assert.equal(params.ReferenceText, locale === "zh-CN" ? "你好。" : "Hello.");
      assert.equal(params.PhonemeAlphabet, locale === "en-US" ? "IPA" : undefined);
      return Response.json(fixture());
    }) as typeof fetch);
    assert.equal(calls, 1); assert.equal(result.accuracy, 82);
  }
});
test("upstream errors do not expose response bodies or secrets", async () => {
  await assert.rejects(assessSpeech({ key: "fixture", region: "eastus" }, { locale: "en-US", reference: "Hello" }, new Uint8Array(), (async () => new Response("secret-provider-detail", { status: 401 })) as typeof fetch), (error: Error) => !error.message.includes("secret-provider-detail"));
});
