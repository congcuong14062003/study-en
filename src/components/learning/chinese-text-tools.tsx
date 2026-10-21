"use client";

import { useId, useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chinesePinyinReading } from "@/lib/chinese-pinyin-reading";
import { hanziCharacters } from "@/lib/hanzi-strokes";
import { HanziStrokeOrder } from "./hanzi-stroke-order";

type Props = { text: string; pinyin?: string | null; language: string };

export function ChineseTextTools(props: Props) {
  if (props.language !== "zh" || !hanziCharacters(props.text).length) return null;
  return <TextTools key={props.text} {...props} />;
}

function TextTools({ text, pinyin, language }: Props) {
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const id = useId();
  async function togglePinyin() {
    if (open && !error) { setOpen(false); return; }
    setOpen(true);
    if (reading) return;
    setBusy(true);
    setError("");
    try { setReading(await chinesePinyinReading(text, pinyin)); }
    catch { setError("Chưa tải được Bính âm. Bấm lại để thử lại nhé."); }
    finally { setBusy(false); }
  }
  return (
    <div className="chinese-text-tools">
      <div className="chinese-text-actions">
        <Button type="button" size="sm" variant="outline" aria-expanded={open} aria-controls={id}
          aria-label={`${open ? "Ẩn" : "Xem"} Bính âm: ${text}`} disabled={busy} onClick={() => void togglePinyin()}>
          {busy ? <Loader2 size={15} className="spin" /> : <Languages size={15} />}{open ? "Ẩn Bính âm" : "Xem Bính âm"}
        </Button>
        <HanziStrokeOrder text={text} pinyin={pinyin} language={language} />
        <HanziStrokeOrder text={text} pinyin={pinyin} language={language} initialMode="practice" />
      </div>
      {open && <div id={id} className="chinese-pinyin-reading" role="status">
        {busy ? "Đang tải Bính âm…" : error || <>
          <span lang="zh-Latn">{reading}</span>
          {!pinyin?.trim() && <small>Bính âm tự động, giữ thanh gốc; từ đa âm hoặc tên riêng có thể cần kiểm tra lại.</small>}
        </>}
      </div>}
    </div>
  );
}
