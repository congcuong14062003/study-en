"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, FileText, Headphones, Loader2, Mic, NotebookPen, PenLine } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { api } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, Badge } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSkeleton, ErrorState } from "@/components/ui/states";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VocabularyCard } from "./vocabulary";
import { GrammarContent, ReadingContent } from "./content-library";
import { MediaAudioPlayer } from "./audio-player";
import { SpeakingRecorder } from "./speaking";
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
    const steps = [{ label: "Từ vựng", icon: BookOpen }, { label: "Ngữ pháp", icon: FileText }, { label: "Nghe", icon: Headphones }, { label: "Nói", icon: Mic }, { label: "Đọc", icon: BookOpen }, { label: "Kiểm tra", icon: PenLine }];
    const nextLesson = data.lesson.course.lessons.find(l => l.order > data.lesson.order);
    return <><div className="lesson-heading"><div><Link className="back-link" href={`/courses/${data.lesson.courseId}`}><ArrowLeft size={14}/>{data.lesson.course.title}</Link><h1>{data.lesson.title}</h1><p>{data.lesson.description}</p></div><div className="flex-row"><FavoriteButton type="lesson" id={id} title={data.lesson.title} href={`/lessons/${id}`}/><Button variant="outline" size="sm" onClick={() => setNote(true)}><NotebookPen size={16}/>Ghi chú</Button></div></div><nav className="lesson-stepper" aria-label="Các phần bài học">{steps.map(({ label, icon: Icon }, i) => <button className={`${i === step ? "active" : ""} ${i < maxStep ? "done" : ""}`} disabled={i > maxStep} onClick={() => setStep(i)} key={label}><span>{i < maxStep ? <Check size={14}/> : i + 1}</span><Icon size={16}/>{label}</button>)}</nav><Progress value={(finished ? 6 : step) / 6 * 100}/><div className="lesson-content">{step === 0 && <><div className="section-heading"><div><h2>Những từ mở đầu câu chuyện</h2><p>Nghe phát âm, đọc ví dụ và thử đặt câu của riêng bạn.</p></div></div><div className="grid-3">{data.words.map(w => <VocabularyCard key={w.id} word={w}/>)}</div></>}{step === 1 && data.grammar && <div className="content-narrow"><h2 className="mb-4">{data.grammar.title}</h2><GrammarContent lesson={data.grammar}/></div>}{step === 2 && data.listening && <Card className="section-card content-narrow"><MediaAudioPlayer audioUrl={data.listening.audioUrl} text={data.listening.transcript} translation={data.listening.translation} title={data.listening.title}/></Card>}{step === 3 && <div className="content-narrow"><SpeakingRecorder text={data.words[0]?.example || "I usually wake up at seven o'clock."}/></div>}{step === 4 && data.reading && <div className="content-narrow"><h2 className="mb-4">{data.reading.title}</h2><ReadingContent article={data.reading}/></div>}{step === 5 && <div className="content-narrow"><QuizPlayer quiz={data.quiz} onComplete={async (result) => {
                setFinished(result.passed);
                if (session.current) {
                    await api("/study/finish", { method: "POST", body: JSON.stringify({ sessionId: session.current }) }).catch(() => {
                    });
                    session.current = null;
                }
            }}/></div>}</div><div className="lesson-bottom"><Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={15}/> Phần trước</Button><span>{finished ? "Đã hoàn thành bài học" : `Phần ${step + 1} trên 6`}</span>{step < 5 ? <Button onClick={next} disabled={busy}>{busy ? <Loader2 className="spin" size={16}/> : "Đã hiểu, tiếp tục"}<ArrowRight size={16}/></Button> : finished && nextLesson ? <Button asChild><Link href={`/lessons/${nextLesson.id}`}>Bài học tiếp theo <ArrowRight size={16}/></Link></Button> : <Button variant="secondary" asChild><Link href="/dashboard">Về dashboard</Link></Button>}</div><Dialog open={note} onOpenChange={setNote}><DialogContent><DialogTitle>Lưu một điều đáng nhớ</DialogTitle><DialogDescription>Ghi chú này sẽ được lưu trong Góc của bạn.</DialogDescription><form onSubmit={saveNote}><div className="field"><label htmlFor="note-title">Tiêu đề</label><input id="note-title" className="input" name="title" defaultValue={data.lesson.title} required maxLength={120}/></div><div className="field"><label htmlFor="note-content">Nội dung</label><textarea id="note-content" name="content" required maxLength={12000} placeholder="Một cấu trúc mới, một ví dụ hay…"/></div><Button type="submit" disabled={noteBusy}>{noteBusy ? "Đang lưu…" : "Lưu ghi chú"}</Button></form></DialogContent></Dialog></>;
}
