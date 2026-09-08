"use client";
import { useState } from "react";
import { Check, Clock3, Copy, FilePenLine, History, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { WritingExercise } from "@prisma/client";
import { useData } from "@/hooks/use-data";
import { api } from "@/lib/utils";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeading } from "@/components/dashboard/dashboard";
import { LoadingSkeleton, ErrorState } from "@/components/ui/states";
import type { WritingAnalysis } from "@/services/ai";
type AIStatus = {
    configured: boolean;
    plan: "FREE" | "PREMIUM";
    usage: {
        writing: {
            used: number;
            limit: number | null;
        };
    };
};
type Submission = {
    id: string;
    exerciseId: string;
    text: string;
    analysis: WritingAnalysis | null;
    createdAt: string;
    exercise: {
        id: string;
        title: string;
        level: string;
    };
};
export function Writing() {
    const { data, loading, error, refresh } = useData<WritingExercise[]>("/writing");
    const { data: status, refresh: refreshStatus } = useData<AIStatus>("/ai/status");
    const { data: submissions, refresh: refreshSubmissions } = useData<Submission[]>("/writing/submissions");
    const [selected, setSelected] = useState(0);
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);
    const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null);
    const [apiError, setApiError] = useState("");
    const [explain, setExplain] = useState(true);
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    async function analyze() {
        if (!data)
            return;
        setBusy(true);
        setApiError("");
        try {
            const result = await api<WritingAnalysis>("/writing/analyze", {
                method: "POST",
                body: JSON.stringify({ exerciseId: data[selected].id, text }),
            });
            setAnalysis(result);
            refreshSubmissions();
            refreshStatus();
            toast.success("Đã lưu bài viết và phản hồi");
        }
        catch (caught) {
            setApiError((caught as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    async function saveDraft() {
        try {
            await api("/notes", { method: "POST", body: JSON.stringify({ title: `Bản nháp: ${data?.[selected].title}`, content: text, tags: ["writing", "draft"] }) });
            toast.success("Đã lưu bản nháp vào Ghi chú");
        }
        catch (caught) {
            toast.error((caught as Error).message);
        }
    }
    function openSubmission(submission: Submission) {
        const exerciseIndex = data?.findIndex(item => item.id === submission.exerciseId) ?? -1;
        if (exerciseIndex >= 0)
            setSelected(exerciseIndex);
        setText(submission.text);
        setAnalysis(submission.analysis);
        setApiError("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (loading)
        return <LoadingSkeleton />;
    if (error || !data?.length)
        return <ErrorState message={error || "Không tìm thấy đề bài"} retry={refresh}/>;
    const exercise = data[selected];
    const quota = status?.usage.writing;
    return <>
        <PageHeading title="Ý tưởng của bạn, bằng tiếng Anh." description="Viết, nhận phản hồi có cấu trúc và xem lại tiến bộ của mình."><Badge><FilePenLine size={12}/> Writing studio</Badge></PageHeading>
        <div className="tabs-row">{data.map((item, index) => <button key={item.id} className={`tab-button ${selected === index ? "active" : ""}`} onClick={() => {
        setSelected(index);
        setAnalysis(null);
        setApiError("");
    }}>{item.title}</button>)}</div>
        <div className="writing-layout">
            <Card className="writing-editor">
                <div className="writing-prompt"><Badge>{exercise.level} · {exercise.minWords}+ WORDS</Badge><h2>{exercise.prompt}</h2></div>
                <textarea value={text} onChange={event => {
        setText(event.target.value);
        if (analysis)
            setAnalysis(null);
    }} maxLength={10000} aria-label="Bài viết tiếng Anh" placeholder="Your words matter. Start writing here…"/>
                <div className="writing-toolbar"><span className={words > 0 && words < exercise.minWords ? "orange-text" : ""}>{words} từ · {text.length} ký tự</span><Button variant="outline" size="sm" disabled={!text.trim()} onClick={saveDraft}>Lưu bản nháp</Button><Button size="sm" onClick={analyze} disabled={busy || text.trim().length < 10 || !status?.configured}>{busy ? <Loader2 size={15} className="spin"/> : <Sparkles size={15}/>} Phân tích bài viết</Button></div>
                {words > 0 && words < exercise.minWords && <p className="field-help">Bạn vẫn có thể phân tích, nhưng điểm đáp ứng đề bài có thể thấp vì chưa đủ {exercise.minWords} từ.</p>}
                {status && <p className="field-help">{status.configured ? status.plan === "PREMIUM" ? "Premium · không giới hạn lượt chấm bài." : `${quota?.used || 0}/${quota?.limit} lượt chấm trong 24 giờ.` : "Thêm GROQ_API_KEY vào .env và khởi động lại server để bật phân tích AI."}</p>}
                {apiError && <p className="error-message" role="alert">{apiError}</p>}
            </Card>
            <Card className="writing-feedback">{analysis ? <WritingFeedback analysis={analysis} explain={explain} setExplain={setExplain}/> : <div className="writing-empty"><span className="icon-box purple"><Sparkles size={28}/></span><h3>Một góc nhìn để viết tốt hơn</h3><p>AI chấm ngữ pháp, từ vựng, mạch lạc, đáp ứng đề bài và cách diễn đạt tự nhiên.</p>{status && !status.configured && <div className="notice">Phân tích AI chưa được cấu hình. Bạn vẫn có thể viết và lưu bản nháp.</div>}</div>}</Card>
        </div>
        <Card className="section-card writing-history"><div className="flex-row justify-between mb-4"><div className="flex-row"><History size={19} className="purple-text"/><h2>Lịch sử chấm bài</h2></div><Badge className="neutral">{submissions?.length || 0} bài gần nhất</Badge></div>{submissions?.length ? submissions.map(item => <button className="writing-history-row" key={item.id} onClick={() => openSubmission(item)}><span><strong>{item.exercise.title}</strong><small><Clock3 size={12}/>{new Date(item.createdAt).toLocaleString("vi-VN")}</small></span><Badge className={(item.analysis?.score || 0) >= 70 ? "green" : "orange"}>{item.analysis?.score ?? "—"}/100</Badge></button>) : <p className="field-help">Bài đã được AI phân tích sẽ xuất hiện tại đây.</p>}</Card>
    </>;
}
function WritingFeedback({ analysis, explain, setExplain }: {
    analysis: WritingAnalysis;
    explain: boolean;
    setExplain: (value: boolean) => void;
}) {
    const scores = [["Ngữ pháp", analysis.grammarScore], ["Từ vựng", analysis.vocabularyScore], ["Mạch lạc", analysis.coherenceScore], ["Đáp ứng đề", analysis.taskResponseScore], ["Tự nhiên", analysis.naturalnessScore]] as const;
    return <><div className="writing-score"><strong>{analysis.score}</strong><span>/ 100</span><h3>Phản hồi cho bài viết của bạn</h3></div>{scores.map(([label, value]) => <div className="skill-progress-row mb-4" key={label}><div><span>{label}</span><span>{value}/100</span></div><Progress value={value}/></div>)}<Button variant="outline" size="sm" onClick={() => setExplain(!explain)}>{explain ? "Ẩn giải thích lỗi" : "Giải thích lỗi"}</Button>{explain && (analysis.mistakes.length ? analysis.mistakes.map((mistake, index) => <div className="writing-mistake" key={`${mistake.original}-${index}`}><del>{mistake.original}</del><strong><Check size={14}/>{mistake.corrected}</strong><p>{mistake.explanation}</p></div>) : <p className="field-help mt-4">Không phát hiện lỗi cụ thể đáng chú ý.</p>)}<div className="writing-suggestions">{analysis.suggestions.map((suggestion, index) => <p key={index}>{suggestion}</p>)}</div><details className="mt-4"><summary>Phiên bản tự nhiên hơn</summary><p className="rich-content">{analysis.improvedVersion}</p><Button size="sm" variant="secondary" className="mt-4" onClick={async () => {
        try {
            await navigator.clipboard.writeText(analysis.improvedVersion);
            toast.success("Đã sao chép");
        }
        catch {
            toast.error("Không thể sao chép. Hãy chọn và sao chép văn bản.");
        }
    }}><Copy size={14}/> Sao chép bản viết lại</Button></details></>;
}
