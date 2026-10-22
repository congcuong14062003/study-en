"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { speechLanguage } from "@/lib/languages";
import { createPronunciationRecorder, emptyPronunciationCapture } from "@/lib/pronunciation-recorder";
import { compareTranscript } from "@/services/speech";
import { AudioButton } from "./audio-player";

export function PronunciationCheck({ text, language, example = false }: { text: string; language?: string; example?: boolean }) {
  const [open, setOpen] = useState(false);
  const label = example ? "Kiểm tra phát âm câu ví dụ" : "Kiểm tra phát âm từ";
  if (!text.trim()) return null;
  const locale = language === "zh" ? "zh-CN" : language === "en" ? "en-US" : speechLanguage(text);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="pronunciation-trigger" aria-label={`${label}: ${text}`}>
          <Mic size={15} />{label}
        </Button>
      </DialogTrigger>
      <DialogContent className="pronunciation-dialog">
        <DialogTitle>{label}</DialogTitle>
        <DialogDescription>Nghe mẫu, đọc thành tiếng rồi dừng để đối chiếu nội dung nhận dạng.</DialogDescription>
        {open && <PronunciationAttempt key={`${locale}:${text}`} text={text} locale={locale} />}
      </DialogContent>
    </Dialog>
  );
}

function PronunciationAttempt({ text, locale }: { text: string; locale: string }) {
  const [capture, setCapture] = useState(emptyPronunciationCapture);
  const [support, setSupport] = useState<{ microphone: boolean; recognition: boolean } | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const attempt = useRef<ReturnType<typeof createPronunciationRecorder> | null>(null);
  const playback = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    setSupport({ microphone: typeof navigator.mediaDevices?.getUserMedia === "function" && typeof window.MediaRecorder === "function", recognition: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition) });
    return () => { attempt.current?.dispose(); };
  }, []);
  useEffect(() => {
    if (!capture.audio) { setAudioUrl(""); return; }
    const url = URL.createObjectURL(capture.audio);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [capture.audio]);
  const pending = capture.phase === "requesting" || capture.phase === "finishing";
  const recording = capture.phase === "recording";
  const locked = pending || recording;
  const analysis = capture.phase === "done" && !capture.error && capture.finalTranscript
    ? compareTranscript(text, capture.finalTranscript) : null;
  function start() {
    if (!support?.microphone || locked) return;
    attempt.current?.dispose();
    playback.current?.pause();
    window.speechSynthesis?.cancel();
    setCapture(emptyPronunciationCapture());
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    attempt.current = createPronunciationRecorder(locale, {
      getMicrophone: () => navigator.mediaDevices.getUserMedia({ audio: true }),
      createRecorder: (stream) => new MediaRecorder(stream),
      createRecognition: Recognition ? () => new Recognition() : null,
      schedule: (callback, delay) => setTimeout(callback, delay),
      clear: (timer) => clearTimeout(timer),
    }, setCapture);
    void attempt.current.start();
  }
  return (
    <div className="pronunciation-attempt">
      <p className="pronunciation-target" lang={locale}>“{text}”</p>
      {!locked && <AudioButton text={text} lang={locale} label="Nghe mẫu" />}
      <p className="field-help">Đối chiếu từ được nghe thấy, không phải điểm chuẩn âm vị, ngữ điệu hay thanh điệu. Kết quả có thể sai do micro, tiếng ồn hoặc dịch vụ nhận dạng.</p>
      <p className="field-help">Chỉ mở micro khi bấm bắt đầu. Bản thu chỉ giữ tạm trong lần mở này, không tải lên máy chủ ứng dụng. Trình duyệt có thể gửi âm thanh đến dịch vụ nhận dạng của họ; cần kết nối mạng.</p>
      {support && !support.microphone && <p role="alert" className="notice">Chưa hỗ trợ thu âm trên trình duyệt này. Hãy dùng trình duyệt hỗ trợ micro qua HTTPS hoặc localhost.</p>}
      {support?.microphone && !support.recognition && <p className="notice">Trình duyệt chưa hỗ trợ nhận dạng giọng nói. Bạn có thể thu âm và nghe lại, nhưng chưa có kết quả đối chiếu.</p>}
      <div className="pronunciation-actions">
        <Button type="button" disabled={!support?.microphone || pending} onClick={recording ? () => attempt.current?.stop() : start}>
          {pending ? <Loader2 size={16} className="spin" /> : recording ? <Square size={16} /> : capture.phase === "done" ? <RotateCcw size={16} /> : <Mic size={16} />}
          {capture.phase === "requesting" ? "Đang chờ quyền micro…" : capture.phase === "finishing" ? "Đang nhận kết quả…" : recording ? "Dừng và kiểm tra" : capture.phase === "done" ? "Thu âm lại" : "Bắt đầu thu âm"}
        </Button>
      </div>
      <p role="status" className="field-help">{recording ? "Đang nghe… Tự dừng sau tối đa 45 giây. Đọc xong hãy bấm dừng." : capture.phase === "requesting" ? "Cho phép micro trong hộp thoại của trình duyệt. Đóng cửa sổ này để hủy." : ""}</p>
      {capture.error && <p role="alert" className="notice">{capture.error}</p>}
      {capture.transcript && <div className="pronunciation-transcript"><h3>Trình duyệt nghe được</h3><p lang={locale}>{capture.transcript}</p>{locked && <small>Đang nhận dạng, chưa phải kết quả cuối.</small>}</div>}
      {analysis && <div className="speech-feedback" role="status">
        <h3>Độ khớp nội dung: {analysis.recognizedAccuracy}%</h3>
        <Progress value={analysis.recognizedAccuracy} className="mt-4" />
        <p>{analysis.recognizedAccuracy === 100 ? "Nội dung nhận dạng khớp mẫu. Nghe lại để tự so sánh cách phát âm; độ khớp không xác nhận thanh điệu hay từng âm đã chuẩn." : "Nội dung nhận dạng chưa khớp hoàn toàn. Nghe mẫu rồi đọc chậm và rõ hơn nhé."}</p>
        {analysis.missingWords.length > 0 && <p>Từ/chữ chưa khớp: <strong lang={locale}>{analysis.missingWords.join(" · ")}</strong></p>}
      </div>}
      {capture.phase === "done" && !capture.error && support?.recognition && !capture.finalTranscript && <p className="notice">Chưa nhận được lời nói hoàn chỉnh nên chưa đánh giá. Kiểm tra micro, mạng và thử lại.</p>}
      {audioUrl && !locked && <div className="recording-playback"><label>Nghe lại bản thu của bạn</label><audio ref={playback} controls src={audioUrl} /></div>}
    </div>
  );
}
