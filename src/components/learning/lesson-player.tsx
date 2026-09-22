"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, FileText, GripVertical, Headphones, Loader2, Mic, NotebookPen, PenLine, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { api } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, Badge } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSkeleton, ErrorState } from "@/components/ui/states";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ReadingContent } from "./content-library";
import { MediaAudioPlayer } from "./audio-player";
import { SpeakingRecorder } from "./speaking";
import { MiniWriting, SentenceBuilder, WordMatch } from "./lesson-activities";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { FavoriteButton } from "./favorite-button";
import type { LessonData } from "@/services/content";
export function LessonPlayer({ id }: {
    id: string;
}) {
    const { data, loading, error, refresh } = useData<LessonData>(`/lessons/${id}`);
    const [step, setStep] = useState(0), [maxStep, setMaxStep] = useState(0), [busy, setBusy] = useState(false), [note, setNote] = useState(false), [noteBusy, setNoteBusy] = useState(false), [finished, setFinished] = useState(false);
    const session = useRef<string | null>(null);
    useEffect(() => {
        if (data) {
            setStep(Math.min(data.progress?.step || 0, 5));
            setMaxStep(Math.min(data.progress?.step || 0, 5));
            setFinished(Boolean(data.progress?.completed));
        }
    }, [data]);
    useEffect(() => {
        if (!data)
            return;
        let active = true;
        api<{
            id: string;
        }>("/study/start", { method: "POST", body: JSON.stringify({ kind: "lesson", resourceId: id }) }).then(s => {
            if (active)
                session.current = s.id;
            else
                void api("/study/finish", { method: "POST", body: JSON.stringify({ sessionId: s.id }), keepalive: true });
        }).catch(() => {
        });
        const pagehide = () => {
            if (session.current) {
                void api("/study/finish", { method: "POST", body: JSON.stringify({ sessionId: session.current }), keepalive: true }).catch(() => {
                });
                session.current = null;
            }
        };
        window.addEventListener("pagehide", pagehide);
        return () => {
            active = false;
            pagehide();
            window.removeEventListener("pagehide", pagehide);
        };
    }, [id, Boolean(data)]);
    async function next() {
        setBusy(true);
        try {
            await api(`/lessons/${id}/progress`, { method: "POST", body: JSON.stringify({ step: step + 1 }) });
            setStep(step + 1);
            setMaxStep(Math.max(maxStep, step + 1));
        }
        catch (e) {
            toast.error((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    async function saveNote(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setNoteBusy(true);
        try {
            await api("/notes", { method: "POST", body: JSON.stringify({ title: f.get("title"), content: f.get("content"), tags: ["lesson"], resourceId: id }) });
            toast.success("Đã lưu ghi chú của bạn");
            setNote(false);
        }
        catch (e) {
            toast.error((e as Error).message);
        }
        finally {
            setNoteBusy(false);
        }
    }
    if (loading)
        return <LoadingSkeleton />;
    if (error || !data)
        return <ErrorState message={error || "Không có bài học"} retry={refresh}/>;
    const steps = [{ label: "Ghép từ", icon: Sparkles }, { label: "Xếp câu", icon: GripVertical }, { label: "Nghe", icon: Headphones }, { label: "Nói", icon: Mic }, { label: "Đọc & viết", icon: BookOpen }, { label: "Thử thách", icon: PenLine }];
    const nextLesson = data.lesson.course.lessons.find(l => l.order > data.lesson.order);
    const sentence = data.grammar?.examples[0] || data.words[0]?.example || "I practise English every day.";
    const skippable = step === 2 || step === 4;
    return <><div className="lesson-heading"><div><Link className="back-link" href={`/courses/${data.lesson.courseId}`}><ArrowLeft size={14}/>{data.lesson.course.title}</Link><Badge className="green">BÀI {data.lesson.order} · 6 HOẠT ĐỘNG</Badge><h1>{data.lesson.title}</h1><p>{data.lesson.description}</p></div><div className="flex-row"><FavoriteButton type="lesson" id={id} title={data.lesson.title} href={`/lessons/${id}`}/><Button variant="outline" size="sm" onClick={() => setNote(true)}><NotebookPen size={16}/>Ghi chú</Button></div></div><nav className="lesson-stepper" aria-label="Các phần bài học">{steps.map(({ label, icon: Icon }, i) => <button className={`${i === step ? "active" : ""} ${i < maxStep ? "done" : ""}`} disabled={i > maxStep} onClick={() => setStep(i)} key={label}><span>{i < maxStep ? <Check size={14}/> : i + 1}</span><Icon size={16}/>{label}</button>)}</nav><Progress value={(finished ? 6 : step) / 6 * 100}/><div className="lesson-content interactive-lesson">{step === 0 && <div className="content-narrow"><WordMatch words={data.words}/>{data.grammar && <Card className="grammar-bridge"><div><Badge><FileText size={12}/> CẤU TRÚC TRONG BÀI</Badge><h2>{data.grammar.title}</h2><p>{data.grammar.description}</p></div><div className="grammar-bridge-formula">{data.grammar.structure.slice(0, 2).map(item => <code key={item}>{item}</code>)}</div></Card>}</div>}{step === 1 && <div className="content-narrow"><SentenceBuilder sentence={sentence}/></div>}{step === 2 && <div className="content-narrow">{data.listening ? <Card className="section-card lesson-skill-card"><div className="skill-tip"><Headphones size={18}/><span>Nghe lần đầu không xem lời thoại. Lần hai mở transcript và đọc theo.</span></div><MediaAudioPlayer audioUrl={data.listening.audioUrl} text={data.listening.transcript} translation={data.listening.translation} title={data.listening.title}/></Card> : <Card className="activity-card activity-empty"><Headphones size={35}/><h2>Bài này chưa có đoạn nghe riêng</h2><p>Bạn có thể để phần này lại và chuyển sang luyện nói.</p></Card>}</div>}{step === 3 && <div className="content-narrow"><SpeakingRecorder text={sentence}/></div>}{step === 4 && <div className="content-narrow">{data.reading && <><h2 className="mb-4">{data.reading.title}</h2><ReadingContent article={data.reading}/></>}<MiniWriting lessonId={id} prompt={`Viết 2–3 câu liên quan đến “${data.lesson.title}”.`} suggestedWords={data.words.slice(0, 4).map(word => word.word)}/></div>}{step === 5 && <div className="content-narrow"><QuizPlayer quiz={data.quiz} onComplete={async (result) => {
                setFinished(result.passed);
                if (session.current) {
                    await api("/study/finish", { method: "POST", body: JSON.stringify({ sessionId: session.current }) }).catch(() => {
                    });
                    session.current = null;
                }
            }}/></div>}</div><div className="lesson-bottom"><Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={15}/> Phần trước</Button><span>{finished ? "Đã hoàn thành bài học" : `Hoạt động ${step + 1} trên 6`}</span>{step < 5 ? <div className="lesson-next-actions">{skippable && <Button variant="ghost" onClick={next} disabled={busy}>Để sau</Button>}<Button onClick={next} disabled={busy}>{busy ? <Loader2 className="spin" size={16}/> : skippable ? "Đã luyện xong" : "Tiếp tục"}<ArrowRight size={16}/></Button></div> : finished && nextLesson ? <Button asChild><Link href={`/lessons/${nextLesson.id}`}>Bài học tiếp theo <ArrowRight size={16}/></Link></Button> : <Button variant="secondary" asChild><Link href="/dashboard">Về dashboard</Link></Button>}</div><Dialog open={note} onOpenChange={setNote}><DialogContent><DialogTitle>Lưu một điều đáng nhớ</DialogTitle><DialogDescription>Ghi chú này sẽ được lưu trong Góc của bạn.</DialogDescription><form onSubmit={saveNote}><div className="field"><label htmlFor="note-title">Tiêu đề</label><input id="note-title" className="input" name="title" defaultValue={data.lesson.title} required maxLength={120}/></div><div className="field"><label htmlFor="note-content">Nội dung</label><textarea id="note-content" name="content" required maxLength={12000} placeholder="Một cấu trúc mới, một ví dụ hay…"/></div><Button type="submit" disabled={noteBusy}>{noteBusy ? "Đang lưu…" : "Lưu ghi chú"}</Button></form></DialogContent></Dialog></>;
}
