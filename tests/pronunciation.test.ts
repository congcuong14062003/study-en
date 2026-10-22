import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PronunciationCheck } from "../src/components/learning/pronunciation-check";
import { VocabularyExampleAudio } from "../src/components/learning/vocabulary-example-audio";
import { compareTranscript } from "../src/services/speech";
import { createPronunciationRecorder, type PronunciationCapture } from "../src/lib/pronunciation-recorder";

function fixture(options: { unsupported?: boolean; pending?: boolean; denied?: boolean; recognitionThrows?: boolean } = {}) {
  let release!: (value: MediaStream) => void;
  let trackStops = 0, recognitionStops = 0, recognitionAborts = 0;
  const states: PronunciationCapture[] = [];
  const stream = { getTracks: () => [{ stop() { trackStops++; } }] } as unknown as MediaStream;
  const timers = new Map<ReturnType<typeof setTimeout>, { callback: () => void; ms: number }>();
  let timerId = 0;
  const recognition = {
    lang: "", continuous: false, interimResults: false,
    onresult: null, onerror: null, onend: null,
    start() { if (options.recognitionThrows) throw new Error("Not available"); },
    stop() { recognitionStops++; }, abort() { recognitionAborts++; },
  } as unknown as SpeechRecognition;
  const recorder = {
    state: "inactive", mimeType: "audio/webm", ondataavailable: null, onstop: null, onerror: null,
    start(this: { state: string }) { this.state = "recording"; },
    stop(this: { state: string }) { this.state = "inactive"; },
  } as unknown as MediaRecorder;
  const session = createPronunciationRecorder("zh-CN", {
    getMicrophone: () => options.denied ? Promise.reject(Object.assign(new Error("Permission denied"), { name: "NotAllowedError" }))
      : options.pending ? new Promise<MediaStream>((resolve) => { release = resolve; }) : Promise.resolve(stream),
    createRecorder: () => recorder,
    createRecognition: options.unsupported ? null : () => recognition,
    schedule: (callback, ms) => { const id = ++timerId as unknown as ReturnType<typeof setTimeout>; timers.set(id, { callback, ms }); return id; },
    clear: (id) => { timers.delete(id); },
  }, (state) => states.push(state));
  return { session, recognition, recorder, timers, states, stream,
    release: () => release(stream), latest: () => states.at(-1)!,
    counters: () => ({ trackStops, recognitionStops, recognitionAborts }),
    result(transcript: string, final: boolean) {
      recognition.onresult?.({ results: [{ 0: { transcript, confidence: 0.99 }, isFinal: final, length: 1 }], resultIndex: 0 } as unknown as SpeechRecognitionEvent);
    },
    audio() {
      recorder.ondataavailable?.call(recorder, { data: new Blob(["fixture recording"], { type: "audio/webm" }) } as BlobEvent);
      recorder.onstop?.call(recorder, new Event("stop"));
    },
  };
}

test("English/Chinese transcript comparison preserves order, repetitions, numbers and reports missing units honestly", () => {
  assert.equal(compareTranscript("I’m well-known!", "i'm well known").recognizedAccuracy, 100);
  assert.equal(compareTranscript("你好，妈妈！", "你 好 妈 妈").recognizedAccuracy, 100);
  const missing = compareTranscript("我有一个苹果。", "我有苹果");
  assert.deepEqual(missing.missingWords, ["一", "个"]);
  assert.ok(missing.recognizedAccuracy < 100);
  assert.ok(compareTranscript("我有2只猫", "我有3只猫").recognizedAccuracy < 100);
  assert.ok(compareTranscript("one two", "two one").recognizedAccuracy < 100);
  assert.equal(compareTranscript("你好", "").recognizedAccuracy, 0);
  assert.equal(compareTranscript("hello", "unrelated extra words").recognizedAccuracy, 0);
  assert.match(missing.notice, /không phải điểm phát âm/);
});

test("word and example controls render without opening a microphone or displaying a fake pronunciation score", () => {
  assert.match(renderToStaticMarkup(createElement(PronunciationCheck, { text: "你好", language: "zh" })), /Kiểm tra phát âm từ: 你好/);
  const example = renderToStaticMarkup(createElement(VocabularyExampleAudio, { example: "I have an apple." }));
  assert.match(example, /Nghe câu ví dụ/);
  assert.match(example, /Kiểm tra phát âm câu ví dụ: I have an apple./);
  assert.equal(renderToStaticMarkup(createElement(PronunciationCheck, { text: " " })), "");
});

test("recording starts only on request, uses Chinese locale and waits for final recognition after stop", async () => {
  const f = fixture();
  assert.equal(f.states.length, 0);
  await f.session.start();
  assert.equal(f.recognition.lang, "zh-CN");
  assert.equal(f.latest().phase, "recording");
  f.result("你", false);
  assert.equal(f.latest().transcript, "你");
  assert.equal(f.latest().finalTranscript, "");
  f.session.stop();
  assert.equal(f.latest().phase, "finishing");
  assert.equal(f.counters().recognitionStops, 1);
  assert.ok(f.counters().trackStops > 0);
  f.result("你好", true);
  f.recognition.onend?.();
  f.audio();
  assert.equal(f.latest().phase, "done");
  assert.equal(f.latest().finalTranscript, "你好");
  assert.ok(f.latest().audio?.size);
  assert.equal(f.timers.size, 0);
  f.session.dispose();
});

test("closing during a permission request releases a late microphone grant without stale updates", async () => {
  const f = fixture({ pending: true });
  const starting = f.session.start();
  const updates = f.states.length;
  f.session.dispose(); f.release(); await starting;
  assert.equal(f.counters().trackStops, 1);
  assert.equal(f.states.length, updates);
  assert.equal(f.recorder.state, "inactive");
  assert.equal(f.timers.size, 0);
});

test("permission denial, network errors and missing recognition are explicit, not a zero pronunciation grade", async () => {
  const denied = fixture({ denied: true }); await denied.session.start();
  assert.match(denied.latest().error, /cho phép dùng micro/);
  assert.equal(denied.latest().phase, "done");
  const network = fixture(); await network.session.start();
  network.result("你好", true);
  network.recognition.onerror?.(Object.assign(new Event("error"), { error: "network" }));
  assert.match(network.latest().error, /Kiểm tra mạng/);
  assert.equal(network.latest().phase, "done");
  const fallback = fixture({ unsupported: true }); await fallback.session.start();
  fallback.session.stop(); fallback.audio();
  assert.ok(fallback.latest().audio?.size);
  assert.equal(fallback.latest().finalTranscript, "");
  assert.equal(fallback.latest().phase, "done");
});

test("time limits stop capture and settle browsers that never send recognition end", async () => {
  const f = fixture(); await f.session.start();
  [...f.timers.values()].find((timer) => timer.ms === 45000)!.callback();
  assert.equal(f.latest().phase, "finishing");
  f.result("interim only", false);
  [...f.timers.values()].find((timer) => timer.ms === 2500)!.callback();
  assert.equal(f.latest().phase, "done");
  assert.equal(f.latest().finalTranscript, "");
  assert.equal(f.timers.size, 0);
  assert.ok(f.counters().recognitionAborts > 0);
});

test("disposal detaches callbacks, aborts recognition and stops microphone; repeated start is ignored", async () => {
  const f = fixture(); await f.session.start(); await f.session.start();
  f.session.dispose();
  const updates = f.states.length;
  f.result("late result", true); f.audio();
  assert.equal(f.states.length, updates);
  assert.equal(f.recognition.onend, null);
  assert.equal(f.recorder.onstop, null);
  assert.equal(f.timers.size, 0);
  assert.ok(f.counters().trackStops > 0);
  const thrown = fixture({ recognitionThrows: true }); await thrown.session.start();
  assert.match(thrown.latest().error, /Chưa mở được nhận dạng/);
  thrown.session.stop();
  assert.equal(thrown.latest().phase, "done");
});
