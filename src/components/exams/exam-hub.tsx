"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Clock3, FileCheck2, History, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Badge } from "@/components/ui/card";
import { ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { PageHeading } from "@/components/dashboard/dashboard";
import { useData } from "@/hooks/use-data";
import { api } from "@/lib/utils";
import { examLevelLabels, formatExamTime, type ExamCatalog, type ExamMode, type PublicExamAttempt } from "@/lib/exams";
import { ExamRunner, ExamResults } from "./exam-player";

export function ExamHub({ attemptId }: { attemptId?: string }) {
  return attemptId ? <AttemptPage key={attemptId} id={attemptId} /> : <Catalog />;
}
function AttemptPage({ id }: { id: string }) {
  const { data, setData, loading, error, refresh } = useData<PublicExamAttempt>(`/exam-attempts/${encodeURIComponent(id)}`);
  if (loading && !data) return <LoadingSkeleton />;
  if (error || !data) return <ErrorState message={error || "Không tìm thấy bài làm."} retry={refresh} />;
  return data.submittedAt
    ? <ExamResults attempt={data} />
    : <ExamRunner attempt={data} onUpdate={setData} />;
}
function Catalog() {
  const router = useRouter();
  const { data, loading, error, refresh } = useData<ExamCatalog>("/exams");
  const [type, setType] = useState("all");
  const [level, setLevel] = useState("all");
  const [mode, setMode] = useState<ExamMode>("practice");
  const [starting, setStarting] = useState<string | null>(null);
  const [startError, setStartError] = useState("");
  async function start(id: string) {
    if (starting) return;
    setStarting(id);
    setStartError("");
    try {
      const attempt = await api<PublicExamAttempt>(`/exams/${encodeURIComponent(id)}/start`, {
        method: "POST", body: JSON.stringify({ mode }),
      });
      router.push(`/exams/${attempt.id}`);
    } catch (e) { setStartError((e as Error).message); }
    finally { setStarting(null); }
  }
  if (loading && !data) return <LoadingSkeleton />;
  if (error || !data) return <ErrorState message={error || "Không tải được bộ đề."} retry={refresh} />;
  const papers = data.papers.filter((paper) => (type === "all" || paper.examType === type) && (level === "all" || paper.level === level));
  return (
    <div className="exam-hub">
      <PageHeading title="Luyện đề theo nhịp của bạn" description="Chọn TOEIC hoặc IELTS, chọn mức độ và bắt đầu một lượt ôn tập hay kiểm tra có giờ.">
        <Badge><FileCheck2 size={14} /> {data.papers.length} bộ đề</Badge>
      </PageHeading>
      <div className="exam-mode-grid" role="group" aria-label="Chế độ làm bài">
        {([
          ["practice", BookOpen, "Ôn tập", "Đếm thời gian đã làm, không giới hạn. Bạn tự chọn lúc nộp bài."],
          ["timed", Clock3, "Kiểm tra", "Đếm ngược theo thời hạn bộ đề. Hết giờ tự nộp các đáp án đã lưu."],
        ] as const).map(([value, Icon, title, description]) => (
          <button key={value} type="button" className={`exam-mode ${mode === value ? "selected" : ""}`} aria-pressed={mode === value} onClick={() => setMode(value)}>
            <Icon size={25} /><span><strong>{title}</strong><small>{description}</small></span>
          </button>
        ))}
      </div>
      {data.active.length > 0 && (
        <Card className="exam-active">
          <h2>Tiếp tục bài đang làm</h2>
          <p className="field-help">Đồng hồ tính từ lúc bắt đầu; quay lại trang không đặt lại thời gian.</p>
          {data.active.map((attempt) => <div className="exam-history-row" key={attempt.id}>
            <span><strong>{attempt.title}</strong><small>{attempt.mode === "timed" ? "Kiểm tra có giờ" : "Ôn tập"}</small></span>
            <Button asChild size="sm" variant="secondary"><Link href={`/exams/${attempt.id}`}>Tiếp tục <Play size={14} /></Link></Button>
          </div>)}
        </Card>
      )}
      <div className="exam-filters">
        <label>Loại đề<select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">Tất cả</option><option value="TOEIC">TOEIC nghe–đọc</option><option value="IELTS">IELTS Academic Reading</option>
        </select></label>
        <label>Mức độ<select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="all">Tất cả mức độ</option>{Object.entries(examLevelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
      </div>
      <p className="field-help exam-note">Bộ đề luyện tập rút gọn do EnglishMaster biên soạn. Điểm là số câu đúng và tỷ lệ chính xác, không quy đổi thành điểm TOEIC hoặc band IELTS chính thức. Bài nghe mẫu dùng giọng đọc của trình duyệt.</p>
      {startError && <p className="error-message" role="alert">{startError}</p>}
      {papers.length ? <div className="exam-paper-grid">{papers.map((paper) => {
        const active = data.active.find((attempt) => attempt.paperId === paper.id && attempt.mode === mode);
        return <Card className="exam-paper-card" key={paper.id}>
          <div className="flex-row justify-between"><Badge>{paper.examType}</Badge><Badge className="neutral">{examLevelLabels[paper.level]}</Badge></div>
          <h2>{paper.title}</h2><p>{paper.description}</p>
          <div className="exam-paper-meta"><span><FileCheck2 size={15} /> {paper.questionCount} câu</span><span><Clock3 size={15} /> {Math.round(paper.durationSeconds / 60)} phút kiểm tra</span></div>
          <small>{mode === "practice" ? "Ôn tập: không giới hạn thời gian" : "Thời gian bắt đầu ngay khi bấm làm bài"}</small>
          {active
            ? <Button asChild><Link href={`/exams/${active.id}`}>Tiếp tục bài đang làm <Play size={15} /></Link></Button>
            : <Button disabled={starting !== null} onClick={() => void start(paper.id)}>{starting === paper.id ? <Loader2 className="spin" size={16} /> : <Play size={15} />}{mode === "practice" ? "Bắt đầu ôn tập" : "Bắt đầu kiểm tra"}</Button>}
        </Card>;
      })}</div> : <Card className="empty-state"><BookOpen size={28} /><h2>{data.papers.length ? "Chưa có bộ đề phù hợp" : "Bộ đề đang được cập nhật"}</h2><p>{data.papers.length ? "Thử chọn loại đề hoặc mức độ khác." : "Các bộ đề sẽ xuất hiện tại đây khi được xuất bản."}</p></Card>}
      <Card className="exam-history">
        <h2><History size={20} /> Lịch sử làm bài</h2>
        <p className="field-help">30 lượt hoàn thành gần nhất. Mở lại để xem đáp án và giải thích.</p>
        {!data.attempts.length && <p>Chưa có bài đã nộp. Chọn một bộ đề để bắt đầu.</p>}
        {data.attempts.map((attempt) => <div className="exam-history-row" key={attempt.id}>
          <span><strong>{attempt.title}</strong><small>{attempt.mode === "timed" ? "Kiểm tra" : "Ôn tập"} · {new Date(attempt.startedAt).toLocaleString("vi-VN")} · {formatExamTime(attempt.elapsedSeconds)}{attempt.autoSubmitted ? " · Tự nộp khi hết giờ" : ""}</small></span>
          <span className="exam-history-score">{attempt.score}/{attempt.total}</span>
          <Button asChild size="sm" variant="outline"><Link href={`/exams/${attempt.id}`}>Xem kết quả</Link></Button>
        </div>)}
      </Card>
    </div>
  );
}
