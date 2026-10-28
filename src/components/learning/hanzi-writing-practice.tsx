"use client";
import { useEffect, useRef, useState } from "react";
import type HanziWriter from "hanzi-writer";
import { Eye, EyeOff, Lightbulb, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HanziWritingRules } from "@/components/learning/hanzi-writing-rules";
import { createHanziPracticeTarget } from "@/lib/hanzi-practice-target";
import { loadHanziStrokeData } from "@/lib/hanzi-strokes";

export function HanziWritingPractice({
  character,
  onComplete,
}: {
  character: string;
  onComplete: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const writer = useRef<HanziWriter | null>(null);
  const completed = useRef(onComplete);
  completed.current = onComplete;
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState(
    "Đặt bút và viết nét đầu tiên theo hình mờ.",
  );
  const [showStrokeHints, setShowStrokeHints] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let active = true;
    let instance: HanziWriter | null = null;
    let resize: ResizeObserver | undefined;
    let theme: MutationObserver | undefined;
    const events = new AbortController();
    setReady(false);
    setError("");
    setCorrect(0);
    setMistakes(0);
    setMessage("Đặt bút và viết nét đầu tiên theo hình mờ.");
    void Promise.all([import("hanzi-writer"), loadHanziStrokeData(character)])
      .then(async ([module, data]) => {
        if (!active) return;
        const size = () =>
          Math.max(1, Math.min(280, element.getBoundingClientRect().width));
        const colors = () => {
          const style = getComputedStyle(element);
          return {
            strokeColor: style.getPropertyValue("--text").trim(),
            outlineColor: style.getPropertyValue("--line").trim(),
            highlightColor: style.getPropertyValue("--primary").trim(),
            drawingColor: style.getPropertyValue("--primary").trim(),
          };
        };
        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        instance = new module.default(element, {
          width: size(),
          height: size(),
          padding: 12,
          showCharacter: false,
          showOutline: showStrokeHints,
          ...colors(),
          strokeFadeDuration: reducedMotion ? 0 : 150,
          drawingFadeDuration: reducedMotion ? 0 : 150,
          strokeHighlightSpeed: reducedMotion ? 100000 : 2,
          charDataLoader: () => data,
          rendererOverride: {
            createRenderTarget: (target, width, height) =>
              createHanziPracticeTarget(
                target,
                width ?? size(),
                height ?? size(),
                events.signal,
              ),
          },
        });
        writer.current = instance;
        await instance.setCharacter(character);
        if (!active) {
          instance.cancelQuiz();
          return;
        }
        setTotal(data.strokes.length);
        resize = new ResizeObserver(() =>
          instance?.updateDimensions({
            width: size(),
            height: size(),
            padding: 12,
          }),
        );
        resize.observe(element);
        theme = new MutationObserver(() => {
          for (const [name, color] of Object.entries(colors()))
            void instance?.updateColor(
              name as
                | "strokeColor"
                | "outlineColor"
                | "highlightColor"
                | "drawingColor",
              color,
              { duration: 0 },
            );
        });
        theme.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class", "style"],
        });
        await instance.quiz({
          acceptBackwardsStrokes: false,
          markStrokeCorrectAfterMisses: false,
          showHintAfterMisses: 2,
          highlightOnComplete: !reducedMotion,
          leniency: 1,
          onCorrectStroke: (result) => {
            if (!active) return;
            setCorrect(result.strokeNum + 1);
            setMistakes(result.totalMistakes);
            setMessage(
              `Đúng nét ${result.strokeNum + 1}. Tiếp tục nét kế tiếp nhé.`,
            );
          },
          onMistake: (result) => {
            if (!active) return;
            setMistakes(result.totalMistakes);
            setMessage(
              `Nét ${result.strokeNum + 1} chưa khớp. Kiểm tra hình và hướng đi; nét sai không được tính hoàn thành.`,
            );
          },
          onComplete: (result) => {
            if (!active) return;
            setCorrect(data.strokes.length);
            setMistakes(result.totalMistakes);
            setMessage(`Đã viết xong chữ ${character}!`);
            completed.current();
          },
        });
        if (active) setReady(true);
        else instance.cancelQuiz();
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error &&
              reason.message.startsWith("Chưa có dữ liệu")
              ? reason.message
              : "Chưa tải được vùng luyện viết. Kiểm tra mạng rồi thử lại nhé.",
          );
      });
    return () => {
      active = false;
      events.abort();
      resize?.disconnect();
      theme?.disconnect();
      instance?.cancelQuiz();
      instance?.pauseAnimation();
      writer.current = null;
      element.replaceChildren();
    };
  }, [character, retry, showStrokeHints]);

  return (
    <div className="hanzi-practice">
      <HanziWritingRules />
      <div className="hanzi-practice-surface">
        <svg
          className="hanzi-practice-guides"
          viewBox="0 0 1024 1024"
          aria-hidden="true"
        >
          <path
            className="hanzi-guides"
            d="M0 512H1024M512 0V1024M0 0L1024 1024M1024 0L0 1024"
          />
        </svg>
        <div ref={host} className="hanzi-practice-host" />
      </div>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <p className="hanzi-status" role="status">
          {ready ? (
            <>
              Khớp nét mẫu:{" "}
              <strong>
                {correct}/{total}
              </strong>{" "}
              · Thử sai: {mistakes}
              <br />
              {message}
            </>
          ) : (
            "Đang chuẩn bị vùng luyện viết…"
          )}
        </p>
      )}
      <div className="hanzi-controls">
        <Button
          type="button"
          variant="outline"
          disabled={!ready || correct === total}
          onClick={() => {
            setShowStrokeHints((prev) => !prev);
          }}
        >
          {showStrokeHints ? <EyeOff size={15} /> : <Eye size={15} />}
          {showStrokeHints ? "Ẩn hình mờ" : "Hiện hình mờ"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!ready || correct === total}
          onClick={() => {
            void writer.current?.highlightStroke(correct);
          }}
        >
          <Lightbulb size={15} />
          Gợi ý nét tiếp
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setRetry((value) => value + 1)}
        >
          <RotateCcw size={15} />
          {error ? "Thử lại" : "Viết lại"}
        </Button>
      </div>
      <p className="hanzi-help">
        Giữ chuột trái hoặc dùng ngón tay viết từng nét. Đây là luyện theo mẫu,
        không phải điểm thư pháp; kết quả chỉ giữ trong lần mở này.
      </p>
    </div>
  );
}
