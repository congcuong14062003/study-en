"use client";
import { AudioButton } from "./audio-player";
import { speechLanguage } from "@/lib/languages";

/** A separate example control; never place it inside the flashcard flip button. */
export function VocabularyExampleAudio({ example }: { example: string }) {
  if (!example.trim()) return null;
  return <AudioButton text={example} lang={speechLanguage(example)} label="Nghe câu ví dụ" />;
}
