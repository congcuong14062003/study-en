"use client";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useData } from "@/hooks/use-data";
import { useVoiceCapture } from "@/hooks/use-voice-capture";
import { api } from "@/lib/utils";
import { speechLanguage } from "@/lib/languages";
import { speechBlobToWav } from "@/lib/speech-audio";
import type { SpeechAssessment as Assessment } from "@/lib/speech-assessment";
import { AudioButton } from "./audio-player";
import { SpeakingPhonetics } from "./speaking-phonetics";

export function SpeechAssessment({ text, locale = speechLanguage(text), disabled = false }: { text: string; locale?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const reference = text.trim();
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button type="button" size="sm" variant="outline" disabled={disabled || !reference || reference.length > 500}>Luyện phát âm câu này</Button></DialogTrigger>
    <DialogContent className="pronunciation-dialog">
      <DialogTitle>Chấm phát âm từ âm thanh</DialogTitle>
      <DialogDescription>Đọc lại đúng câu mẫu. Azure phân tích bản thu, không dùng độ khớp văn bản làm điểm phát âm.</DialogDescription>
      {open && <AssessmentAttempt key={`${locale}:${reference}`} text={reference} locale={locale} />}
    </DialogContent>
  </Dialog>;
}
function AssessmentAttempt({ text, locale }: { text: string; locale: string }) {
  const { data: status, error: statusError, refresh } = useData<{ configured: boolean; dailyLimit: number }>("/speech/assessment");
  const voice = useVoiceCapture(locale, false);
  const [result, setResult] = useState<Assessment | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function submit() {
    if (!voice.capture.audio || busy || voice.locked) return;
    setBusy(true); setError(""); setResult(null);
    const controller = new AbortController(); request.current = controller;
    try {
      const wav = await speechBlobToWav(voice.capture.audio);
      if (controller.signal.aborted) return;
      const evaluated = await api<Assessment>("/speech/assessment", { method: "POST", headers: { "Content-Type": "audio/wav", "X-Reference-Text": encodeURIComponent(text), "X-Speech-Language": locale }, body: wav, signal: controller.signal });
      if (!controller.signal.aborted) setResult(evaluated);
    } catch (reason) { if (!controller.signal.aborted) setError((reason as Error).message); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  return <div className="pronunciation-attempt">
    <p className="pronunciation-target" lang={locale}>{text}</p>
    {!voice.locked && <AudioButton text={text} lang={locale} label="Nghe câu mẫu" />}
    <SpeakingPhonetics text={text} language={locale === "zh-CN" ? "zh" : "en"} />
    {statusError && <><p role="alert">{statusError}</p><Button onClick={refresh}>Thử lại</Button></>}
    {!status && !statusError && <p role="status">Đang kiểm tra kết nối chấm phát âm…</p>}
    {status && !status.configured && <div className="notice">Chưa bật chấm âm thanh. Quản trị viên cần tạo Azure Speech resource và cấu hình <code>AZURE_SPEECH_KEY</code>, <code>AZURE_SPEECH_REGION</code> trên server, rồi khởi động lại hoặc redeploy. Chưa có điểm phát âm cho lần này.</div>}
    {status?.configured && <>
      <p className="field-help">Bản thu giữ tạm trong cửa sổ này. Chỉ khi bấm “Chấm phát âm”, âm thanh và câu mẫu được gửi qua server tới Microsoft Azure; ứng dụng không lưu bản thu. Azure có phí riêng, giới hạn {status.dailyLimit} lượt/24 giờ cho mỗi tài khoản, gồm cả Premium.</p>
      <p className="field-help">Mỗi bản thu tự dừng sau 28 giây. Nếu câu dài, hãy chọn một câu ngắn hơn. Điểm có thể bị ảnh hưởng bởi tiếng ồn; chưa có đánh giá thanh điệu tiếng Trung riêng.</p>
      {!voice.supported && <p>Trình duyệt chưa hỗ trợ thu âm. Dùng trình duyệt có micro qua HTTPS hoặc localhost.</p>}
      <Button disabled={!voice.supported || voice.pending || busy} onClick={() => { setResult(null); setError(""); if (voice.recording) voice.stop(); else voice.start(); }}>{voice.pending ? "Đang xử lý…" : voice.recording ? "Dừng thu" : "Thu âm đọc lại"}</Button>
      {voice.capture.error && <p role="alert">{voice.capture.error}</p>}
      {!voice.locked && voice.audioUrl && <><audio ref={voice.playback} controls src={voice.audioUrl} /><Button disabled={busy} onClick={submit}>{busy ? "Đang chấm âm thanh…" : "Chấm phát âm"}</Button></>}
    </>}
    {error && <p role="alert" className="error-message">{error}</p>}
    {result && <section className="speech-feedback" aria-label="Kết quả Azure">
      <h3>Điểm phát âm: {Math.round(result.pronunciation)}/100</h3>
      <p>Độ chính xác {Math.round(result.accuracy)} · Trôi chảy {Math.round(result.fluency)} · Đọc đủ {Math.round(result.completeness)}</p>
      <p>Azure nhận dạng: {result.text}</p>
      <h4>Từ cần luyện lại</h4>
      {result.words.filter((word) => word.error !== "None" || word.accuracy < 70).length === 0 && <p>Chưa thấy từ bị đánh dấu trong lần này. Nghe lại để so sánh; điểm cao không khẳng định mọi âm đều chuẩn.</p>}
      {result.words.filter((word) => word.error !== "None" || word.accuracy < 70).map((word, index) => <div className="assessment-word" key={`${word.word}:${index}`}>
        <strong>{word.word}</strong> · {Math.round(word.accuracy)}/100 · {({ Mispronunciation: "Âm chưa rõ/chuẩn", Omission: "Chưa đọc từ này", Insertion: "Đọc thêm ngoài câu mẫu", None: "Nên luyện rõ hơn" } as Record<string, string>)[word.error] || "Cần đối chiếu lại"}
        {word.phonemes.some((item) => item.accuracy < 70) && <p>Âm cần chú ý ({locale === "en-US" ? "IPA" : "ký hiệu Azure/SAPI"}): {word.phonemes.filter((item) => item.accuracy < 70).map((item) => `${item.phoneme} (${Math.round(item.accuracy)})`).join(" · ")}</p>}
        <AudioButton text={word.word} lang={locale} label="Nghe và đọc lại từ" />
      </div>)}
      <p className="field-help">Nghe mẫu chậm, đọc rõ từng cụm rồi thu lại để so sánh. Đây là đánh giá tự động tham khảo, không phải chứng nhận phát âm.</p>
    </section>}
  </div>;
}
