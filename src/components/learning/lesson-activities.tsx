"use client";

import { useEffect, useMemo, useState } from "react";
import type { Vocabulary } from "@prisma/client";
import {
  Check,
  CheckCircle2,
  GripVertical,
  Loader2,
  MousePointer2,
  PenLine,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/utils";

function deterministicShuffle<T extends { id: string }>(items: T[]) {
  if (items.length < 2) return items;
  const sorted = [...items].sort((a, b) => b.id.localeCompare(a.id));
  return sorted.every((item, index) => item.id === items[index]?.id)
    ? [...sorted.slice(1), sorted[0]]
    : sorted;
}

export function WordMatch({ words }: { words: Vocabulary[] }) {
  const choices = words.slice(0, 4);
  const meanings = useMemo(
    () =>
      deterministicShuffle(
        choices.map((word) => ({ id: word.id, label: word.meaning })),
      ),
    [words],
  );
  const [wordId, setWordId] = useState("");
  const [meaningId, setMeaningId] = useState("");
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (!wordId || !meaningId) return;
    if (wordId === meaningId) {
      setMatched((current) => [...current, wordId]);
      setWordId("");
      setMeaningId("");
      setWrong(false);
      return;
    }
    setWrong(true);
    const timeout = window.setTimeout(() => {
      setWordId("");
      setMeaningId("");
      setWrong(false);
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [wordId, meaningId]);

  return (
    <Card className="activity-card match-activity">
      <div className="activity-heading">
        <span className="icon-box purple">
          <MousePointer2 size={21} />
        </span>
        <div>
          <Badge>1 · GHÉP CẶP</Badge>
          <h2>Chạm từ và nghĩa tương ứng</h2>
          <p>
            Hoàn thành {matched.length}/{choices.length} cặp từ để làm nóng trí
            nhớ.
          </p>
        </div>
      </div>
      <div className={`match-board ${wrong ? "wrong" : ""}`}>
        <div>
          {choices.map((word) => (
            <button
              key={word.id}
              disabled={matched.includes(word.id)}
              className={`${wordId === word.id ? "selected" : ""} ${matched.includes(word.id) ? "matched" : ""}`}
              onClick={() => setWordId(word.id)}
            >
              {matched.includes(word.id) && <Check size={15} />}
              <strong>{word.word}</strong>
              <small>{word.partOfSpeech}</small>
            </button>
          ))}
        </div>
        <div>
          {meanings.map((meaning) => (
            <button
              key={meaning.id}
              disabled={matched.includes(meaning.id)}
              className={`${meaningId === meaning.id ? "selected" : ""} ${matched.includes(meaning.id) ? "matched" : ""}`}
              onClick={() => setMeaningId(meaning.id)}
            >
              {matched.includes(meaning.id) && <Check size={15} />}
              <span>{meaning.label}</span>
            </button>
          ))}
        </div>
      </div>
      {matched.length === choices.length && (
        <div className="activity-success">
          <CheckCircle2 size={18} /> Tuyệt vời! Bạn đã ghép đúng tất cả các từ.
        </div>
      )}
    </Card>
  );
}

type Token = { id: string; value: string };

function tokenize(sentence: string): Token[] {
  return (sentence.match(/[A-Za-zÀ-ỹ0-9']+|[.,!?;:]/g) || []).map(
    (value, index) => ({ id: `token-${index}-${value}`, value }),
  );
}

function normalize(tokens: Token[]) {
  return tokens
    .map((token) => token.value)
    .join(" ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim()
    .toLowerCase();
}

export function SentenceBuilder({ sentence }: { sentence: string }) {
  const target = useMemo(() => tokenize(sentence), [sentence]);
  const initialBank = useMemo(() => deterministicShuffle(target), [target]);
  const [bank, setBank] = useState<Token[]>(initialBank);
  const [answer, setAnswer] = useState<Token[]>([]);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    setBank(initialBank);
    setAnswer([]);
    setResult(null);
  }, [initialBank]);

  function add(token: Token) {
    setBank((current) => current.filter((item) => item.id !== token.id));
    setAnswer((current) => [...current, token]);
    setResult(null);
  }

  function remove(token: Token) {
    setAnswer((current) => current.filter((item) => item.id !== token.id));
    setBank((current) => [...current, token]);
    setResult(null);
  }

  function drop(
    event: React.DragEvent<HTMLDivElement>,
    destination: "answer" | "bank",
  ) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const fromBank = bank.find((token) => token.id === id);
    const fromAnswer = answer.find((token) => token.id === id);
    if (destination === "answer" && fromBank) add(fromBank);
    if (destination === "bank" && fromAnswer) remove(fromAnswer);
  }

  function reset() {
    setBank(initialBank);
    setAnswer([]);
    setResult(null);
  }

  return (
    <Card className="activity-card sentence-activity">
      <div className="activity-heading">
        <span className="icon-box orange">
          <GripVertical size={21} />
        </span>
        <div>
          <Badge className="orange">2 · XẾP CÂU</Badge>
          <h2>Kéo thả hoặc bấm từ theo đúng thứ tự</h2>
          <p>Ghép một câu hoàn chỉnh từ các mảnh bên dưới.</p>
        </div>
      </div>
      <div
        className={`sentence-dropzone ${result || ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => drop(event, "answer")}
      >
        {answer.length ? (
          answer.map((token) => (
            <button
              draggable
              onDragStart={(event) =>
                event.dataTransfer.setData("text/plain", token.id)
              }
              onClick={() => remove(token)}
              key={token.id}
            >
              {token.value}
              <X size={12} />
            </button>
          ))
        ) : (
          <span>Thả từ vào đây hoặc bấm các từ bên dưới</span>
        )}
      </div>
      <div
        className="sentence-bank"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => drop(event, "bank")}
      >
        {bank.map((token) => (
          <button
            draggable
            onDragStart={(event) =>
              event.dataTransfer.setData("text/plain", token.id)
            }
            onClick={() => add(token)}
            key={token.id}
          >
            <GripVertical size={13} />
            {token.value}
          </button>
        ))}
      </div>
      <div className="activity-actions">
        <Button variant="outline" onClick={reset}>
          <RotateCcw size={15} /> Làm lại
        </Button>
        <Button
          disabled={bank.length > 0 || !answer.length}
          onClick={() =>
            setResult(
              normalize(answer) === normalize(target) ? "correct" : "wrong",
            )
          }
        >
          Kiểm tra câu <Check size={15} />
        </Button>
      </div>
      {result === "correct" && (
        <div className="activity-success">
          <CheckCircle2 size={18} /> Chính xác! “{sentence}”
        </div>
      )}
      {result === "wrong" && (
        <div className="activity-feedback error">
          <X size={18} /> Chưa đúng thứ tự. Bấm từng từ để đưa về kho và thử lại
          nhé.
        </div>
      )}
    </Card>
  );
}

export function MiniWriting({
  lessonId,
  prompt,
  suggestedWords,
}: {
  lessonId: string;
  prompt: string;
  suggestedWords: string[];
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  async function save() {
    setBusy(true);
    try {
      await api("/notes", {
        method: "POST",
        body: JSON.stringify({
          title: "Bài viết ngắn trong bài học",
          content: `${prompt}\n\n${text}`,
          tags: ["lesson", "writing"],
          resourceId: lessonId,
        }),
      });
      toast.success("Đã lưu bài viết vào Ghi chú");
    } catch (caught) {
      toast.error((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="activity-card mini-writing">
      <div className="activity-heading">
        <span className="icon-box green">
          <PenLine size={21} />
        </span>
        <div>
          <Badge className="green">VIẾT NGẮN</Badge>
          <h2>{prompt}</h2>
          <p>
            Dùng ít nhất một từ gợi ý. Không cần hoàn hảo, chỉ cần diễn đạt được
            ý.
          </p>
        </div>
      </div>
      <div className="writing-word-bank">
        {suggestedWords.map((word) => (
          <button
            onClick={() =>
              setText(
                (current) =>
                  `${current}${current && !current.endsWith(" ") ? " " : ""}${word} `,
              )
            }
            key={word}
          >
            + {word}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write your answer in English…"
        maxLength={1200}
      />
      <div className="activity-actions">
        <span>{wordCount} từ · mục tiêu 20+</span>
        <Button disabled={busy || wordCount < 3} onClick={save}>
          {busy ? (
            <Loader2 size={15} className="spin" />
          ) : (
            <PenLine size={15} />
          )}{" "}
          Lưu bài viết
        </Button>
      </div>
    </Card>
  );
}
