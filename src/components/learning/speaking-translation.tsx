"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/utils";
import { builtinSpeakingTranslation, type SpeakingTranslationResult } from "@/lib/speaking-translation";
import { exampleSentenceTranslation } from "@/lib/vocabulary-example";

export function SpeakingTranslation({ text, saved }: { text: string; saved?: string }) {
  return <Translation key={`${text}:${saved || ""}`} text={text} saved={saved} />;
}
function Translation({ text, saved }: { text: string; saved?: string }) {
  const initial = saved || builtinSpeakingTranslation(text);
  const [translation, setTranslation] = useState(initial || "");
  const [source, setSource] = useState<SpeakingTranslationResult["source"]>("builtin");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (initial) return;
    let active = true;
    const controller = new AbortController();
    setError("");
    void api<SpeakingTranslationResult>("/speaking/translation", { method: "POST", body: JSON.stringify({ text }), signal: controller.signal }).then((result) => {
      if (!active) return;
      if (result.text !== text.trim() || !exampleSentenceTranslation(text, result.translation) || /\p{Script=Han}/u.test(result.translation)) throw new Error("Bản dịch chưa khớp câu mẫu. Anh thử lại nhé.");
      setTranslation(result.translation); setSource(result.source);
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Chưa tải được bản dịch. Anh thử lại nhé."); });
    return () => { active = false; controller.abort(); };
  }, [initial, retry, text]);
  return <section className="speaking-translation" aria-label="Dịch nghĩa tiếng Việt">
    <h3>Nghĩa tiếng Việt</h3>
    <div role="status" aria-live="polite" lang="vi">
      {error ? <><p>{error}</p><Button type="button" variant="outline" size="sm" onClick={() => setRetry((value) => value + 1)}>Thử lại bản dịch</Button></> : <p>{translation || "Đang tải bản dịch…"}</p>}
    </div>
    {source === "ai" && translation && <small>Bản dịch AI hỗ trợ tham khảo; có thể cần hiệu đính theo ngữ cảnh.</small>}
  </section>;
}
