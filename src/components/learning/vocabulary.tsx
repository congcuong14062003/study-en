"use client";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import type { Vocabulary, UserVocabulary } from "@prisma/client";
import { ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Layers, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/hooks/use-data";
import { api } from "@/lib/utils";
import { PageHeading } from "@/components/dashboard/dashboard";
import { EmptyState, LoadingSkeleton, ErrorState } from "@/components/ui/states";
import { AudioButton, speak } from "./audio-player";
import { FavoriteButton } from "./favorite-button";
export type Word = Vocabulary & {
    review?: UserVocabulary | null;
};
export function VocabularyCard({ word, onReview }: {
    word: Word;
    onReview?: () => void;
}) {
    const [busy, setBusy] = useState(false);
    async function review(rating: string) {
        setBusy(true);
        try {
            await api("/vocabulary/review", { method: "POST", body: JSON.stringify({ vocabularyId: word.id, rating }) });
            toast.success("Đã lưu lịch ôn tập · +5 XP");
            onReview?.();
        }
        catch (e) {
            toast.error((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    return <Card className="vocabulary-card"><div className="flex-row justify-between"><Badge className="neutral">{word.level} · {word.category}</Badge><FavoriteButton type="word" id={word.id} title={word.word} href={`/dictionary?q=${encodeURIComponent(word.word)}`}/></div><div className="word-title"><h2>{word.word}</h2><AudioButton text={word.word}/></div><div className="word-ipa">{word.ipa} <span>{word.partOfSpeech}</span></div><h3>{word.meaning}</h3><div className="word-example"><p>“{word.example}”</p><span>{word.translation}</span></div><div className="word-actions"><Button variant="outline" size="sm" disabled={busy || Boolean(word.review && new Date(word.review.dueAt) > new Date())} onClick={() => review("easy")}><Check size={14}/> Đã biết</Button><Button variant="secondary" size="sm" disabled={busy || Boolean(word.review && new Date(word.review.dueAt) > new Date())} onClick={() => review("again")}><RotateCcw size={13}/> Cần ôn tập</Button></div>{word.review && <span className="field-help">Lần ôn tiếp theo: {new Date(word.review.dueAt).toLocaleDateString("vi-VN")}</span>}</Card>;
}
export function VocabularyPage() {
    const { data, loading, error, refresh } = useData<Word[]>("/vocabulary");
    const [q, setQ] = useState(""), [category, setCategory] = useState("all"), [level, setLevel] = useState("all");
    if (loading)
        return <LoadingSkeleton />;
    if (error || !data)
        return <ErrorState message={error || "Không thể tải từ vựng"} retry={refresh}/>;
    const words = data.filter(w => (category === "all" || w.category === category) && (level === "all" || w.level === level) && `${w.word} ${w.meaning}`.toLowerCase().includes(q.toLowerCase()));
    return <><PageHeading title="Từng từ mới, thêm một kết nối." description="Học từ trong ngữ cảnh. Ôn đúng lúc. Nhớ lâu hơn."><Button asChild><Link href="/flashcards"><Layers size={16}/> Ôn flashcard</Link></Button></PageHeading><div className="vocabulary-banner"><span className="icon-box"><BookOpen size={28}/></span><div><h3>Xây dựng vốn từ của riêng bạn</h3><p>{data.length} từ trong thư viện · {data.filter(w => w.review).length} từ đã bắt đầu học</p></div><Button asChild variant="outline" size="sm"><Link href="/quiz?type=vocabulary">Thử sức với quiz <ArrowRight size={14}/></Link></Button></div><div className="toolbar"><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt…" aria-label="Tìm từ vựng"/><select value={category} onChange={e => setCategory(e.target.value)} aria-label="Chủ đề từ vựng"><option value="all">Mọi chủ đề</option>{[...new Set(data.map(w => w.category))].map(c => <option key={c}>{c}</option>)}</select><select value={level} onChange={e => setLevel(e.target.value)} aria-label="Trình độ từ vựng"><option value="all">Mọi trình độ</option>{["A1", "A2", "B1", "B2", "C1", "C2"].map(c => <option key={c}>{c}</option>)}</select></div>{words.length ? <div className="grid-3">{words.map(word => <VocabularyCard key={word.id} word={word} onReview={refresh}/>)}</div> : <EmptyState title="Chưa tìm thấy từ phù hợp" description="Thử một từ khóa hoặc chủ đề khác nhé." href="/vocabulary" action="Xem thư viện"/>}</>;
}
type ReviewCard = UserVocabulary & {
    vocabulary: Vocabulary;
};
export function Flashcards() {
    const { data, loading, error, refresh } = useData<ReviewCard[]>("/vocabulary/reviews");
    const [index, setIndex] = useState(0), [flipped, setFlipped] = useState(false), [busy, setBusy] = useState(false);
    const word = data?.[index]?.vocabulary;
    const rate = useCallback(async (rating: string) => {
        if (!word || !flipped || busy)
            return;
        setBusy(true);
        try {
            await api("/vocabulary/review", { method: "POST", body: JSON.stringify({ vocabularyId: word.id, rating }) });
            setIndex(i => i + 1);
            setFlipped(false);
            toast.success("+5 XP · Đã cập nhật lịch ôn");
        }
        catch (e) {
            toast.error((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }, [word, flipped, busy]);
    useEffect(() => {
        function key(e: KeyboardEvent) {
            if ((e.target as HTMLElement).matches("input,textarea,select"))
                return;
            if (e.code === "Space") {
                e.preventDefault();
                setFlipped(v => !v);
            }
            const r = { "1": "again", "2": "hard", "3": "good", "4": "easy" }[e.key];
            if (r)
                void rate(r);
        }
        window.addEventListener("keydown", key);
        return () => window.removeEventListener("keydown", key);
    }, [rate]);
    if (loading)
        return <LoadingSkeleton />;
    if (error)
        return <ErrorState message={error} retry={refresh}/>;
    if (!data?.length)
        return <EmptyState title="Không có từ nào đến hạn ôn" description="Bạn đã bắt kịp lịch ôn. Hãy học thêm vài từ mới hoặc quay lại khi đến lịch." href="/vocabulary" action="Học từ mới"/>;
    if (!word)
        return <Card className="quiz-complete"><span className="icon-box green"><Check size={32}/></span><Badge className="green">HOÀN THÀNH PHIÊN ÔN</Badge><h1>Bạn vừa tiến bộ thêm một chút!</h1><p>Đã ôn {data.length} từ · +{data.length * 5} XP. Lịch ôn tiếp theo đã được lưu.</p><Button asChild><Link href="/dashboard">Về không gian học tập <ArrowRight size={16}/></Link></Button></Card>;
    return <div className="content-narrow"><PageHeading title="Ôn một chút, nhớ lâu hơn" description="Phím Space để lật thẻ · Phím 1–4 để đánh giá mức độ nhớ."><Badge>{index + 1} / {data.length} từ</Badge></PageHeading><Progress value={index / data.length * 100}/><button className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)} aria-label={flipped ? "Lật về mặt từ tiếng Anh" : "Lật thẻ xem nghĩa"}><span className="flashcard-inner"><span className="flashcard-face front"><span className="eyebrow">{word.partOfSpeech} · {word.level}</span><strong>{word.word}</strong><span className="muted">{word.ipa}</span><small>Chạm để khám phá nghĩa <RotateCcw size={13}/></small></span><span className="flashcard-face back"><span className="eyebrow">{word.word}</span><strong>{word.meaning}</strong><span>{word.example}</span><small>{word.translation}</small></span></span></button><div className="centered-text"><AudioButton text={`${word.word}. ${word.example}`} label="Nghe phát âm"/></div><div className="flashcard-ratings">{[["again", "Học lại", "1 · 10 phút"], ["hard", "Hơi khó", "2 · Ôn sớm"], ["good", "Đã nhớ", "3 · Giãn cách"], ["easy", "Rất dễ", "4 · Ôn muộn hơn"]].map(([value, label, help]) => <button className={`rating ${value}`} key={value} disabled={!flipped || busy} onClick={() => rate(value)}><strong>{label}</strong><span>{help}</span></button>)}</div><p className="centered-text field-help">Hãy xem mặt sau trước khi đánh giá mức độ nhớ của bạn.</p></div>;
}
