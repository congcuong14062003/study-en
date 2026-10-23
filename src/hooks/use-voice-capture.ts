"use client";
import { useEffect, useRef, useState } from "react";
import { createPronunciationRecorder, emptyPronunciationCapture } from "@/lib/pronunciation-recorder";
export function useVoiceCapture(locale: string, recognize = true) {
  const [capture, setCapture] = useState(emptyPronunciationCapture);
  const [supported, setSupported] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const attempt = useRef<ReturnType<typeof createPronunciationRecorder> | null>(null);
  const playback = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    setSupported(typeof navigator.mediaDevices?.getUserMedia === "function" && typeof MediaRecorder === "function");
    setRecognitionSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => attempt.current?.dispose();
  }, [locale]);
  useEffect(() => {
    if (!capture.audio) { setAudioUrl(""); return; }
    const url = URL.createObjectURL(capture.audio); setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [capture.audio]);
  const recording = capture.phase === "recording";
  const pending = capture.phase === "requesting" || capture.phase === "finishing";
  function start() {
    if (!supported || recording || pending) return;
    attempt.current?.dispose(); playback.current?.pause(); window.speechSynthesis?.cancel();
    setCapture(emptyPronunciationCapture());
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    attempt.current = createPronunciationRecorder(locale, {
      getMicrophone: () => navigator.mediaDevices.getUserMedia({ audio: true }),
      createRecorder: (stream) => new MediaRecorder(stream),
      createRecognition: recognize && Recognition ? () => new Recognition() : null,
      schedule: (callback, delay) => setTimeout(callback, delay), clear: clearTimeout,
    }, setCapture, 28000);
    void attempt.current.start();
  }
  return { capture, supported, recognitionSupported, audioUrl, playback, recording, pending, locked: recording || pending, start, stop: () => attempt.current?.stop() };
}
