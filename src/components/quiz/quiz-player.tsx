"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, RotateCcw, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Badge } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/hooks/use-data";
import { api } from "@/lib/utils";
import { LoadingSkeleton, ErrorState } from "@/components/ui/states";
import { PageHeading } from "@/components/dashboard/dashboard";
import { AudioPlayer } from "@/components/learning/audio-player";
import type { PublicQuiz } from "@/services/content";
export type QuizResult = {
    score: number;
    total: number;
    percent: number;
    xp: number;
    level: string;
    passed: boolean;
    skillScores: Record<string, number>;
    results: {
        questionId: string;
        prompt: string;
        correct: boolean;
        correctAnswer: number;
        selected: number;
        explanation: string;
        options: string[];
    }[];
};
export function QuizPage({ quizId = "practice-vocabulary" }: {
    quizId?: string;
}) {
    const { data, loading, error, refresh } = useData<PublicQuiz>(`/quiz/${quizId}`);
    if (loading)
        return <LoadingSkeleton />;
    if (error || !data)
        return <ErrorState message={error || "Không tìm thấy bài kiểm tra"} retry={refresh}/>;
    return <div className="content-narrow"><PageHeading title={quizId === "placement" ? "Tìm điểm xuất phát của bạn" : data.title} description={quizId === "placement" ? "30 câu hỏi · Từ vựng, ngữ pháp, đọc và nghe · Khoảng 15–20 phút" : "Đọc kỹ câu hỏi, chọn đáp án và kiểm tra những gì bạn đã học."}/><QuizPlayer quiz={data}/></div>;
}
export function QuizPlayer({ quiz, onComplete }: {
    quiz: PublicQuiz;
    onComplete?: (result: QuizResult) => void;
}) {
    const [index, setIndex] = useState(0), [answers, setAnswers] = useState<Record<string, number>>({}), [busy, setBusy] = useState(false), [error, setError] = useState(""), [result, setResult] = useState<QuizResult | null>(null);
    const q = quiz.questions[index];
    async function submit() {
        setBusy(true);
        setError("");
        try {
            const r = await api<QuizResult>("/quiz/submit", { method: "POST", body: JSON.stringify({ quizId: quiz.id, answers: quiz.questions.map(q => ({ questionId: q.id, selected: answers[q.id] })) }) });
            setResult(r);
            onComplete?.(r);
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    if (result)
        return <div><Card className="quiz-complete"><motion.div initial={{ scale: .4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 160 }} className="celebration"><Trophy size={45}/>{Array.from({ length: 12 }, (_, i) => <motion.i key={i} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(i) * 120, y: Math.sin(i) * 80, opacity: 0 }} transition={{ duration: 1.6 }}/>)}</motion.div><Badge className="green">{quiz.kind === "placement" ? "ĐÃ XÁC ĐỊNH ĐIỂM XUẤT PHÁT" : result.passed ? "EXCELLENT WORK!" : "MỖI LẦN THỬ LÀ MỘT LẦN HỌC"}</Badge><h1>{quiz.kind === "placement" ? `Trình độ ước tính: ${result.level}` : result.passed ? "Bạn đã làm rất tốt!" : "Cùng củng cố thêm nhé."}</h1><p>{result.score} / {result.total} câu đúng · Độ chính xác {result.percent}% · +{result.xp} XP</p>{quiz.kind === "placement" && <><div className="result-skills">{Object.entries(result.skillScores).map(([s, v]) => <div key={s}><strong>{v}%</strong><span>{s}</span></div>)}</div><p className="field-help">Kết quả tham khảo để đề xuất lộ trình, không thay thế chứng chỉ CEFR chính thức.</p></>}<div className="flex-row"><Button asChild><Link href={quiz.kind === "placement" ? "/dashboard" : "/dashboard"}>Về dashboard <ArrowRight size={16}/></Link></Button>{quiz.kind !== "placement" && <Button variant="outline" onClick={() => {
            setResult(null);
            setAnswers({});
            setIndex(0);
        }}><RotateCcw size={16}/> Làm lại</Button>}</div></Card><Card className="section-card"><h2>Hiểu đáp án, nhớ lâu hơn</h2>{result.results.map((r, i) => <div key={r.questionId} className={`answer-review ${r.correct ? "correct" : "wrong"}`}><div className="flex-row">{r.correct ? <CheckCircle2 size={18}/> : <X size={18}/>}<strong>{i + 1}. {r.prompt}</strong></div><p>Đáp án đúng: {r.options[r.correctAnswer]}</p>{!r.correct && <p>Bạn chọn: {r.options[r.selected]}</p>}<span>{r.explanation}</span></div>)}</Card></div>;
    if (!q)
        return <ErrorState message="Bài kiểm tra chưa có câu hỏi."/>;
    return <><div className="quiz-top"><span>Câu {index + 1} / {quiz.questions.length}</span><span>{Object.keys(answers).length} câu đã trả lời</span></div><Progress value={Object.keys(answers).length / quiz.questions.length * 100}/><Card className="quiz-question"><Badge>{q.skill.toUpperCase()} · {q.level}</Badge>{q.passage && <div className="quiz-passage">{q.passage}</div>}{q.audioText && <AudioPlayer text={q.audioText} title="Nghe để trả lời"/>}<h2>{q.prompt}</h2><div className="quiz-options">{q.options.map((option, i) => <button key={i} className={`quiz-option ${answers[q.id] === i ? "selected" : ""}`} onClick={() => setAnswers({ ...answers, [q.id]: i })} aria-pressed={answers[q.id] === i}><span>{String.fromCharCode(65 + i)}</span>{option}{answers[q.id] === i && <Check size={18}/>}</button>)}</div>{error && <p className="error-message" role="alert">{error}</p>}<div className="quiz-footer"><Button variant="ghost" disabled={index === 0 || busy} onClick={() => setIndex(index - 1)}><ArrowLeft size={16}/> Câu trước</Button>{index < quiz.questions.length - 1 ? <Button disabled={answers[q.id] === undefined} onClick={() => setIndex(index + 1)}>Tiếp theo <ArrowRight size={16}/></Button> : <Button disabled={Object.keys(answers).length !== quiz.questions.length || busy} onClick={submit}>{busy ? <Loader2 size={17} className="spin"/> : "Nộp bài"}<Check size={17}/></Button>}</div></Card><div className="question-dots">{quiz.questions.map((q, i) => <button key={q.id} className={`${index === i ? "current" : ""} ${answers[q.id] !== undefined ? "answered" : ""}`} onClick={() => setIndex(i)} aria-label={`Chuyển đến câu ${i + 1}`}>{i + 1}</button>)}</div></>;
}
