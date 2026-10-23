"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/utils";
import { chinesePinyinReading } from "@/lib/chinese-pinyin-reading";
import { builtinEnglishPhonetics, englishIpaSchema, type EnglishPhonetics } from "@/lib/speaking-phonetics";

export function SpeakingPhonetics({ text, language, pinyin }: { text: string; language?: string; pinyin?: string | null }) {
  const chinese = language === "zh" || /\p{Script=Han}/u.test(text);
  return <Phonetics key={`${chinese}:${text}:${pinyin || ""}`} text={text} chinese={chinese} savedPinyin={pinyin} />;
}

function Phonetics({ text, chinese, savedPinyin }: { text: string; chinese: boolean; savedPinyin?: string | null }) {
  const initial = chinese ? savedPinyin?.trim() || "" : builtinEnglishPhonetics(text)?.ipa || "";
  const [reading, setReading] = useState(initial);
  const [source, setSource] = useState<EnglishPhonetics["source"]>("builtin");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (initial) return;
    let active = true;
    const controller = new AbortController();
    setError("");
    const load = chinese ? chinesePinyinReading(text)
      : api<EnglishPhonetics>("/speaking/phonetics", { method: "POST", body: JSON.stringify({ text }), signal: controller.signal });
    void load.then((result) => {
      if (!active) return;
      if (typeof result === "string") setReading(result);
      else { setReading(englishIpaSchema.parse(result).ipa); setSource(result.source); }
    }).catch((reason: unknown) => {
      if (active) setError(chinese ? "Chưa tải được Pinyin. Anh bấm thử lại nhé." : reason instanceof Error ? reason.message : "Chưa tải được IPA. Anh bấm thử lại nhé.");
    });
    return () => { active = false; controller.abort(); };
  }, [chinese, initial, retry, text]);
  return (
    <section className="speaking-phonetics" aria-label={chinese ? "Phiên âm Pinyin" : "Phiên âm IPA tiếng Anh"}>
      <h3>{chinese ? "Pinyin · Bính âm" : "IPA · Tiếng Anh giọng Mỹ"}</h3>
      <div role="status" aria-live="polite">
        {error ? <><p>{error}</p><Button type="button" variant="outline" size="sm" onClick={() => setRetry((value) => value + 1)}>Thử lại phiên âm</Button></>
          : reading ? <p className="speaking-phonetic-reading" lang={chinese ? "zh-Latn" : "en-fonipa"}>{reading}</p>
            : <p>Đang tải {chinese ? "Pinyin" : "phiên âm IPA"}…</p>}
      </div>
      <small>{chinese
        ? savedPinyin?.trim() ? "Đọc theo dấu thanh và nghe câu mẫu để luyện cách nối âm, biến điệu." : "Pinyin tự động, giữ thanh gốc; từ đa âm và biến điệu cần đối chiếu giọng mẫu."
        : `${source === "ai" ? "IPA do AI tạo, dùng để tham khảo. " : "Phiên âm đọc tham khảo. "}ˈ là trọng âm chính; ˌ là trọng âm phụ; ː là âm dài. Giọng đọc được chọn có thể có khác biệt.`}</small>
    </section>
  );
}
