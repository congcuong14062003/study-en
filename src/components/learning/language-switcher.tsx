"use client";
import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/utils";
import { learningLanguages, type LearningLanguage } from "@/lib/languages";
const Context = createContext<LearningLanguage>("en");
export const LearningLanguageProvider = Context.Provider;
export function useLearningLanguage() {
  return useContext(Context);
}
export function LanguageSwitcher() {
  const language = useLearningLanguage();
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function change(value: string) {
    if (value === language || busy) return;
    setBusy(true);
    try {
      const result = await api<{ resumeHref: string }>("/learning-language", {
        method: "POST", body: JSON.stringify({ language: value }),
      });
      router.push(result.resumeHref);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <label className="learning-language-picker">
      <span className="sr-only">Chọn ngôn ngữ học</span>
      <select
        aria-label="Chọn ngôn ngữ học"
        value={language}
        disabled={busy}
        onChange={(e) => void change(e.target.value)}
      >
        {Object.entries(learningLanguages).map(([code, item]) => (
          <option value={code} key={code}>{item.name}</option>
        ))}
      </select>
      {busy && <small role="status">Đang chuyển…</small>}
    </label>
  );
}
