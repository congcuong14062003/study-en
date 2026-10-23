"use client";
import { Button } from "@/components/ui/button";
import { useVoiceCapture } from "@/hooks/use-voice-capture";
import { useEffect } from "react";
export function VoiceMessageInput({ locale, disabled, onUse, onActive }: { locale: string; disabled: boolean; onUse: (text: string) => void; onActive?: (active: boolean) => void }) {
  return <VoiceInput key={locale} locale={locale} disabled={disabled} onUse={onUse} onActive={onActive} />;
}
function VoiceInput({ locale, disabled, onUse, onActive }: { locale: string; disabled: boolean; onUse: (text: string) => void; onActive?: (active: boolean) => void }) {
  const voice = useVoiceCapture(locale);
  useEffect(() => { onActive?.(voice.locked); return () => onActive?.(false); }, [voice.locked, onActive]);
  return <section className="voice-message-input" aria-label="Hội thoại bằng giọng nói">
    <p>Nói tối đa 28 giây → xem lại lời nhận dạng → gửi cho AI. Trình duyệt có thể dùng dịch vụ nhận dạng trực tuyến của họ. Bản thu không được gửi tới Groq.</p>
    <Button type="button" variant="outline" disabled={voice.pending || (!voice.recording && (disabled || !voice.supported))} onClick={voice.recording ? voice.stop : voice.start}>{voice.pending ? "Đang xử lý micro…" : voice.recording ? "Dừng nói" : "Nói bằng micro"}</Button>
    {!voice.recognitionSupported && <p className="field-help">Chưa có nhận dạng giọng nói trên trình duyệt này; anh có thể nghe lại rồi nhập câu ở dưới.</p>}
    {voice.capture.error && <p role="alert">{voice.capture.error}</p>}
    {voice.capture.transcript && <p lang={locale}>{voice.capture.transcript}</p>}
    {!voice.locked && voice.audioUrl && <audio ref={voice.playback} controls src={voice.audioUrl} />}
    {!voice.locked && voice.capture.finalTranscript && <Button type="button" disabled={disabled} onClick={() => onUse(voice.capture.finalTranscript.slice(0, 2000))}>Dùng lời nói này</Button>}
    <small>AI hội thoại sửa cách dùng từ và ngữ pháp từ bản nhận dạng, không chấm âm thanh. Dùng “Luyện phát âm câu này” để thu lại và chấm qua Azure.</small>
  </section>;
}
