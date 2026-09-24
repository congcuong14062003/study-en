"use client";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Vocabulary, UserVocabulary } from "@prisma/client";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  RotateCcw,
  Sparkles,
  Trash2,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/hooks/use-data";
import { api } from "@/lib/utils";
import { PageHeading } from "@/components/dashboard/dashboard";
import {
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from "@/components/ui/states";
import { AudioButton, speak } from "./audio-player";
import { FavoriteButton } from "./favorite-button";
import { MotionGrid, MotionItem } from "@/components/ui/motion";
import { Pagination } from "@/components/ui/pagination";
import type { PaginatedResponse } from "@/lib/pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
export type Word = Vocabulary & {
  review?: UserVocabulary | null;
};
type VocabularyPageData = PaginatedResponse<
  Word,
  {
    categories: string[];
    totalWords: number;
    learnedCount: number;
  }
>;
function WordRelations({ word }: { word: Vocabulary }) {
  if (!word.synonyms.length && !word.antonyms.length) return null;
  return (
    <span className="word-relations">
      {word.synonyms.length > 0 && (
        <span className="word-relation">
          <span className="word-relation-label">Đồng nghĩa</span>
          <span className="word-relation-values">{word.synonyms.join(" · ")}</span>
        </span>
      )}
      {word.antonyms.length > 0 && (
        <span className="word-relation">
          <span className="word-relation-label">Trái nghĩa</span>
          <span className="word-relation-values">{word.antonyms.join(" · ")}</span>
        </span>
      )}
    </span>
  );
}
export function VocabularyCard({
  word,
  onReview,
  onRemove,
}: {
  word: Word;
  onReview?: () => void;
  onRemove?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  async function review(rating: string) {
    setBusy(true);
    try {
      await api("/vocabulary/review", {
        method: "POST",
        body: JSON.stringify({ vocabularyId: word.id, rating }),
      });
      toast.success("Đã lưu lịch ôn tập · +5 XP");
      onReview?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function addToFlashcards() {
    setBusy(true);
    try {
      await api("/vocabulary/start", {
        method: "POST",
        body: JSON.stringify({ vocabularyId: word.id }),
      });
      toast.success("Đã thêm vào phiên flashcard hiện tại");
      onReview?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function removeFromLearning() {
    if (
      !window.confirm(
        `Bỏ “${word.word}” khỏi từ đang học? Bạn có thể thêm lại từ thư viện bất cứ lúc nào.`,
      )
    )
      return;
    setBusy(true);
    try {
      await api(`/vocabulary/${word.id}`, { method: "DELETE" });
      toast.success("Đã bỏ khỏi từ đang học");
      onRemove?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="vocabulary-card">
      <div className="flex-row justify-between">
        <Badge className="neutral">
          {word.level} · {word.category}
        </Badge>
        <FavoriteButton
          type="word"
          id={word.id}
          title={word.word}
          href={`/dictionary?q=${encodeURIComponent(word.word)}`}
        />
      </div>
      <div className="word-title">
        <h2>{word.word}</h2>
        <AudioButton text={word.word} />
      </div>
      <div className="word-ipa">
        {word.ipa} <span>{word.partOfSpeech}</span>
      </div>
      <h3>{word.meaning}</h3>
      {word.imageUrl && (
        <Image
          className="vocabulary-illustration"
          src={word.imageUrl}
          alt={`Minh họa cho ${word.word}: ${word.meaning}`}
          width={480}
          height={300}
          sizes="(max-width: 700px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      )}
      <div className="word-example">
        <span className="word-example-label">Câu ví dụ · Bản dịch</span>
        <p>“{word.example}”</p>
        <span>{word.translation}</span>
      </div>
      <WordRelations word={word} />
      <div className="word-actions">
        <Button
          variant="outline"
          size="sm"
          disabled={
            busy ||
            Boolean(word.review && new Date(word.review.dueAt) > new Date())
          }
          onClick={() => review("easy")}
        >
          <Check size={14} /> Đã biết
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={addToFlashcards}
        >
          <RotateCcw size={13} /> Cần ôn tập
        </Button>
        {word.review && onRemove && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={removeFromLearning}
          >
            <Trash2 size={13} /> Bỏ khỏi từ đang học
          </Button>
        )}
      </div>
      {word.review && (
        <span className="field-help">
          Lần ôn tiếp theo:{" "}
          {new Date(word.review.dueAt).toLocaleDateString("vi-VN")}
        </span>
      )}
    </Card>
  );
}
export function VocabularyPage() {
  const searchParams = useSearchParams();
  const learnedOnly = searchParams.get("status") === "learned";
  const [q, setQ] = useState(""),
    [category, setCategory] = useState("all"),
    [level, setLevel] = useState("all");
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(30);
  const [pageQuery, setPageQuery] = useState("");
  const debouncedQuery = useDebouncedValue(q, 300);
  const requestPage = pageQuery === debouncedQuery ? page : 1;
  const path = useMemo(() => {
    const params = new URLSearchParams({
      paginated: "1",
      page: String(requestPage),
      pageSize: String(pageSize),
    });
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (category !== "all") params.set("category", category);
    if (level !== "all") params.set("level", level);
    if (learnedOnly) params.set("status", "learned");
    return `/vocabulary?${params}`;
  }, [category, debouncedQuery, learnedOnly, level, pageSize, requestPage]);
  const { data, loading, error, refresh } = useData<VocabularyPageData>(path);
  if (loading && !data) return <LoadingSkeleton />;
  if (error || !data)
    return (
      <ErrorState message={error || "Không thể tải từ vựng"} retry={refresh} />
    );
  return (
    <>
      <PageHeading
        title={
          learnedOnly
            ? "Những từ bạn đang học"
            : "Từng từ mới, thêm một kết nối."
        }
        description={
          learnedOnly
            ? "Xem lại vốn từ bạn đã bắt đầu học và chọn từ cần ôn tiếp."
            : "Học từ trong ngữ cảnh. Ôn đúng lúc. Nhớ lâu hơn."
        }
      >
        <Button asChild>
          <Link href="/flashcards">
            <Layers size={16} /> Ôn flashcard
          </Link>
        </Button>
      </PageHeading>
      <div className="vocabulary-banner">
        <span className="icon-box">
          <BookOpen size={28} />
        </span>
        <div>
          <h3>
            {learnedOnly
              ? "Thư viện từ của bạn"
              : "Xây dựng vốn từ của riêng bạn"}
          </h3>
          <p>
            {data.facets.totalWords} từ trong thư viện ·{" "}
            {data.facets.learnedCount} từ đã bắt đầu học
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/quiz?type=vocabulary">
            Thử sức với quiz <ArrowRight size={14} />
          </Link>
        </Button>
      </div>
      <div className="tabs-row vocabulary-status-tabs">
        <Link
          className={`tab-button ${!learnedOnly ? "active" : ""}`}
          href="/vocabulary"
        >
          Tất cả từ vựng
        </Link>
        <Link
          className={`tab-button ${learnedOnly ? "active" : ""}`}
          href="/vocabulary?status=learned"
        >
          Từ đã học · {data.facets.learnedCount}
        </Link>
      </div>
      <div className="toolbar">
        <input
          className="input"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
          }}
          placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt…"
          aria-label="Tìm từ vựng"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          aria-label="Chủ đề từ vựng"
        >
          <option value="all">Mọi chủ đề</option>
          {data.facets.categories.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            setPage(1);
          }}
          aria-label="Trình độ từ vựng"
        >
          <option value="all">Mọi trình độ</option>
          {["A1", "A2", "B1", "B2", "C1", "C2"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      {data.items.length ? (
        <>
          <MotionGrid className="grid-3">
            {data.items.map((word) => (
              <MotionItem className="motion-card-shell" key={word.id}>
                <VocabularyCard
                  word={word}
                  onReview={refresh}
                  onRemove={learnedOnly ? refresh : undefined}
                />
              </MotionItem>
            ))}
          </MotionGrid>
          <Pagination
            meta={data.pagination}
            pageSizes={[15, 30, 60]}
            onPageChange={(value) => {
              setPage(value);
              setPageQuery(debouncedQuery);
            }}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
              setPageQuery(debouncedQuery);
            }}
          />
        </>
      ) : (
        <EmptyState
          title="Chưa tìm thấy từ phù hợp"
          description="Thử một từ khóa hoặc chủ đề khác nhé."
          href="/vocabulary"
          action="Xem thư viện"
        />
      )}
    </>
  );
}
type ReviewCard = UserVocabulary & {
  vocabulary: Vocabulary;
};
export function Flashcards() {
  const { data, loading, error, refresh } = useData<ReviewCard[]>(
    "/vocabulary/reviews",
  );
  const [index, setIndex] = useState(0),
    [flipped, setFlipped] = useState(false),
    [busy, setBusy] = useState(false);
  const word = data?.[index]?.vocabulary;
  async function addStarterPack() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await api<{ added: number }>("/vocabulary/starter-pack", {
        method: "POST",
        body: JSON.stringify({}),
      });
      toast.success(`Đã thêm ${result.added} từ vào phiên ôn`);
      setIndex(0);
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const rate = useCallback(
    async (rating: string) => {
      if (!word || !flipped || busy) return;
      setBusy(true);
      try {
        await api("/vocabulary/review", {
          method: "POST",
          body: JSON.stringify({ vocabularyId: word.id, rating }),
        });
        setIndex((i) => i + 1);
        setFlipped(false);
        toast.success("+5 XP · Đã cập nhật lịch ôn");
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [word, flipped, busy],
  );
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.target as HTMLElement).matches("input,textarea,select")) return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((v) => !v);
      }
      const r = { "1": "again", "2": "hard", "3": "good", "4": "easy" }[e.key];
      if (r) void rate(r);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [rate]);
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  if (!data?.length)
    return (
      <Card className="empty-state">
        <span className="icon-box">
          <BookOpen />
        </span>
        <h2>Không có từ nào đến hạn ôn</h2>
        <p>
          Bắt đầu ngay với 30 từ A1–A2, hoặc tự chọn từ trong thư viện để học.
        </p>
        <div className="flex-row justify-center">
          <Button onClick={addStarterPack} disabled={busy}>
            <Sparkles size={16} />
            {busy ? "Đang thêm từ…" : "Bắt đầu với 30 từ"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/vocabulary">Tự chọn từ</Link>
          </Button>
        </div>
      </Card>
    );
  if (!word)
    return (
      <Card className="quiz-complete">
        <span className="icon-box green">
          <Check size={32} />
        </span>
        <Badge className="green">HOÀN THÀNH PHIÊN ÔN</Badge>
        <h1>Bạn vừa tiến bộ thêm một chút!</h1>
        <p>
          Đã ôn {data.length} từ · +{data.length * 5} XP. Lịch ôn tiếp theo đã
          được lưu.
        </p>
        <div className="flex-row justify-center">
          <Button onClick={() => { setIndex(0); void refresh(); }}>
            Kiểm tra từ còn đến hạn <RotateCcw size={16} />
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              Về không gian học tập <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </Card>
    );
  return (
    <div className="content-narrow">
      <PageHeading
        title="Ôn một chút, nhớ lâu hơn"
        description="Phím Space để lật thẻ · Phím 1–4 để đánh giá mức độ nhớ."
      >
        <Badge>
          {index + 1} / {data.length} từ
        </Badge>
      </PageHeading>
      <Progress value={(index / data.length) * 100} />
      <button
        className={`flashcard ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped(!flipped)}
        aria-label={flipped ? "Lật về mặt từ tiếng Anh" : "Lật thẻ xem nghĩa"}
      >
        <span className="flashcard-inner">
          <span className="flashcard-face front">
            <span className="eyebrow">
              {word.partOfSpeech} · {word.level}
            </span>
            <strong>{word.word}</strong>
            <span className="muted">{word.ipa}</span>
            <small>
              Chạm để khám phá nghĩa <RotateCcw size={13} />
            </small>
          </span>
          <span className="flashcard-face back">
            <span className="eyebrow">{word.word}</span>
            {word.imageUrl && (
              <Image
                className="flashcard-illustration"
                src={word.imageUrl}
                alt={`Minh họa cho ${word.word}: ${word.meaning}`}
                width={180}
                height={120}
                sizes="180px"
              />
            )}
            <strong>{word.meaning}</strong>
            <span className="flashcard-example">“{word.example}”</span>
            <span className="flashcard-translation">{word.translation}</span>
            <WordRelations word={word} />
          </span>
        </span>
      </button>
      <div className="centered-text">
        <AudioButton
          text={`${word.word}. ${word.example}`}
          label="Nghe phát âm"
        />
      </div>
      <div className="flashcard-ratings">
        {[
          ["again", "Học lại", "1 · 10 phút"],
          ["hard", "Hơi khó", "2 · Ôn sớm"],
          ["good", "Đã nhớ", "3 · Giãn cách"],
          ["easy", "Rất dễ", "4 · Ôn muộn hơn"],
        ].map(([value, label, help]) => (
          <button
            className={`rating ${value}`}
            key={value}
            disabled={!flipped || busy}
            onClick={() => rate(value)}
          >
            <strong>{label}</strong>
            <span>{help}</span>
          </button>
        ))}
      </div>
      <p className="centered-text field-help">
        Hãy xem mặt sau trước khi đánh giá mức độ nhớ của bạn.
      </p>
    </div>
  );
}
