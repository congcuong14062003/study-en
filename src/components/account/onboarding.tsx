"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Compass, Target, Clock, Loader2 } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/utils";
export function Onboarding() {
    const [step, setStep] = useState(0), [goal, setGoal] = useState("Giao tiếp"), [level, setLevel] = useState("A1"), [minutes, setMinutes] = useState(20), [busy, setBusy] = useState(false), [error, setError] = useState("");
    const router = useRouter();
    async function next() {
        if (step < 2) {
            setStep(step + 1);
            return;
        }
        setBusy(true);
        try {
            await api("/onboarding", { method: "POST", body: JSON.stringify({ goal, level, dailyMinutes: minutes }) });
            router.push("/placement-test");
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    const Icon = [Compass, Target, Clock][step];
    return <div className="onboarding content-narrow"><Badge>BƯỚC {step + 1} / 3</Badge><Progress value={(step + 1) / 3 * 100} className="mt-4"/><Card className="onboarding-card"><span className="icon-box"><Icon size={28}/></span><h1>{["Tiếng Anh sẽ đưa bạn đến đâu?", "Bạn đang ở đâu trên hành trình?", "Một chút thời gian, mỗi ngày."][step]}</h1><p>{["Chọn mục tiêu quan trọng nhất với bạn.", "Chọn trình độ bạn cảm thấy phù hợp. Bài kiểm tra tiếp theo sẽ giúp xác định rõ hơn.", "Chọn nhịp học phù hợp với lịch của bạn. Bạn có thể thay đổi bất cứ lúc nào."][step]}</p><div className="choice-grid">{step === 0 ? ["Giao tiếp", "Công việc", "Du lịch", "IELTS", "TOEIC", "TOEFL", "Học tập", "Khác"].map(v => <button key={v} className={goal === v ? "choice active" : "choice"} onClick={() => setGoal(v)}>{v}{goal === v && <Check size={17}/>}</button>) : step === 1 ? [["A1", "Mới bắt đầu"], ["A2", "Nền tảng cơ bản"], ["B1", "Trung cấp"], ["B2", "Trên trung cấp"], ["C1", "Nâng cao"], ["C2", "Thành thạo"]].map(([v, t]) => <button key={v} className={level === v ? "choice active" : "choice"} onClick={() => setLevel(v)}><strong>{v}</strong>{t}{level === v && <Check size={17}/>}</button>) : [10, 20, 30, 45, 60].map(v => <button key={v} className={minutes === v ? "choice active" : "choice"} onClick={() => setMinutes(v)}><strong>{v} phút</strong><span>{v === 20 ? "Vừa đủ để tiến bộ" : v === 10 ? "Khởi đầu nhẹ nhàng" : v >= 45 ? "Tập trung bứt phá" : "Xây nền vững chắc"}</span>{minutes === v && <Check size={17}/>}</button>)}</div>{error && <p className="error-message">{error}</p>}<div className="form-actions">{step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft size={16}/> Quay lại</Button>}<Button onClick={next} disabled={busy}>{busy ? <Loader2 className="spin" size={17}/> : <>{step === 2 ? "Bắt đầu kiểm tra trình độ" : "Tiếp tục"}<ArrowRight size={17}/></>}</Button></div></Card></div>;
}
