"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { GrammarLesson, ListeningLesson, ReadingArticle } from "@prisma/client";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, FileText, Headphones, Info } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/dashboard/dashboard";
import { useData } from "@/hooks/use-data";
import { api } from "@/lib/utils";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/ui/states";
import { AudioPlayer, AudioButton, MediaAudioPlayer } from "./audio-player";
import { FavoriteButton } from "./favorite-button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Word } from "./vocabulary";
type Content = GrammarLesson | ListeningLesson | ReadingArticle;
export function GrammarContent({ lesson }: {
    lesson: GrammarLesson;
}) {
    return <><Card className="section-card"><h2>Hiểu cách dùng</h2><p className="rich-content">{lesson.description}</p></Card><Card className="section-card"><h2>Cấu trúc dễ nhớ</h2><div className="grammar-structures">{lesson.structure.map((s, i) => <div key={i}><span>{String(i + 1).padStart(2, "0")}</span><code>{s}</code></div>)}</div></Card><Card className="section-card"><h2>Đưa vào ngữ cảnh</h2>{lesson.examples.map((e, i) => <div className="grammar-example" key={i}><CheckCircle2 size={17}/><p>{e}</p><AudioButton text={e}/></div>)}</Card><div className="notice"><Info size={19}/><div><strong>Lưu ý để dùng đúng</strong><p>{lesson.notes}</p><p><strong>Lỗi thường gặp:</strong> {lesson.commonMistake}</p></div></div></>;
}
export function ReadingContent({ article }: {
    article: ReadingArticle;
}) {
    const { data: words } = useData<Word[]>("/vocabulary");
    const [translated, setTranslated] = useState(false), [selected, setSelected] = useState<Word | null>(null);
    const wordMap = new Map((words || []).map(w => [w.word.toLowerCase(), w]));
    return <><Card className="section-card"><div className="flex-row justify-between mb-4"><span className="muted text-sm">Chạm từ được gạch chân để tra nghĩa và lưu lại.</span><Button variant="outline" size="sm" onClick={() => setTranslated(!translated)}>{translated ? "Bản tiếng Anh" : "Bản dịch"}</Button></div><article className="reading-body">{translated ? article.translation : article.body.split(/(\s+)/).map((token, i) => {
            const word = wordMap.get(token.toLowerCase().replace(/[^a-z]/g, ""));
            return word ? <button className="inline-word" key={i} onClick={() => setSelected(word)}>{token}</button> : <span key={i}>{token}</span>;
        })}</article></Card><Dialog open={Boolean(selected)} onOpenChange={v => {
            if (!v)
                setSelected(null);
        }}><DialogContent><DialogTitle>{selected?.word}</DialogTitle><DialogDescription>{selected?.ipa} · {selected?.partOfSpeech}</DialogDescription>{selected && <><h3>{selected.meaning}</h3><p className="mt-4">{selected.example}</p><div className="flex-row mt-4"><AudioButton text={selected.word} label="Nghe phát âm"/><FavoriteButton type="word" id={selected.id} title={selected.word} href={`/dictionary?q=${encodeURIComponent(selected.word)}`} label/><Button size="sm" onClick={async () => {
                try {
                    await api("/vocabulary/review", { method: "POST", body: JSON.stringify({ vocabularyId: selected.id, rating: "again" }) });
                    setSelected(null);
                }
                catch (e) {
                    const { toast } = await import("sonner");
                    toast.error((e as Error).message);
                }
            }}>Thêm vào lịch ôn</Button></div></>}</DialogContent></Dialog></>;
}
export function ContentLibrary({ kind, id }: {
    kind: "grammar" | "listening" | "reading";
    id?: string;
}) {
    const { data, loading, error, refresh } = useData<Content[] | Content>(`/${kind}${id ? `/${id}` : ""}`);
    const [q, setQ] = useState(""), [level, setLevel] = useState("all"), [topic, setTopic] = useState("all");
    useEffect(() => {
        if (!id || kind === "grammar")
            return;
        let sessionId = "", cancelled = false;
        api<{
            id: string;
        }>("/study/start", { method: "POST", body: JSON.stringify({ kind, resourceId: id }) }).then(s => {
            sessionId = s.id;
            if (cancelled)
                void api("/study/finish", { method: "POST", body: JSON.stringify({ sessionId }) }).catch(() => {
                });
        }).catch(() => {
        });
        return () => {
            cancelled = true;
            if (sessionId)
                void api("/study/finish", { method: "POST", body: JSON.stringify({ sessionId }), keepalive: true }).catch(() => {
                });
        };
    }, [id, kind]);
    const titles = { grammar: ["Ngữ pháp rõ ràng. Diễn đạt tự nhiên.", "Hiểu quy tắc qua ngữ cảnh, áp dụng ngay qua bài tập."], listening: ["Lắng nghe. Hiểu nhiều hơn.", "Những câu chuyện gần gũi để làm quen với tiếng Anh mỗi ngày."], reading: ["Mỗi trang đọc, một thế giới mới.", "Mở rộng góc nhìn và vốn từ qua những bài đọc vừa sức."] };
    const Icon = kind === "listening" ? Headphones : kind === "grammar" ? FileText : BookOpen;
    if (loading)
        return <LoadingSkeleton />;
    if (error || !data)
        return <ErrorState message={error || "Nội dung không tồn tại"} retry={refresh}/>;
    if (id && !Array.isArray(data)) {
        return <div className="content-narrow"><Link href={`/${kind}`} className="back-link"><ArrowLeft size={15}/> Trở lại thư viện</Link><Card className="content-header"><div className="flex-row justify-between"><Badge>{data.level} · {kind.toUpperCase()}</Badge>{kind !== "listening" && <FavoriteButton type={kind === "grammar" ? "grammar" : "article"} id={id} title={data.title} href={`/${kind}/${id}`} label/>}</div><h1>{data.title}</h1>{"minutes" in data && <span className="muted text-sm">{data.minutes} phút đọc · {data.category}</span>}</Card>{kind === "grammar" ? <GrammarContent lesson={data as GrammarLesson}/> : kind === "listening" ? <Card className="section-card"><MediaAudioPlayer audioUrl={(data as ListeningLesson).audioUrl} text={(data as ListeningLesson).transcript} translation={(data as ListeningLesson).translation} title={data.title}/></Card> : <ReadingContent article={data as ReadingArticle}/>}<Card className="practice-next"><div><h3>Đưa kiến thức vào thực hành</h3><p>{kind === "grammar" ? "Kiểm tra khả năng sử dụng các cấu trúc đã học." : kind === "listening" ? "Luyện nghe các đoạn mới và trả lời câu hỏi." : "Đọc các đoạn văn ngắn mới và kiểm tra khả năng đọc hiểu."}</p></div><Button asChild><Link href={`/quiz?type=${kind}`}>Luyện tập <ArrowRight size={16}/></Link></Button></Card></div>;
    }
    const list = Array.isArray(data) ? data : [];
    const topics = [...new Set(list.map(c => "topic" in c ? c.topic : "category" in c ? c.category : "Ngữ pháp"))];
    const visible = list.filter(c => (level === "all" || c.level === level) && c.title.toLowerCase().includes(q.toLowerCase()) && (topic === "all" || ("topic" in c ? c.topic : "category" in c ? c.category : "") === topic));
    return <><PageHeading title={titles[kind][0]} description={titles[kind][1]}><Badge><Icon size={13}/> {list.length} bài học</Badge></PageHeading><div className="toolbar"><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm bài học…" aria-label="Tìm bài học"/><select value={level} onChange={e => setLevel(e.target.value)} aria-label="Trình độ"><option value="all">Tất cả trình độ</option>{["A1", "A2", "B1", "B2", "C1", "C2"].map(l => <option key={l}>{l}</option>)}</select>{kind !== "grammar" && <select value={topic} onChange={e => setTopic(e.target.value)} aria-label="Chủ đề"><option value="all">Mọi chủ đề</option>{topics.map(t => <option key={t}>{t}</option>)}</select>}</div>{visible.length ? <div className="grid-3">{visible.map((c, i) => <Link href={`/${kind}/${c.id}`} key={c.id} className="library-card card"><div className="flex-row justify-between"><span className={`icon-box ${["purple", "blue", "orange", "green"][i % 4]}`}><Icon size={24}/></span><Badge className="neutral">{c.level}</Badge></div><h2>{c.title}</h2><p>{"description" in c ? c.description.slice(0, 135) : "body" in c ? c.body.slice(0, 135) : c.transcript.slice(0, 135)}…</p><div><span className="muted text-xs">{"duration" in c ? `${c.duration} phút nghe` : "minutes" in c ? `${c.minutes} phút đọc` : "Giải thích · Ví dụ · Thực hành"}</span><ArrowRight size={16}/></div></Link>)}</div> : <EmptyState title="Chưa có bài phù hợp" description="Thử trình độ hoặc từ khóa khác nhé." href={`/${kind}`} action="Xem lại thư viện"/>}</>;
}
