"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/utils";
import { exampleSentenceTranslation } from "@/lib/vocabulary-example";

type Example = { id: string; example: string; translation: string };
type Translation = { example: string; translation: string };
const pending = new Map<string, Promise<Translation>>();
const cache = new Map<string, Translation>();
const waiting: (() => void)[] = [];
let running = 0;

async function requestTranslation(word: Example) {
  const key = `${word.id}\n${word.example}`;
  const cached = cache.get(key);
  if (cached) return cached;
  let request = pending.get(key);
  if (!request) {
    request = (async () => {
      // Avoid a burst of AI calls when several vocabulary cards become visible.
      if (running < 2) running++;
      else await new Promise<void>((resolve) => waiting.push(resolve));
      try {
        const result = await api<Translation>(
          `/vocabulary/${encodeURIComponent(word.id)}/translate-example`,
          { method: "POST", body: "{}" },
        );
        if (
          result.example !== word.example ||
          !exampleSentenceTranslation(result.example, result.translation)
        )
          throw new Error("Câu ví dụ đã thay đổi. Hãy tải lại từ vựng.");
        if (cache.size >= 500) cache.delete(cache.keys().next().value!);
        cache.set(key, result);
        return result;
      } finally {
        const next = waiting.shift();
        if (next) next();
        else running--;
      }
    })().finally(() => pending.delete(key));
    pending.set(key, request);
  }
  return request;
}

export function VocabularyExampleTranslation({
  word,
  active = true,
  retryable = true,
  className,
}: {
  word: Example;
  active?: boolean;
  retryable?: boolean;
  className?: string;
}) {
  const element = useRef<HTMLSpanElement>(null);
  const key = `${word.id}\n${word.example}`;
  const existing = exampleSentenceTranslation(word.example, word.translation);
  const [result, setResult] = useState<{
    key: string;
    translation?: string;
    failed?: boolean;
  }>();
  const [retry, setRetry] = useState(0);
  const current = result?.key === key ? result : undefined;
  const translation = existing || current?.translation;

  useEffect(() => {
    if (existing || !active) return;
    let disposed = false;
    let started = false;
    function load() {
      if (started) return;
      started = true;
      setResult({ key });
      void requestTranslation(word).then(
        (value) => {
          if (!disposed) setResult({ key, translation: value.translation });
        },
        () => {
          if (!disposed) setResult({ key, failed: true });
        },
      );
    }
    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            load();
          }
        });
    if (observer && element.current) observer.observe(element.current);
    else load();
    return () => {
      disposed = true;
      observer?.disconnect();
    };
  }, [key, existing, active, retry, word.id, word.example, word.translation]);

  return (
    <span
      ref={element}
      className={`example-sentence-translation ${className || ""}`}
      lang="vi"
      aria-live="polite"
      aria-busy={active && !translation && !current?.failed}
    >
      <span className="example-translation-label">Dịch câu ví dụ</span>
      {translation || (current?.failed ? (
        <span>
          Chưa tải được bản dịch câu ví dụ.
          {retryable && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setRetry((value) => value + 1)}
            >
              Thử lại
            </Button>
          )}
        </span>
      ) : "Đang tải bản dịch câu ví dụ…")}
    </span>
  );
}
