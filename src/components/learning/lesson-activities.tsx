"use client";

import { useEffect, useMemo, useState } from "react";
import type { Vocabulary } from "@prisma/client";
import {
  Check,
  CheckCircle2,
  GripVertical,
  Headphones,
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
import { insertSentenceToken, type SentenceToken } from "@/lib/sentence-order";
import type { PublicQuiz } from "@/services/content";
import { AudioButton, speak } from "./audio-player";

function deterministicShuffle<T extends { id: string }>(items: T[]) {
  if (items.length < 2) return items;
  const sorted = [...items].sort((a, b) => b.id.localeCompare(a.id));
  return sorted.every((item, index) => item.id === items[index]?.id)
    ? [...sorted.slice(1), sorted[0]]
    : sorted;
}

export function WordMatch({ words, onComplete }: { words: Vocabulary[]; onComplete?: () => void }) {
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
      if (matched.length + 1 === choices.length) onComplete?.();
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
  }, [wordId, meaningId, matched.length, choices.length, onComplete]);

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

function tokenize(sentence: string): SentenceToken[] {
  return (sentence.match(/[A-Za-zÀ-ỹ0-9']+|[.,!?;:]/g) || []).map(
    (value, index) => ({ id: `token-${index}-${value}`, value }),
  );
}

function normalize(tokens: SentenceToken[]) {
  return tokens
    .map((token) => token.value)
    .join(" ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim()
    .toLowerCase();
}

export function SentenceBuilder({ sentence, onComplete }: { sentence: string; onComplete?: () => void }) {
  const target = useMemo(() => tokenize(sentence), [sentence]);
  const initialBank = useMemo(() => deterministicShuffle(target), [target]);
  const [bank, setBank] = useState<SentenceToken[]>(initialBank);
  const [answer, setAnswer] = useState<SentenceToken[]>([]);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    setBank(initialBank);
    setAnswer([]);
    setResult(null);
    setDropIndex(null);
  }, [initialBank]);

  function place(id: string, targetIndex: number) {
    const next = insertSentenceToken(bank, answer, id, targetIndex);
    setBank(next.bank);
    setAnswer(next.answer);
    setResult(null);
  }

  function remove(token: SentenceToken) {
    setAnswer((current) => current.filter((item) => item.id !== token.id));
    setBank((current) => [...current, token]);
    setResult(null);
  }

  function insertionIndex(event: React.DragEvent<HTMLDivElement>) {
    const tokens = event.currentTarget.querySelectorAll<HTMLElement>("[data-answer-index]");
    for (const element of tokens) {
      const index = Number(element.dataset.answerIndex);
      const rect = element.getBoundingClientRect();
      if (event.clientY < rect.top ||
          (event.clientY <= rect.bottom && event.clientX < rect.left + rect.width / 2))
        return index;
    }
    return answer.length;
  }

  function dropOnAnswer(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    place(id, insertionIndex(event));
    setDropIndex(null);
  }

  function dropOnBank(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const token = answer.find((item) => item.id === id);
    if (token) remove(token);
    setDropIndex(null);
  }

  function reset() {
    setBank(initialBank);
    setAnswer([]);
    setResult(null);
    setDropIndex(null);
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
          <p>Kéo từ vào đầu, giữa hoặc cuối câu. Kéo từ đã chọn để đổi chỗ.</p>
        </div>
      </div>
      <div
        className={`sentence-dropzone ${result || ""} ${dropIndex !== null ? "drag-over" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          const index = insertionIndex(event);
          setDropIndex((current) => current === index ? current : index);
        }}
        onDragLeave={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right ||
              event.clientY < rect.top || event.clientY > rect.bottom)
            setDropIndex(null);
        }}
        onDrop={dropOnAnswer}
      >
        {answer.length ? (
          answer.map((token, index) => (
            <button
              type="button"
              data-answer-index={index}
              className={`${dropIndex === index ? "insert-before" : ""} ${dropIndex === answer.length && index === answer.length - 1 ? "insert-after" : ""}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", token.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => setDropIndex(null)}
              onClick={() => remove(token)}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft" && index > 0) {
                  event.preventDefault();
                  place(token.id, index - 1);
                } else if (event.key === "ArrowRight" && index < answer.length - 1) {
                  event.preventDefault();
                  place(token.id, index + 2);
                }
              }}
              aria-label={`${token.value}. Bấm để bỏ khỏi câu; dùng phím mũi tên trái, phải để đổi vị trí`}
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
        onDrop={dropOnBank}
      >
        {bank.map((token) => (
          <button
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", token.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => setDropIndex(null)}
            onClick={() => place(token.id, answer.length)}
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
          onClick={() => {
            const correct = normalize(answer) === normalize(target);
            setResult(correct ? "correct" : "wrong");
            if (correct) onComplete?.();
          }}
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
          <X size={18} /> Chưa đúng thứ tự. Kéo từ để đổi chỗ, hoặc bấm để đưa
          từ về kho rồi thử lại nhé.
        </div>
      )}
    </Card>
  );
}

function wordPattern(word: string) {
  return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
}
export function hasListeningGap(word: Vocabulary) {
  return wordPattern(word.word).test(word.example);
}
export function ListeningCloze({ word, onComplete }: { word: Vocabulary; onComplete?: () => void }) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const masked = word.example.replace(wordPattern(word.word), "_____");
  function check() {
    const correct = answer.trim().toLocaleLowerCase("en-US") === word.word.toLocaleLowerCase("en-US");
    setResult(correct ? "correct" : "wrong");
    if (correct) onComplete?.();
  }
  return (
    <Card className="activity-card listen-cloze">
      <div className="activity-heading">
        <span className="icon-box purple"><Headphones size={21} /></span>
        <div>
          <Badge>3 · NGHE VÀ ĐIỀN TỪ</Badge>
          <h2>Nghe câu rồi nhập từ còn thiếu</h2>
          <p>Nghe lại hoặc giảm tốc độ nếu cần. Đáp án là một từ trong bài này.</p>
        </div>
      </div>
      <div className="listen-cloze-audio">
        <AudioButton text={word.example} label="Nghe câu" />
        <Button variant="outline" size="sm" onClick={() => speak(word.example, "en-US", 0.75)}>Nghe chậm</Button>
      </div>
      <p className="listen-cloze-sentence">{masked}</p>
      <form onSubmit={(event) => { event.preventDefault(); check(); }} className="listen-cloze-form">
        <input
          className="input"
          value={answer}
          onChange={(event) => { setAnswer(event.target.value); setResult(null); }}
          aria-label="Từ còn thiếu trong câu nghe"
          placeholder="Nhập từ còn thiếu…"
          autoComplete="off"
        />
        <Button type="submit" disabled={!answer.trim()}>Kiểm tra <Check size={15} /></Button>
      </form>
      {result === "correct" && <div className="activity-success"><CheckCircle2 size={18} /> Chính xác! {word.example}<small>{word.translation}</small></div>}
      {result === "wrong" && <div className="activity-feedback error"><X size={18} /> Chưa đúng, nghe lại và thử thêm lần nữa nhé.</div>}
    </Card>
  );
}

type LessonQuestion = PublicQuiz["questions"][number];
export function ReadingQuestion({ lessonId, question, onComplete }: { lessonId: string; question: LessonQuestion; onComplete?: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; correctAnswer: number; explanation: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function check() {
    if (selected === null || busy) return;
    setBusy(true);
    try {
      const response = await api<{ correct: boolean; correctAnswer: number; explanation: string }>(`/lessons/${lessonId}/answer`, {
        method: "POST",
        body: JSON.stringify({ questionId: question.id, selected }),
      });
      setResult(response);
      if (response.correct) onComplete?.();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="activity-card reading-check">
      <div className="activity-heading">
        <span className="icon-box green"><CheckCircle2 size={21} /></span>
        <div><Badge className="green">5 · ĐỌC HIỂU</Badge><h2>{question.prompt}</h2><p>Đọc thông tin rồi chọn đáp án phù hợp nhất.</p></div>
      </div>
      {question.passage && <p className="reading-check-passage">{question.passage}</p>}
      <div className="quiz-options">
        {question.options.map((option, index) => (
          <button
            type="button"
            key={index}
            className={`quiz-option ${selected === index ? "selected" : ""}`}
            onClick={() => { setSelected(index); setResult(null); }}
            aria-pressed={selected === index}
          >
            <span>{String.fromCharCode(65 + index)}</span>{option}
          </button>
        ))}
      </div>
      <div className="activity-actions"><Button disabled={selected === null || busy} onClick={check}>{busy ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Kiểm tra</Button></div>
      {result && (
        <div className={result.correct ? "activity-success" : "activity-feedback error"} role="status">
          {result.correct ? <CheckCircle2 size={18} /> : <X size={18} />}
          <span>{result.correct ? "Chính xác!" : `Chưa đúng. Đáp án: ${question.options[result.correctAnswer]}.`} {result.explanation}</span>
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
