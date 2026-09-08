"use client";
import { useState } from "react";
import { Check, Copy, FilePenLine, Loader2, Sparkles } from "lucide-react";
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
export function Writing() {
    const { data, loading, error, refresh } = useData<WritingExercise[]>("/writing");
    const { data: config } = useData<{
        ai: boolean;
    }>("/config");
    const [selected, setSelected] = useState(0), [text, setText] = useState(""), [busy, setBusy] = useState(false), [analysis, setAnalysis] = useState<WritingAnalysis | null>(null), [apiError, setApiError] = useState(""), [explain, setExplain] = useState(true);
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    async function analyze() {
        if (!data)
            return;
        setBusy(true);
        setApiError("");
        try {
            setAnalysis(await api<WritingAnalysis>("/writing/analyze", { method: "POST", body: JSON.stringify({ exerciseId: data[selected].id, text }) }));
            toast.success("Đã lưu bài viết và phản hồi");
        }
        catch (e) {
            setApiError((e as Error).message);
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
        catch (e) {
            toast.error((e as Error).message);
        }
    }
    if (loading)
        return <LoadingSkeleton />;
    if (error || !data)
        return <ErrorState message={error || "Không tìm thấy đề bài"} retry={refresh}/>;
    const ex = data[selected];
    return <><PageHeading title="Ý tưởng của bạn, bằng tiếng Anh." description="Viết rõ ràng hơn qua từng câu, từng đoạn."><Badge><FilePenLine size={12}/> Writing studio</Badge></PageHeading><div className="tabs-row">{data.map((d, i) => <button key={d.id} className={`tab-button ${selected === i ? "active" : ""}`} onClick={() => {
                if (text && selected !== i) {
                    setApiError("Bản nháp hiện tại được giữ lại. Hãy lưu ghi chú trước khi viết bài mới.");
                }
                setSelected(i);
                setAnalysis(null);
            }}>{d.title}</button>)}</div><div className="writing-layout"><Card className="writing-editor"><div className="writing-prompt"><Badge>{ex.level} · {ex.minWords}+ WORDS</Badge><h2>{ex.prompt}</h2></div><textarea value={text} onChange={e => {
            setText(e.target.value);
            if (analysis)
                setAnalysis(null);
        }} maxLength={10000} aria-label="Bài viết tiếng Anh" placeholder="Your words matter. Start writing here…"/><div className="writing-toolbar"><span>{words} từ · {text.length} ký tự</span><Button variant="outline" size="sm" disabled={!text.trim()} onClick={saveDraft}>Lưu bản nháp</Button><Button size="sm" onClick={analyze} disabled={busy || text.trim().length < 10 || !config?.ai}>{busy ? <Loader2 size={15} className="spin"/> : <Sparkles size={15}/>} Phân tích bài viết</Button></div>{apiError && <p className="error-message" role="alert">{apiError}</p>}</Card><Card className="writing-feedback">{analysis ? <><div className="writing-score"><strong>{analysis.score}</strong><span>/ 100</span><h3>Phản hồi cho bài viết của bạn</h3></div>{[["Ngữ pháp", analysis.grammarScore], ["Từ vựng", analysis.vocabularyScore], ["Mạch lạc", analysis.coherenceScore], ["Tự nhiên", analysis.naturalnessScore]].map(([t, v]) => <div className="skill-progress-row mb-4" key={t}><div><span>{t}</span><span>{v}/100</span></div><Progress value={Number(v)}/></div>)}<Button variant="outline" size="sm" onClick={() => setExplain(!explain)}>{explain ? "Ẩn giải thích lỗi" : "Giải thích lỗi"}</Button>{explain && analysis.mistakes.map((m, i) => <div className="writing-mistake" key={i}><del>{m.original}</del><strong><Check size={14}/>{m.corrected}</strong><p>{m.explanation}</p></div>)}{analysis.suggestions.map((s, i) => <p className="mt-4" key={i}>{s}</p>)}<details className="mt-4"><summary>Phiên bản tự nhiên hơn</summary><p className="rich-content">{analysis.improvedVersion}</p><Button size="sm" variant="secondary" className="mt-4" onClick={async () => {
                try {
                    await navigator.clipboard.writeText(analysis.improvedVersion);
                    toast.success("Đã sao chép");
                }
                catch {
                    toast.error("Không thể sao chép. Hãy chọn và sao chép văn bản.");
                }
            }}><Copy size={14}/> Sao chép bản viết lại</Button></details></> : <div className="writing-empty"><span className="icon-box purple"><Sparkles size={28}/></span><h3>Một góc nhìn để viết tốt hơn</h3><p>AI sẽ xem xét ngữ pháp, từ vựng, tính mạch lạc và cách diễn đạt của bạn.</p>{config && !config.ai && <div className="notice">Phân tích AI sẽ khả dụng khi quản trị viên kết nối dịch vụ. Bạn vẫn có thể viết và lưu bản nháp.</div>}</div>}</Card></div></>;
}
