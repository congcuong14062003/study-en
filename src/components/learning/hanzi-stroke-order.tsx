"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, Pause, PenLine, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { hanziCharacters, loadHanziStrokeData, medianPath, type HanziStrokeData } from "@/lib/hanzi-strokes";
import { HanziWritingPractice } from "./hanzi-writing-practice";

type WritingMode = "view" | "practice";
export function HanziStrokeOrder({ text, pinyin, language, initialMode = "view" }: { text: string; pinyin?: string | null; language: string; initialMode?: WritingMode }) {
  const [open, setOpen] = useState(false);
  const characters = language === "zh" ? hanziCharacters(text) : [];
  if (!characters.length) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="hanzi-open-button" aria-label={`${initialMode === "practice" ? "Luyện viết nét" : "Cách viết chữ Hán"}: ${text}`}>
          <PenLine size={15} />{initialMode === "practice" ? "Luyện viết nét" : "Cách viết chữ Hán"}
        </Button>
      </DialogTrigger>
      <DialogContent className="hanzi-dialog">
        <DialogTitle>{initialMode === "practice" ? "Luyện viết" : "Cách viết"}: <span lang="zh-CN">{text}</span></DialogTitle>
        <DialogDescription>{pinyin ? `${pinyin} · ` : ""}Chọn từng chữ để xem nét mẫu hoặc tự viết. Viết liền mỗi nét, nhấc bút khi chuyển nét; dấu câu không cần luyện.</DialogDescription>
        {open && <HanziWordPlayer key={text} characters={characters} initialMode={initialMode} />}
        <p className="hanzi-source">Dữ liệu: <a href="https://github.com/chanind/hanzi-writer-data" target="_blank" rel="noreferrer">Hanzi Writer Data / Make Me a Hanzi</a> · <a href="https://github.com/chanind/hanzi-writer-data/blob/master/ARPHICPL.TXT" target="_blank" rel="noreferrer">Arphic Public License</a>. Cần mạng khi tải chữ lần đầu; một số chữ có thể chưa được hỗ trợ.</p>
      </DialogContent>
    </Dialog>
  );
}

function HanziWordPlayer({ characters, initialMode }: { characters: string[]; initialMode: WritingMode }) {
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState(initialMode);
  const [done, setDone] = useState<number[]>([]);
  return (
    <>
      <div className="hanzi-character-picker" role="group" aria-label="Chọn chữ để xem nét viết">
        {characters.map((character, index) => (
          <Button key={index} type="button" variant={selected === index ? "default" : "outline"}
            aria-pressed={selected === index} aria-label={`Chữ ${character}, vị trí ${index + 1}`}
            onClick={() => setSelected(index)}><span lang="zh-CN">{character}</span>{done.includes(index) && <Check size={13} aria-label="Đã luyện xong" />}</Button>
        ))}
      </div>
      <div className="hanzi-mode-picker" role="group" aria-label="Chế độ luyện chữ">
        <Button type="button" size="sm" variant={mode === "view" ? "secondary" : "ghost"} aria-pressed={mode === "view"} onClick={() => setMode("view")}>Xem nét mẫu</Button>
        <Button type="button" size="sm" variant={mode === "practice" ? "secondary" : "ghost"} aria-pressed={mode === "practice"} onClick={() => setMode("practice")}>Tự viết</Button>
      </div>
      {mode === "view" ? <HanziCharacterPlayer key={`${selected}:${characters[selected]}`} character={characters[selected]} />
        : <HanziWritingPractice key={`${selected}:${characters[selected]}`} character={characters[selected]}
            onComplete={() => setDone((current) => current.includes(selected) ? current : [...current, selected])} />}
      {mode === "practice" && <div className="hanzi-word-progress">
        <span>Đã luyện {done.length}/{characters.length} chữ trong lần mở này</span>
        {selected < characters.length - 1 && <Button type="button" size="sm" variant="outline" onClick={() => setSelected((index) => index + 1)}>Chữ tiếp<ChevronRight size={15} /></Button>}
      </div>}
    </>
  );
}

function HanziCharacterPlayer({ character }: { character: string }) {
  const [data, setData] = useState<HanziStrokeData | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [step, setStep] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  const stroke = useRef<SVGPathElement>(null);
  const clipId = useId().replace(/:/g, "");

  useEffect(() => {
    let active = true;
    setError("");
    setData(null);
    void loadHanziStrokeData(character).then((value) => {
      if (active) { setData(value); setStep(1); }
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error && reason.message.startsWith("Chưa có dữ liệu")
        ? reason.message : "Không tải được nét chữ. Anh kiểm tra kết nối rồi thử lại nhé.");
    });
    return () => { active = false; };
  }, [character, retry]);

  useEffect(() => {
    if (!playing || !data) return;
    const timer = window.setTimeout(() => {
      if (step >= data.strokes.length) setPlaying(false);
      else setStep((current) => current + 1);
    }, 1350);
    return () => window.clearTimeout(timer);
  }, [playing, step, data, replay]);

  useEffect(() => {
    const path = stroke.current;
    if (!path || !data || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !path.animate) return;
    const length = path.getTotalLength();
    const animation = path.animate([
      { strokeDasharray: `${length} ${length}`, strokeDashoffset: length },
      { strokeDasharray: `${length} ${length}`, strokeDashoffset: 0 },
    ], { duration: 900, easing: "linear" });
    return () => animation.cancel();
  }, [data, step, replay]);

  if (error) return <div className="hanzi-loading" role="alert"><p>{error}</p><Button type="button" variant="outline" onClick={() => setRetry((value) => value + 1)}>Thử lại</Button></div>;
  if (!data) return <div className="hanzi-loading" role="status"><Loader2 size={24} className="spin" /><span>Đang tải nét chữ {character}…</span></div>;
  const index = step - 1;
  const start = data.medians[index][0];
  return (
    <>
      <svg className="hanzi-writing-grid" viewBox="0 0 1024 1024" role="img" aria-label={`Chữ ${character}, nét ${step} trên ${data.strokes.length}`}>
        <path className="hanzi-guides" d="M0 512H1024M512 0V1024M0 0L1024 1024M1024 0L0 1024" />
        <g transform="translate(0 900) scale(1 -1)">
          {data.strokes.map((path, position) => <path key={position} d={path} className={position < index ? "hanzi-completed-stroke" : "hanzi-outline-stroke"} />)}
          <defs><clipPath id={clipId}><path d={data.strokes[index]} /></clipPath></defs>
          <path ref={stroke} d={medianPath(data.medians[index])} clipPath={`url(#${clipId})`} className="hanzi-active-stroke" />
          <circle cx={start[0]} cy={start[1]} r={11} className="hanzi-start-point" />
        </g>
      </svg>
      <p className="hanzi-status" role="status">Chữ <span lang="zh-CN">{character}</span> · Nét <strong>{step}/{data.strokes.length}</strong>{step === data.strokes.length && !playing ? " · Hoàn thành" : ""}</p>
      <div className="hanzi-controls">
        <Button type="button" variant="outline" disabled={step === 1} onClick={() => { setPlaying(false); setStep((value) => value - 1); }}><ChevronLeft size={16} />Nét trước</Button>
        <Button type="button" onClick={() => {
          if (playing) setPlaying(false);
          else { setStep(1); setReplay((value) => value + 1); setPlaying(true); }
        }}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? "Dừng" : "Viết mẫu"}</Button>
        <Button type="button" variant="outline" disabled={step === data.strokes.length} onClick={() => { setPlaying(false); setStep((value) => value + 1); }}>Nét tiếp<ChevronRight size={16} /></Button>
      </div>
      <p className="hanzi-help">Nét màu tím đang viết · Chấm tròn là điểm bắt đầu.</p>
    </>
  );
}
