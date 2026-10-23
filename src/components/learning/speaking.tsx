"use client";
import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  RotateCcw,
  Headphones,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { SpeakingExercise } from "@prisma/client";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeading } from "@/components/dashboard/dashboard";
import { useData } from "@/hooks/use-data";
import { api } from "@/lib/utils";
import { LoadingSkeleton, ErrorState } from "@/components/ui/states";
import { AudioButton } from "./audio-player";
import { speechLanguage } from "@/lib/languages";
import { SpeakingPhonetics } from "./speaking-phonetics";
import { SpeakingTranslation } from "./speaking-translation";
import { SpeechAssessment } from "./speech-assessment";
import { AIChat } from "@/components/ai/ai-chat";
type Analysis = {
  recognizedAccuracy: number;
  missingWords: string[];
  transcript: string;
  notice: string;
};
export function SpeakingRecorder({
  text,
  tip,
  pinyin,
  language,
  translation,
}: {
  text: string;
  tip?: string;
  pinyin?: string | null;
  language?: string;
  translation?: string;
}) {
  const [recording, setRecording] = useState(false),
    [transcript, setTranscript] = useState(""),
    [audio, setAudio] = useState(""),
    [analysis, setAnalysis] = useState<Analysis | null>(null),
    [busy, setBusy] = useState(false),
    [recognitionSupported, setRecognitionSupported] = useState(true);
  const rec = useRef<MediaRecorder | null>(null),
    recognition = useRef<SpeechRecognition | null>(null),
    stream = useRef<MediaStream | null>(null),
    audioUrl = useRef("");
  const session = useRef<string | null>(null);
  useEffect(() => {
    setRecognitionSupported(
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    );
    return () => {
      recognition.current?.abort();
      if (rec.current?.state === "recording") rec.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    };
  }, []);
  async function start() {
    try {
      setTranscript("");
      setAnalysis(null);
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const recorder = new MediaRecorder(s);
      rec.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = () => {
        if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
        audioUrl.current = URL.createObjectURL(
          new Blob(chunks, { type: recorder.mimeType }),
        );
        setAudio(audioUrl.current);
        s.getTracks().forEach((t) => t.stop());
      };
      const Recognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (Recognition) {
        const r = new Recognition();
        recognition.current = r;
        r.lang = speechLanguage(text);
        r.continuous = true;
        r.interimResults = true;
        r.onresult = (e) => {
          let t = "";
          for (let i = 0; i < e.results.length; i++)
            t += e.results[i][0].transcript + " ";
          setTranscript(t.trim());
        };
        r.onerror = (e) => {
          if (e.error !== "no-speech" && e.error !== "aborted")
            toast.error(
              "Nhận dạng giọng nói chưa khả dụng. Bạn vẫn có thể nghe lại bản ghi.",
            );
        };
        r.start();
      }
      recorder.start();
      setRecording(true);
      const started = await api<{
        id: string;
      }>("/study/start", {
        method: "POST",
        body: JSON.stringify({ kind: "speaking", resourceId: "practice" }),
      });
      session.current = started.id;
    } catch (e) {
      stream.current?.getTracks().forEach((t) => t.stop());
      recognition.current?.abort();
      setRecording(false);
      toast.error(
        e instanceof Error && e.name === "NotAllowedError"
          ? "Hãy cho phép dùng micro trong trình duyệt để ghi âm."
          : "Chưa thể mở micro. Hãy kiểm tra thiết bị và thử lại.",
      );
    }
  }
  async function stop() {
    recognition.current?.stop();
    if (rec.current?.state === "recording") rec.current.stop();
    setRecording(false);
    if (session.current) {
      await api("/study/finish", {
        method: "POST",
        body: JSON.stringify({ sessionId: session.current }),
      }).catch(() => {});
      session.current = null;
    }
  }
  async function analyze() {
    setBusy(true);
    try {
      setAnalysis(
        await api<Analysis>("/speaking/analyze", {
          method: "POST",
          body: JSON.stringify({ expected: text, transcript }),
        }),
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="speaking-card">
      <div className="flex-row justify-between">
        <Badge>
          <Mic size={12} /> SPEAK WITH CONFIDENCE
        </Badge>
        <AudioButton text={text} label="Nghe câu mẫu" />
      </div>
      <h2 className="speaking-sentence">“{text}”</h2>
      <SpeakingPhonetics text={text} language={language} pinyin={pinyin} />
      <SpeakingTranslation text={text} saved={translation} />
      <div className="mt-4"><SpeechAssessment text={text} locale={language === "zh" ? "zh-CN" : language === "en" ? "en-US" : speechLanguage(text)} disabled={recording || busy} /></div>
      <p>{tip || "Nghe câu mẫu, đọc thành tiếng và lắng nghe bản thân."}</p>
      <button
        className={`record-button ${recording ? "recording" : ""}`}
        onClick={recording ? stop : start}
        aria-label={recording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
      >
        {recording ? (
          <Square size={26} fill="currentColor" />
        ) : (
          <Mic size={32} />
        )}
      </button>
      <p>{recording ? "Đang lắng nghe bạn…" : "Nhấn micro để bắt đầu"}</p>
      {!recognitionSupported && (
        <div className="notice mt-4">
          <Info size={17} />
          Trình duyệt này không hỗ trợ nhận dạng giọng nói. Bạn vẫn có thể ghi
          âm và nghe lại.
        </div>
      )}
      {audio && (
        <div className="recording-playback">
          <label>Bản ghi của bạn</label>
          <audio controls src={audio} />
        </div>
      )}
      {transcript && (
        <div className="transcript">
          <h4>Nội dung nhận dạng</h4>
          <p>{transcript}</p>
          <Button
            className="mt-4"
            size="sm"
            disabled={recording || busy}
            onClick={analyze}
          >
            {busy ? (
              <Loader2 size={15} className="spin" />
            ) : (
              "Kiểm tra độ khớp câu"
            )}
          </Button>
        </div>
      )}
      {analysis && (
        <div className="speech-feedback">
          <h3>Độ khớp từ được nhận dạng: {analysis.recognizedAccuracy}%</h3>
          <Progress value={analysis.recognizedAccuracy} className="mt-4" />
          {analysis.missingWords.length > 0 && (
            <p>
              Tập trung đọc lại:{" "}
              <strong>{analysis.missingWords.join(", ")}</strong>
            </p>
          )}
          <p className="field-help">
            {analysis.notice} Đánh giá phát âm, độ trôi chảy và ngữ điệu cần
            dịch vụ phân tích âm thanh chuyên dụng.
          </p>
        </div>
      )}
    </Card>
  );
}
export function Speaking() {
  const { data, loading, error, refresh } =
    useData<(SpeakingExercise & { category: string; translation?: string })[]>("/speaking");
  const [selected, setSelected] = useState("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState("samples");
  if (loading) return <LoadingSkeleton />;
  if (error || !data)
    return <ErrorState message={error || "Không có bài nói"} retry={refresh} />;
  const categories = [...new Set(data.map((item) => item.category || "Chủ đề khác"))];
  const filtered = data.filter((item) => (!category || item.category === category) && `${item.text} ${item.title} ${item.translation || ""} ${item.pinyin || ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / 12) - 1));
  const visible = filtered.slice(currentPage * 12, (currentPage + 1) * 12);
  const ex = filtered.find((item) => item.id === selected) || visible[0];
  return (
    <div className={mode === "samples" ? "content-narrow" : ""}>
      <PageHeading
        title="Tự tin cất lời"
        description="Không cần hoàn hảo. Chỉ cần bắt đầu nói."
      >
        <Badge>
          <Headphones size={13} /> Speaking studio
        </Badge>
      </PageHeading>
      <div className="tabs-row" aria-label="Kiểu luyện nói">
        <button className={`tab-button ${mode === "samples" ? "active" : ""}`} onClick={() => setMode("samples")}>Câu mẫu theo chủ đề</button>
        <button className={`tab-button ${mode === "conversation" ? "active" : ""}`} onClick={() => setMode("conversation")}>Hội thoại với AI</button>
      </div>
      {mode === "conversation" ? <AIChat voiceMode /> : <>
        <Card className="speaking-library">
          <div className="speaking-filters">
            <div className="field"><label htmlFor="speaking-category">Chủ đề</label><select id="speaking-category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(0); setSelected(""); }}><option value="">Tất cả chủ đề ({data.length} mẫu)</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></div>
            <div className="field"><label htmlFor="speaking-search">Tìm câu mẫu</label><input className="input" id="speaking-search" value={query} placeholder="Từ, nghĩa Việt hoặc Pinyin…" onChange={(event) => { setQuery(event.target.value); setPage(0); setSelected(""); }} /></div>
          </div>
          <p className="field-help">{filtered.length} câu mẫu · Chọn một câu để nghe, xem phiên âm và luyện nói.</p>
          <div className="speaking-sample-list">{visible.map((item) => <button key={item.id} aria-pressed={ex?.id === item.id} className={ex?.id === item.id ? "active" : ""} onClick={() => setSelected(item.id)}><small>{item.category} · {item.level}</small><span lang={item.language}>{item.text}</span>{item.translation && <small>{item.translation}</small>}</button>)}</div>
          {!filtered.length && <p>Không có câu phù hợp. Hãy đổi chủ đề hoặc từ tìm kiếm.</p>}
          {filtered.length > 12 && <div className="pronunciation-actions"><Button variant="outline" disabled={currentPage === 0} onClick={() => { setPage(currentPage - 1); setSelected(""); }}>Trang trước</Button><span>Trang {currentPage + 1}/{Math.ceil(filtered.length / 12)}</span><Button variant="outline" disabled={(currentPage + 1) * 12 >= filtered.length} onClick={() => { setPage(currentPage + 1); setSelected(""); }}>Trang sau</Button></div>}
        </Card>
        {ex && <SpeakingRecorder key={ex.id} text={ex.text} tip={ex.tip} pinyin={ex.pinyin} language={ex.language} translation={ex.translation} />}
      </>}
    </div>
  );
}
