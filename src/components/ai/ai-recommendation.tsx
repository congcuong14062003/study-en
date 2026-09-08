"use client";
import Link from "next/link";
import { ArrowRight, Clock3, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/utils";
import { useData } from "@/hooks/use-data";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LearningRecommendation } from "@/services/ai";
type AIStatus = {
    configured: boolean;
    plan: "FREE" | "PREMIUM";
    usage: {
        recommendation: {
            used: number;
            limit: number | null;
        };
    };
};
const skillRoutes: Record<LearningRecommendation["focusSkill"], string> = {
    vocabulary: "/vocabulary",
    grammar: "/grammar",
    listening: "/listening",
    speaking: "/speaking",
    reading: "/reading",
    writing: "/writing",
};
export function AIRecommendation({ fallback }: {
    fallback: [
        string,
        number
    ] | undefined;
}) {
    const { data: status, refresh } = useData<AIStatus>("/ai/status");
    const [recommendation, setRecommendation] = useState<LearningRecommendation>();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    async function generate() {
        setBusy(true);
        setError("");
        try {
            setRecommendation(await api<LearningRecommendation>("/ai/recommendation", { method: "POST", body: "{}" }));
            refresh();
        }
        catch (caught) {
            setError((caught as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    if (recommendation)
        return <Card className="section-card ai-recommendation"><div className="flex-row justify-between mb-4"><div className="flex-row"><Sparkles size={20} className="purple-text"/><h2>Kế hoạch AI dành cho bạn</h2></div><Badge>{recommendation.focusSkill.toUpperCase()}</Badge></div><p>{recommendation.summary}</p><div className="ai-recommendation-reason"><strong>Trọng tâm tuần này</strong><p>{recommendation.reason}</p><span>{recommendation.weeklyGoal}</span></div><div className="ai-action-list">{recommendation.actions.map((action, index) => <Link href={skillRoutes[action.skill]} key={`${action.skill}-${index}`}><span>{index + 1}</span><div><strong>{action.title}</strong><p>{action.reason}</p></div><small><Clock3 size={13}/>{action.minutes} phút</small><ArrowRight size={15}/></Link>)}</div><Button variant="outline" size="sm" className="mt-4" onClick={generate} disabled={busy}>{busy && <Loader2 size={14} className="spin"/>} Tạo gợi ý mới</Button></Card>;
    return <Card className="section-card"><div className="flex-row mb-4"><Sparkles size={20} className="purple-text"/><h2 style={{ margin: 0 }}>Gợi ý bước tiếp theo</h2></div><p>{fallback ? `Kết quả gần nhất cho thấy ${fallback[0]} đang ở ${fallback[1]}%. Hãy dành thêm một buổi luyện tập cho kỹ năng này.` : "Hoàn thành bài kiểm tra đầu vào để có thêm dữ liệu cá nhân hóa."}</p>{status?.configured ? <><Button className="mt-4" onClick={generate} disabled={busy}>{busy ? <Loader2 size={15} className="spin"/> : <Sparkles size={15}/>} Phân tích lộ trình bằng AI</Button><p className="field-help mt-4">{status.plan === "PREMIUM" ? "Premium · không giới hạn gợi ý." : `${status.usage.recommendation.used}/${status.usage.recommendation.limit} lượt gợi ý trong 24 giờ.`}</p></> : <><Button asChild className="mt-4"><Link href={fallback ? skillRoutes[(fallback[0] in skillRoutes ? fallback[0] : "vocabulary") as keyof typeof skillRoutes] : "/placement-test"}>{fallback ? "Luyện tập kỹ năng này" : "Kiểm tra trình độ"}<ArrowRight size={16}/></Link></Button><p className="field-help mt-4">Thêm GROQ_API_KEY để AI phân tích quiz, tiến độ và từ đang chờ ôn.</p></>}{error && <p className="error-message" role="alert">{error}</p>}</Card>;
}
