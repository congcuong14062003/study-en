"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, Loader2, Send, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeading } from "@/components/dashboard/dashboard";
import { AudioButton } from "@/components/learning/audio-player";
import { api } from "@/lib/utils";
import { examAnswersSchema, examLevelLabels, formatExamTime, shouldAcceptExamUpdate, type ExamAnswers, type ExamQuestion, type PublicExamAttempt } from "@/lib/exams";

export function ExamRunner({ attempt, onUpdate }: { attempt: PublicExamAttempt; onUpdate: (attempt: PublicExamAttempt) => void }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswers>(attempt.answers);
  const [now, setNow] = useState(Date.parse(attempt.serverNow));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const attemptRef = useRef(attempt);
  const pending = useRef<ExamAnswers>({});
  const flushing = useRef<Promise<boolean> | null>(null);
  const submitLock = useRef(false);
  const restored = useRef(false);
  const revision = useRef(0);
  const storageKey = `englishmaster-exam-draft:${attempt.id}`;
  attemptRef.current = attempt;
  const apply = useCallback((value: PublicExamAttempt) => {
    if (!shouldAcceptExamUpdate(attemptRef.current, value)) return false;
    attemptRef.current = value;
    if (value.submittedAt) {
      pending.current = {};
      try { localStorage.removeItem(storageKey); } catch {}
    }
    onUpdate(value);
    return true;
  }, [onUpdate, storageKey]);
  const persist = useCallback(() => {
    try {
      if (Object.keys(pending.current).length) localStorage.setItem(storageKey, JSON.stringify(pending.current));
      else localStorage.removeItem(storageKey);
    } catch { /* Server autosave remains available when local storage is disabled. */ }
  }, [storageKey]);
  const flush = useCallback((): Promise<boolean> => {
    if (flushing.current) return flushing.current;
    if (!Object.keys(pending.current).length || attemptRef.current.submittedAt) return Promise.resolve(true);
    const task = (async () => {
      setSaving(true);
      setSaveError("");
      try {
        while (Object.keys(pending.current).length && !attemptRef.current.submittedAt) {
          const updates = { ...pending.current };
          const value = await api<PublicExamAttempt>(`/exam-attempts/${attempt.id}/answers`, {
            method: "PUT", body: JSON.stringify({ answers: updates }),
          });
          revision.current++;
          for (const [id, answer] of Object.entries(updates)) if (pending.current[id] === answer) delete pending.current[id];
          apply(value);
          persist();
        }
        return true;
      } catch (e) { setSaveError((e as Error).message); return false; }
      finally { setSaving(false); flushing.current = null; }
    })();
    flushing.current = task;
    return task;
  }, [apply, persist, attempt.id]);
  useEffect(() => {
    const server = Date.parse(attempt.serverNow);
    const anchor = performance.now();
    setNow(server);
    const timer = window.setInterval(() => setNow(server + performance.now() - anchor), 250);
    return () => window.clearInterval(timer);
  }, [attempt.serverNow]);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const parsed = examAnswersSchema.safeParse(JSON.parse(localStorage.getItem(storageKey) || "{}"));
      if (parsed.success) {
        pending.current = Object.fromEntries(Object.entries(parsed.data).filter(([id]) => attempt.paper.questions.some((q) => q.id === id)));
        setAnswers({ ...attempt.answers, ...pending.current });
        void flush();
      }
    } catch { /* Ignore an invalid draft; server answers are still available. */ }
  }, [attempt.answers, attempt.paper.questions, flush, storageKey]);
  useEffect(() => {
    let disposed = false;
    let syncing = false;
    async function sync() {
      if (disposed || syncing || document.hidden || attemptRef.current.submittedAt) return;
      syncing = true;
      const startedRevision = revision.current;
      try {
        const value = await api<PublicExamAttempt>(`/exam-attempts/${attempt.id}`);
        if (!disposed) {
          const accepted = apply(value);
          if (accepted && startedRevision === revision.current && !flushing.current)
            setAnswers({ ...value.answers, ...pending.current });
          if (!value.submittedAt) await flush();
        }
      } catch { /* Keep pending answers for retry while the connection is unavailable. */ }
      finally { syncing = false; }
    }
    const timer = window.setInterval(() => void sync(), 20000);
    window.addEventListener("online", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    function beforeUnload(event: BeforeUnloadEvent) {
      if (Object.keys(pending.current).length || submitLock.current) { event.preventDefault(); event.returnValue = ""; }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener("online", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [attempt.id, apply, flush]);
  const remaining = attempt.expiresAt ? Math.max(0, Math.ceil((Date.parse(attempt.expiresAt) - now) / 1000)) : null;
  const expired = remaining === 0;
  const locked = expired || submitting;
  const elapsed = Math.max(0, Math.floor((now - Date.parse(attempt.startedAt)) / 1000));
  const answered = attempt.paper.questions.filter((q) => answers[q.id]?.trim()).length;
  const question = attempt.paper.questions[index];
  const submit = useCallback(async (automatic: boolean) => {
    if (submitLock.current || attemptRef.current.submittedAt) return;
    submitLock.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      if (!automatic && !await flush()) throw new Error("Có đáp án chưa lưu được. Hãy thử lưu lại trước khi nộp bài.");
      if (!attemptRef.current.submittedAt) {
        const value = await api<PublicExamAttempt>(`/exam-attempts/${attempt.id}/submit`, { method: "POST", body: "{}" });
        apply(value);
      }
    } catch (e) { setSubmitError((e as Error).message); }
    finally { submitLock.current = false; setSubmitting(false); }
  }, [attempt.id, flush, apply]);
  useEffect(() => {
    if (!expired) return;
    let disposed = false;
    let retry: ReturnType<typeof setTimeout>;
    async function autoSubmit() {
      await submit(true);
      if (!disposed && !attemptRef.current.submittedAt) retry = setTimeout(() => void autoSubmit(), 5000);
    }
    void autoSubmit();
    return () => { disposed = true; clearTimeout(retry); };
  }, [expired, submit]);
  function changeAnswer(answer: string) {
    if (locked || attemptRef.current.submittedAt) return;
    pending.current[question.id] = answer;
    revision.current++;
    setAnswers((old) => ({ ...old, [question.id]: answer }));
    persist();
    void flush();
  }
  async function leave() { if (await flush()) router.push("/exams"); }
  function confirmSubmit() {
    const missing = attempt.paper.questions.length - answered;
    if (window.confirm(`${missing ? `Còn ${missing} câu chưa trả lời. ` : ""}Nộp bài và xem kết quả? Sau khi nộp sẽ không sửa đáp án được.`)) void submit(false);
  }
  return (
    <div className="exam-player">
      <Button variant="ghost" onClick={() => void leave()} disabled={submitting}><ArrowLeft size={16} /> Về danh sách đề</Button>
      <PageHeading title={attempt.paper.title} description={`${examLevelLabels[attempt.paper.level]} · ${attempt.paper.questions.length} câu · ${attempt.mode === "timed" ? "Thời gian vẫn chạy khi rời trang hoặc tải lại" : "Thời gian tính từ lúc bắt đầu, kể cả khi rời trang"}`} />
      <div className="exam-status-bar">
        <span>{answered}/{attempt.paper.questions.length} câu đã trả lời</span>
        <span role="status" className={saveError ? "exam-save-error" : "muted"}>{saving ? "Đang lưu đáp án…" : saveError ? "Có đáp án chưa được lưu" : "Đáp án đã được lưu"}</span>
        <strong className={`exam-timer ${remaining !== null && remaining <= 60 ? "urgent" : ""}`}><Clock3 size={18} /> {remaining === null ? "Đã làm" : "Còn lại"} {formatExamTime(remaining ?? elapsed)}</strong>
      </div>
      <Progress value={answered / attempt.paper.questions.length * 100} />
      {saveError && <div className="error-message" role="alert">{saveError} <Button variant="outline" size="sm" disabled={saving || locked} onClick={() => void flush()}>Thử lưu lại</Button></div>}
      {expired && <p className="notice" role="status">Đã hết giờ. Hệ thống đang tự nộp các đáp án đã lưu. Nếu mất kết nối, bài vẫn bị khóa và sẽ được chấm khi kết nối lại.</p>}
      {submitError && <p className="error-message" role="alert">{submitError}</p>}
      <div className="exam-workspace">
        <Card className="exam-question-card">
          <div className="flex-row justify-between"><Badge>{question.part}</Badge><span className="muted">Câu {index + 1}/{attempt.paper.questions.length}</span></div>
          {question.passage && <div className="exam-passage" lang="en">{question.passage}</div>}
          {question.audioText && <div className="exam-audio"><AudioButton text={question.audioText} label="Nghe bài mẫu" /><small>Bài nghe tổng hợp · có thể nghe lại và chọn tốc độ</small></div>}
          <h2 lang="en">{question.prompt}</h2>
          {question.kind === "choice" ? <div className="quiz-options">{question.options.map((option, i) => <button
            type="button" key={i} disabled={locked} className={`quiz-option ${answers[question.id] === String(i) ? "selected" : ""}`} aria-pressed={answers[question.id] === String(i)} onClick={() => changeAnswer(String(i))}>
            <span className="quiz-option-label">{String.fromCharCode(65 + i)}</span><span className="quiz-option-text" lang="en">{option}</span>{answers[question.id] === String(i) && <Check size={17} />}
          </button>)}</div> : <label className="exam-short-answer">Đáp án · tối đa {question.maxWords} từ
            <input className="input" value={answers[question.id] || ""} maxLength={200} disabled={locked} onChange={(e) => changeAnswer(e.target.value)} placeholder="Nhập đáp án bằng tiếng Anh…" autoComplete="off" spellCheck={false} />
          </label>}
          <div className="exam-question-actions">
            <Button variant="ghost" disabled={index === 0} onClick={() => setIndex((v) => v - 1)}><ArrowLeft size={16} /> Câu trước</Button>
            <Button variant="ghost" disabled={!answers[question.id] || locked} onClick={() => changeAnswer("")}>Xóa đáp án</Button>
            <Button variant="outline" disabled={index === attempt.paper.questions.length - 1} onClick={() => setIndex((v) => v + 1)}>Câu tiếp <ArrowRight size={16} /></Button>
          </div>
        </Card>
        <Card className="exam-navigator">
          <h2>Danh sách câu hỏi</h2>
          <p className="field-help">Có thể bỏ qua và quay lại bất kỳ câu nào trước khi nộp.</p>
          <div className="exam-question-grid">{attempt.paper.questions.map((q, i) => <button type="button" key={q.id} aria-label={`Câu ${i + 1}${answers[q.id]?.trim() ? ", đã trả lời" : ", chưa trả lời"}`} aria-current={index === i ? "step" : undefined}
            className={`${index === i ? "current" : ""} ${answers[q.id]?.trim() ? "answered" : ""}`} onClick={() => setIndex(i)}>{i + 1}</button>)}</div>
          <Button onClick={confirmSubmit} disabled={locked} className="exam-submit">{submitting ? <Loader2 className="spin" size={17} /> : <Send size={17} />} Nộp bài</Button>
          <small>Câu bỏ trống không có điểm. Đáp án và giải thích hiện sau khi nộp.</small>
        </Card>
      </div>
    </div>
  );
}

function answerLabel(question: ExamQuestion, answer: string) {
  if (!answer.trim()) return "Chưa trả lời";
  return question.kind === "choice" ? `${String.fromCharCode(65 + Number(answer))}. ${question.options[Number(answer)] || "Lựa chọn không hợp lệ"}` : answer;
}
export function ExamResults({ attempt }: { attempt: PublicExamAttempt }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const result = attempt.result;
  if (!result) return <Card><p>Kết quả chưa sẵn sàng. Hãy tải lại trang.</p></Card>;
  const rows = result.results.filter((item) => filter === "all" || (filter === "wrong" ? !item.correct && !item.unanswered : item.unanswered));
  async function again() {
    setBusy(true); setError("");
    try {
      const value = await api<PublicExamAttempt>(`/exams/${attempt.paper.id}/start`, { method: "POST", body: JSON.stringify({ mode: attempt.mode }) });
      router.push(`/exams/${value.id}`);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="exam-results">
    <PageHeading title="Kết quả làm bài" description={`${attempt.paper.title} · ${attempt.mode === "practice" ? "Ôn tập" : "Kiểm tra có giờ"}`} />
    <Card className="exam-result-summary">
      <Badge className={attempt.autoSubmitted ? "orange" : "green"}>{attempt.autoSubmitted ? "TỰ NỘP KHI HẾT GIỜ" : "ĐÃ NỘP BÀI"}</Badge>
      <h2>{result.score}<small>/{result.total} câu đúng</small></h2>
      <p>Độ chính xác {result.percent}% · Thời gian làm bài {formatExamTime(attempt.elapsedSeconds)}</p>
      <p className="field-help">Điểm luyện tập trên bộ đề rút gọn, không phải điểm TOEIC hoặc band IELTS chính thức.</p>
      <div className="exam-result-counts"><span><CheckCircle2 size={19} /> {result.score} đúng</span><span><XCircle size={19} /> {result.incorrect} sai</span><span>{result.unanswered} chưa trả lời</span></div>
      <div className="exam-section-scores">{result.sections.map((section) => <span key={section.part}>{section.part}<strong>{section.score}/{section.total}</strong></span>)}</div>
      <div className="flex-row justify-center"><Button asChild variant="outline"><Link href="/exams"><ArrowLeft size={16} /> Danh sách đề</Link></Button><Button disabled={busy} onClick={() => void again()}><RotateCcw size={16} /> Làm lại</Button></div>
      {error && <p className="error-message" role="alert">{error}</p>}
    </Card>
    <div className="tabs-row" role="group" aria-label="Lọc câu trả lời">{[["all", `Tất cả (${result.total})`], ["wrong", `Câu sai (${result.incorrect})`], ["blank", `Chưa trả lời (${result.unanswered})`]].map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} className={`tab-button ${filter === value ? "active" : ""}`} onClick={() => setFilter(value)}>{label}</button>)}</div>
    {!rows.length && <p className="notice">Không có câu nào trong nhóm này.</p>}
    {rows.map((question) => <Card key={question.id} className={`exam-answer-review ${question.correct ? "correct" : "wrong"}`}>
      <div className="flex-row"><Badge className={question.correct ? "green" : "neutral"}>{question.correct ? "Đúng" : question.unanswered ? "Chưa trả lời" : "Sai"}</Badge><span className="muted">Câu {result.results.findIndex((q) => q.id === question.id) + 1} · {question.part}</span></div>
      <h3 lang="en">{question.prompt}</h3>
      {question.passage && <details><summary>Xem lại đoạn đọc</summary><p className="exam-passage" lang="en">{question.passage}</p></details>}
      {question.audioText && <details><summary>Xem nội dung bài nghe</summary><p className="exam-passage" lang="en">{question.audioText}</p></details>}
      <p>Bạn trả lời: <strong>{answerLabel(question, question.selected)}</strong></p>
      <p className="exam-correct-answer">Đáp án đúng: <strong>{question.correctAnswers.map((answer) => answerLabel(question, answer)).join(" / ")}</strong></p>
      <div className="exam-explanation"><strong>Giải thích</strong><p>{question.explanation}</p></div>
    </Card>)}
  </div>;
}
