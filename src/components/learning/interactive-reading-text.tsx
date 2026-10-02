"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  buildGlossary,
  isReadingWord,
  lookupReadingWord,
  readingWordContext,
  splitReadingWords,
  type GlossaryEntry,
} from "@/lib/reading-glossary";
import { api } from "@/lib/utils";
import { speak } from "./audio-player";

const automaticGlosses = new Map<string, { meaning: string; expiresAt: number }>();
const pendingGlosses = new Map<string, Promise<string>>();
const glossStoragePrefix = "reading-gloss:v1:";

function glossKey(word: string, context: string) {
  return `${word.toLowerCase()}\n${context.toLowerCase()}`;
}

function cachedGloss(key: string) {
  const inMemory = automaticGlosses.get(key);
  if (inMemory && inMemory.expiresAt > Date.now()) return inMemory.meaning;
  try {
    const saved = window.localStorage.getItem(glossStoragePrefix + key);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as { meaning?: string; expiresAt?: number };
    if (parsed.meaning && (parsed.expiresAt || 0) > Date.now()) {
      automaticGlosses.set(key, { meaning: parsed.meaning, expiresAt: parsed.expiresAt! });
      return parsed.meaning;
    }
  } catch {
    // Private browsing may disable storage; the in-memory cache still works.
  }
  return null;
}

function resolveAutomaticGloss(word: string, context: string) {
  const key = glossKey(word, context);
  const cached = cachedGloss(key);
  if (cached) return Promise.resolve(cached);
  const pending = pendingGlosses.get(key);
  if (pending) return pending;
  const request = api<{ meaning: string }>("/glossary", {
    method: "POST",
    body: JSON.stringify({ word, context }),
  }).then(({ meaning }) => {
    const entry = { meaning, expiresAt: Date.now() + 7 * 86400000 };
    automaticGlosses.set(key, entry);
    try {
      window.localStorage.setItem(glossStoragePrefix + key, JSON.stringify(entry));
    } catch {
      // The tooltip still has the current result when storage is unavailable.
    }
    return meaning;
  }).finally(() => pendingGlosses.delete(key));
  pendingGlosses.set(key, request);
  return request;
}

function ReadingWord({
  token,
  entry,
  onSelect,
  insideButton,
  context,
  vocabularyReady,
}: {
  token: string;
  entry: GlossaryEntry | null;
  onSelect?: (entry: GlossaryEntry) => void;
  insideButton: boolean;
  context: string;
  vocabularyReady: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [automaticMeaning, setAutomaticMeaning] = useState<string | null>(null);
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open || entry || !vocabularyReady || automaticMeaning || lookupState !== "idle") return;
    const lookupTimer = window.setTimeout(() => {
      setLookupState("loading");
      void resolveAutomaticGloss(token, context)
        .then((meaning) => setAutomaticMeaning(meaning))
        .catch(() => setLookupState("error"));
    }, 180);
    return () => window.clearTimeout(lookupTimer);
  }, [open, entry, vocabularyReady, automaticMeaning, lookupState, token, context]);

  function clearTimer() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }

  useEffect(() => clearTimer, []);

  function scheduleSpeech() {
    clearTimer();
    timer.current = setTimeout(() => {
      speak(token);
      timer.current = null;
    }, 300);
  }

  return (
    <Tooltip.Root open={open} onOpenChange={setOpen}>
      <Tooltip.Trigger asChild>
        <span
          role={insideButton ? undefined : "button"}
          tabIndex={insideButton ? undefined : 0}
          className="reading-gloss-word"
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse" || event.pointerType === "pen") {
              setOpen(true);
              if (lookupState === "error") setLookupState("idle");
              scheduleSpeech();
            }
          }}
          onPointerLeave={() => {
            clearTimer();
            setOpen(false);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            clearTimer();
            setOpen(false);
          }}
          onClick={(event) => {
            // Radix closes tooltips on click by default. Keep it open for touch,
            // while allowing the surrounding answer button to receive the click.
            event.preventDefault();
            clearTimer();
            speak(token);
            if (lookupState === "error") setLookupState("idle");
            if (entry && onSelect) {
              setOpen(false);
              onSelect(entry);
            } else {
              setOpen(true);
            }
          }}
          onKeyDown={insideButton ? undefined : (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
          aria-label={`${token}: ${entry?.meaning || automaticMeaning || "đang tra nghĩa"}. Bấm để nghe phát âm.`}
        >
          {token}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="reading-gloss-tooltip" sideOffset={8} collisionPadding={12}>
          <strong>{token}</strong>
          {entry?.ipa && <span className="reading-gloss-ipa">/{entry.ipa.replace(/^\/+|\/+$/g, "")}/</span>}
          <span className="reading-gloss-meaning">
            {entry?.meaning || automaticMeaning || (
              !vocabularyReady ? "Đang tải từ điển…" :
              lookupState === "error" ? "Chưa tra được nghĩa. Rê lại để thử." :
              "Đang tra nghĩa tiếng Việt…"
            )}
          </span>
          <Tooltip.Arrow className="reading-gloss-arrow" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function InteractiveReadingText({
  text,
  vocabulary,
  onSelect,
  insideButton = false,
  vocabularyReady = true,
}: {
  text: string;
  vocabulary: GlossaryEntry[];
  onSelect?: (entry: GlossaryEntry) => void;
  insideButton?: boolean;
  vocabularyReady?: boolean;
}) {
  const glossary = useMemo(() => buildGlossary(vocabulary), [vocabulary]);
  const parts = useMemo(() => {
    let offset = 0;
    return splitReadingWords(text).map((part) => {
      const context = readingWordContext(text, offset, part.length);
      offset += part.length;
      return { part, context };
    });
  }, [text]);

  return (
    <Tooltip.Provider delayDuration={0}>
      {parts.map(({ part, context }, index) =>
        isReadingWord(part) ? (
          <ReadingWord
            key={`${index}-${part}-${context}`}
            token={part}
            entry={lookupReadingWord(part, glossary)}
            onSelect={onSelect}
            insideButton={insideButton}
            context={context}
            vocabularyReady={vocabularyReady}
          />
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </Tooltip.Provider>
  );
}
