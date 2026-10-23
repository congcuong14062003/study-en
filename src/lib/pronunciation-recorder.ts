export type PronunciationCapture = {
  phase: "idle" | "requesting" | "recording" | "finishing" | "done";
  transcript: string;
  finalTranscript: string;
  error: string;
  audio: Blob | null;
};

type Recorder = Pick<MediaRecorder, "state" | "mimeType" | "start" | "stop" | "ondataavailable" | "onstop" | "onerror">;
type Recognition = Pick<SpeechRecognition, "lang" | "continuous" | "interimResults" | "onresult" | "onerror" | "onend" | "start" | "stop" | "abort">;
type Runtime = {
  getMicrophone: () => Promise<MediaStream>;
  createRecorder: (stream: MediaStream) => Recorder;
  createRecognition: (() => Recognition) | null;
  schedule: (callback: () => void, milliseconds: number) => ReturnType<typeof setTimeout>;
  clear: (timer: ReturnType<typeof setTimeout>) => void;
};
export const emptyPronunciationCapture = (): PronunciationCapture => ({
  phase: "idle", transcript: "", finalTranscript: "", error: "", audio: null,
});

export function recognitionErrorMessage(code: string) {
  if (["not-allowed", "service-not-allowed"].includes(code)) return "Chưa được phép nhận dạng giọng nói. Kiểm tra quyền micro của trình duyệt; bạn vẫn có thể nghe lại bản thu nếu có.";
  if (code === "no-speech") return "Chưa nhận được lời nói. Hãy đọc gần micro hơn rồi thử lại.";
  if (code === "network") return "Dịch vụ nhận dạng chưa kết nối được. Kiểm tra mạng rồi thử lại; bạn vẫn có thể nghe bản thu nếu có.";
  if (code === "language-not-supported") return "Dịch vụ nhận dạng chưa hỗ trợ ngôn ngữ này trên trình duyệt hiện tại.";
  return "Nhận dạng giọng nói bị gián đoạn. Hãy thử lại; chưa có kết quả đánh giá cho lần này.";
}

/** One attempt. Permission requests, late final results, timers and media all share one lifecycle. */
export function createPronunciationRecorder(locale: string, runtime: Runtime, update: (value: PronunciationCapture) => void, maxDurationMs = 45000) {
  let state = emptyPronunciationCapture();
  let disposed = false;
  let stream: MediaStream | null = null;
  let recorder: Recorder | null = null;
  let recognition: Recognition | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const chunks: Blob[] = [];
  const emit = (patch: Partial<PronunciationCapture>) => {
    if (!disposed) { state = { ...state, ...patch }; update(state); }
  };
  const clearTimer = () => { if (timer !== undefined) runtime.clear(timer); timer = undefined; };
  const stopMedia = () => {
    if (recorder?.state === "recording") recorder.stop();
    stream?.getTracks().forEach((track) => track.stop());
  };
  const detachRecognition = () => {
    if (!recognition) return;
    recognition.onresult = recognition.onerror = recognition.onend = null;
    recognition.abort();
    recognition = null;
  };
  const finish = () => {
    if (disposed || state.phase === "done") return;
    clearTimer(); stopMedia(); detachRecognition();
    emit({ phase: "done" });
  };
  const stop = () => {
    if (state.phase !== "recording" || disposed) return;
    clearTimer();
    emit({ phase: "finishing" });
    stopMedia();
    if (!recognition) { finish(); return; }
    // Some browsers deliver the final transcript only after stop(). Never score interim words.
    timer = runtime.schedule(finish, 2500);
    try { recognition.stop(); } catch { finish(); }
  };
  return {
    async start() {
      if (disposed || state.phase !== "idle") return;
      emit({ phase: "requesting" });
      try {
        const acquired = await runtime.getMicrophone();
        if (disposed) { acquired.getTracks().forEach((track) => track.stop()); return; }
        stream = acquired;
        recorder = runtime.createRecorder(acquired);
        recorder.ondataavailable = (event) => { if (!disposed && event.data.size) chunks.push(event.data); };
        recorder.onstop = () => {
          if (chunks.length) emit({ audio: new Blob(chunks, { type: recorder?.mimeType || chunks[0].type }) });
        };
        recorder.onerror = () => {
          emit({ error: "Thu âm bị gián đoạn. Hãy kiểm tra micro và thử lại." });
          finish();
        };
        if (runtime.createRecognition) {
          recognition = runtime.createRecognition();
          recognition.lang = locale;
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (event) => {
            if (state.phase === "done") return;
            const heard: string[] = [], final: string[] = [];
            for (let index = 0; index < event.results.length; index++) {
              heard.push(event.results[index][0].transcript);
              if (event.results[index].isFinal) final.push(event.results[index][0].transcript);
            }
            emit({ transcript: heard.join(" ").trim(), finalTranscript: final.join(" ").trim() });
          };
          recognition.onerror = (event) => {
            emit({ error: recognitionErrorMessage(event.error) });
            finish();
          };
          recognition.onend = finish;
        }
        recorder.start();
        emit({ phase: "recording" });
        timer = runtime.schedule(stop, maxDurationMs);
        if (recognition) {
          try { recognition.start(); } catch {
            emit({ error: "Chưa mở được nhận dạng giọng nói. Bạn vẫn có thể thu âm và nghe lại." });
            detachRecognition();
          }
        }
      } catch (error) {
        emit({ error: error instanceof Error && error.name === "NotAllowedError"
          ? "Hãy cho phép dùng micro trong trình duyệt rồi thử lại."
          : "Chưa mở được micro. Kiểm tra thiết bị và dùng HTTPS hoặc localhost." });
        finish();
      }
    },
    stop,
    dispose() {
      disposed = true; clearTimer(); detachRecognition();
      if (recorder) recorder.ondataavailable = recorder.onstop = recorder.onerror = null;
      stopMedia();
    },
  };
}
