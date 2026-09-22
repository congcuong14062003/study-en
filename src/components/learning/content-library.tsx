"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GrammarLesson, ListeningLesson, ReadingArticle } from "@prisma/client";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, FileText, Headphones, Info, Play, Sparkles, Target } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/dashboard/dashboard";
import { useData } from "@/hooks/use-data";
import { api } from "@/lib/utils";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/ui/states";
import { AudioButton, MediaAudioPlayer } from "./audio-player";
import { FavoriteButton } from "./favorite-button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MotionGrid, MotionItem } from "@/components/ui/motion";
import type { Word } from "./vocabulary";

type Content = GrammarLesson | ListeningLesson | ReadingArticle;
type ContentKind = "grammar" | "listening" | "reading";

const libraryCopy: Record<ContentKind, { title: string; description: string; action: string; prompt: string }> = {
  grammar: { title: "Ngữ pháp rõ ràng. Diễn đạt tự nhiên.", description: "Hiểu quy tắc qua ngữ cảnh, áp dụng ngay qua ví dụ dễ nhớ.", action: "Học chủ điểm", prompt: "Mỗi ngày một cấu trúc, dùng được ngay trong câu của bạn." },
  listening: { title: "Lắng nghe. Hiểu nhiều hơn.", description: "Hội thoại gần gũi từ A1 đến C2, nghe chậm rồi tăng dần độ khó.", action: "Nghe bài hôm nay", prompt: "Nghe một lượt không nhìn lời thoại, sau đó nghe lại và đọc theo." },
  reading: { title: "Mỗi trang đọc, một thế giới mới.", description: "Bài đọc vừa sức, có bản dịch và tra từ ngay trong ngữ cảnh.", action: "Đọc bài hôm nay", prompt: "Đọc lấy ý chính trước, chạm từ mới sau và lưu từ cần ôn." },
};

function topicOf(item: Content) {
  return "topic" in item ? item.topic : "category" in item ? item.category : "Ngữ pháp";
}

function previewOf(item: Content) {
  return "description" in item ? item.description : "body" in item ? item.body : item.transcript;
}

function durationOf(item: Content) {
  return "duration" in item ? `${item.duration} phút nghe` : "minutes" in item ? `${item.minutes} phút đọc` : "Giải thích · Ví dụ · Thực hành";
}

export function GrammarContent({ lesson }: { lesson: GrammarLesson }) {
  return <>
    <Card className="section-card"><h2>Hiểu cách dùng</h2><p className="rich-content">{lesson.description}</p></Card>
    <Card className="section-card"><h2>Cấu trúc dễ nhớ</h2><div className="grammar-structures">{lesson.structure.map((structure, index) => <div key={index}><span>{String(index + 1).padStart(2, "0")}</span><code>{structure}</code></div>)}</div></Card>
    <Card className="section-card"><h2>Đưa vào ngữ cảnh</h2>{lesson.examples.map((example, index) => <div className="grammar-example" key={index}><CheckCircle2 size={17}/><p>{example}</p><AudioButton text={example}/></div>)}</Card>
    <div className="notice"><Info size={19}/><div><strong>Lưu ý để dùng đúng</strong><p>{lesson.notes}</p><p><strong>Lỗi thường gặp:</strong> {lesson.commonMistake}</p></div></div>
  </>;
}

export function ReadingContent({ article }: { article: ReadingArticle }) {
  const { data: words } = useData<Word[]>("/vocabulary");
  const [translated, setTranslated] = useState(false);
  const [selected, setSelected] = useState<Word | null>(null);
  const wordMap = useMemo(() => new Map((words || []).map(word => [word.word.toLowerCase(), word])), [words]);
  const wordCount = article.body.trim().split(/\s+/).length;

  return <>
    <div className="reading-coach">
      <div><span className="icon-box green"><Target size={21}/></span><div><strong>Đọc theo 3 lượt</strong><p>Lấy ý chính · Tra từ trong ngữ cảnh · Nghe và đọc theo</p></div></div>
      <span>{wordCount} từ · {article.minutes} phút</span>
    </div>
    <Card className="section-card reading-surface">
      <div className="flex-row justify-between mb-4 reading-tools">
        <span className="muted text-sm">Chạm từ được gạch chân để tra nghĩa và thêm vào lịch ôn.</span>
        <div className="flex-row"><AudioButton text={article.body} label="Nghe bài đọc"/><Button variant="outline" size="sm" onClick={() => setTranslated(!translated)}>{translated ? "Bản tiếng Anh" : "Xem bản dịch"}</Button></div>
      </div>
      <article className="reading-body">{translated ? article.translation : article.body.split(/(\s+)/).map((token, index) => {
        const word = wordMap.get(token.toLowerCase().replace(/[^a-z]/g, ""));
        return word ? <button className="inline-word" key={index} onClick={() => setSelected(word)}>{token}</button> : <span key={index}>{token}</span>;
      })}</article>
    </Card>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}>
      <DialogContent>
        <DialogTitle>{selected?.word}</DialogTitle>
        <DialogDescription>{selected?.ipa} {selected?.ipa && "·"} {selected?.partOfSpeech}</DialogDescription>
        {selected && <><h3>{selected.meaning}</h3><p className="mt-4">{selected.example}</p><div className="flex-row mt-4"><AudioButton text={selected.word} label="Nghe phát âm"/><FavoriteButton type="word" id={selected.id} title={selected.word} href={`/dictionary?q=${encodeURIComponent(selected.word)}`} label/><Button size="sm" onClick={async () => {
          try {
            await api("/vocabulary/review", { method: "POST", body: JSON.stringify({ vocabularyId: selected.id, rating: "again" }) });
            setSelected(null);
          } catch (caught) {
            const { toast } = await import("sonner");
            toast.error((caught as Error).message);
          }
        }}>Thêm vào lịch ôn</Button></div></>}
      </DialogContent>
    </Dialog>
  </>;
}

export function ContentLibrary({ kind, id }: { kind: ContentKind; id?: string }) {
  const { data, loading, error, refresh } = useData<Content[] | Content>(`/${kind}${id ? `/${id}` : ""}`);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");
  const [topic, setTopic] = useState("all");

  useEffect(() => {
    if (!id || kind === "grammar") return;
    let sessionId = "";
    let cancelled = false;
    api<{ id: string }>("/study/start", { method: "POST", body: JSON.stringify({ kind, resourceId: id }) }).then(session => {
      sessionId = session.id;
      if (cancelled) void api("/study/finish", { method: "POST", body: JSON.stringify({ sessionId }) }).catch(() => undefined);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      if (sessionId) void api("/study/finish", { method: "POST", body: JSON.stringify({ sessionId }), keepalive: true }).catch(() => undefined);
    };
  }, [id, kind]);

  const copy = libraryCopy[kind];
  const Icon = kind === "listening" ? Headphones : kind === "grammar" ? FileText : BookOpen;
  if (loading) return <LoadingSkeleton/>;
  if (error || !data) return <ErrorState message={error || "Nội dung không tồn tại"} retry={refresh}/>;

  if (id && !Array.isArray(data)) {
    const metadata = "minutes" in data ? `${data.minutes} phút đọc · ${data.category}` : "duration" in data ? `${data.duration} phút nghe · ${data.topic}` : "Hướng dẫn · Ví dụ · Lưu ý";
    return <div className="content-narrow">
      <Link href={`/${kind}`} className="back-link"><ArrowLeft size={15}/> Trở lại thư viện</Link>
      <Card className={`content-header content-header-${kind}`}>
        <div className="flex-row justify-between"><Badge>{data.level} · {kind.toUpperCase()}</Badge>{kind !== "listening" && <FavoriteButton type={kind === "grammar" ? "grammar" : "article"} id={id} title={data.title} href={`/${kind}/${id}`} label/>}</div>
        <h1>{data.title}</h1><span className="muted text-sm"><Clock size={14}/> {metadata}</span>
      </Card>
      {kind === "grammar" ? <GrammarContent lesson={data as GrammarLesson}/> : kind === "listening" ? <Card className="section-card"><MediaAudioPlayer audioUrl={(data as ListeningLesson).audioUrl} text={(data as ListeningLesson).transcript} translation={(data as ListeningLesson).translation} title={data.title}/></Card> : <ReadingContent article={data as ReadingArticle}/>} 
      <Card className="practice-next"><div><h3>Đưa kiến thức vào thực hành</h3><p>{kind === "grammar" ? "Kiểm tra khả năng sử dụng các cấu trúc đã học." : kind === "listening" ? "Luyện nghe đoạn mới và trả lời câu hỏi." : "Đọc đoạn mới và kiểm tra khả năng nắm ý."}</p></div><Button asChild><Link href={`/quiz?type=${kind}`}>Luyện tập <ArrowRight size={16}/></Link></Button></Card>
    </div>;
  }

  const list = Array.isArray(data) ? data : [];
  const topics = [...new Set(list.map(topicOf))];
  const normalizedQuery = q.trim().toLowerCase();
  const visible = list.filter(item => (level === "all" || item.level === level) && (!normalizedQuery || `${item.title} ${topicOf(item)} ${previewOf(item)}`.toLowerCase().includes(normalizedQuery)) && (topic === "all" || topicOf(item) === topic));
  const featured = list.find(item => item.level === "A1") || list[0];
  const levelCount = new Set(list.map(item => item.level)).size;

  return <>
    <PageHeading title={copy.title} description={copy.description}><Badge><Icon size={13}/> {list.length} bài học</Badge></PageHeading>
    {featured && <section className={`library-hero library-hero-${kind}`}>
      <div className="library-hero-copy"><Badge className="green"><Sparkles size={12}/> GỢI Ý HÔM NAY · {featured.level}</Badge><h2>{featured.title}</h2><p>{copy.prompt}</p><Button asChild><Link href={`/${kind}/${featured.id}`}><Play size={16} fill="currentColor"/> {copy.action}</Link></Button></div>
      <div className="library-hero-stats"><div><strong>{list.length}</strong><span>bài học</span></div><div><strong>{levelCount}</strong><span>cấp độ</span></div><div><strong>{topics.length}</strong><span>chủ đề</span></div></div>
    </section>}

    {kind !== "grammar" && <div className="topic-scroller" aria-label="Lọc nhanh theo chủ đề"><button className={topic === "all" ? "active" : ""} onClick={() => setTopic("all")}>Tất cả</button>{topics.map(value => <button className={topic === value ? "active" : ""} onClick={() => setTopic(value)} key={value}>{value}</button>)}</div>}

    <div className="toolbar library-toolbar"><input className="input" value={q} onChange={event => setQ(event.target.value)} placeholder="Tìm theo tên hoặc nội dung…" aria-label="Tìm bài học"/><select value={level} onChange={event => setLevel(event.target.value)} aria-label="Trình độ"><option value="all">Tất cả trình độ</option>{["A1", "A2", "B1", "B2", "C1", "C2"].map(value => <option key={value}>{value}</option>)}</select><span className="library-result-count">{visible.length} kết quả phù hợp</span></div>

    {visible.length ? <MotionGrid className="grid-3 library-grid">{visible.map((item, index) => <MotionItem className="motion-card-shell" key={item.id}><Link href={`/${kind}/${item.id}`} className="library-card card"><div className="library-card-accent"/><div className="flex-row justify-between"><span className={`icon-box ${["purple", "blue", "orange", "green"][index % 4]}`}><Icon size={24}/></span><Badge className="neutral">{item.level}</Badge></div><span className="library-card-topic">{topicOf(item)}</span><h2>{item.title}</h2><p>{previewOf(item).replace(/\s+/g, " ").slice(0, 135)}…</p><div className="library-card-footer"><span><Clock size={13}/> {durationOf(item)}</span><span className="library-start">Bắt đầu <ArrowRight size={16}/></span></div></Link></MotionItem>)}</MotionGrid> : <EmptyState title="Chưa có bài phù hợp" description="Thử trình độ hoặc từ khóa khác nhé." href={`/${kind}`} action="Xem lại thư viện"/>}
  </>;
}

