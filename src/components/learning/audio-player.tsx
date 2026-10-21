"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { speechLanguage } from "@/lib/languages";

function languageVoices(lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window))
    return [];
  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith(lang.split("-")[0].toLowerCase()))
    .sort((a, b) =>
      `${a.lang} ${a.name}`.localeCompare(`${b.lang} ${b.name}`),
    );
}

function useLanguageVoices(lang: string) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => setVoices(languageVoices(lang));
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [lang]);
  return voices;
}

function voiceLabel(voice: SpeechSynthesisVoice) {
  return `${voice.name.replace(/Microsoft |Google |Apple /gi, "")} · ${voice.lang}`;
}

function matchingVoice(voices: SpeechSynthesisVoice[], voiceURI?: string) {
  return voices.find((voice) => voice.voiceURI === voiceURI);
}

/** Prefer natural-sounding voices for the requested language, without forcing an English voice onto Han text. */
function defaultVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
  voiceURI?: string,
) {
  const selected = matchingVoice(voices, voiceURI);
  if (selected) return selected;
  const sameLanguage = voices.filter((voice) => voice.lang === lang);
  const sameLocale = sameLanguage.length
    ? sameLanguage
    : voices.filter((voice) =>
        voice.lang.startsWith(lang.split("-")[0]),
      );
  const friendlyVoice = /aria|ava|emma|jenny|libby|sonia|sara|hazel|zira|samantha|female|xiaoxiao|huihui|yaoyao/i;
  return (
    sameLocale.find((voice) => friendlyVoice.test(voice.name)) ||
    sameLocale.find((voice) => voice.localService) ||
    sameLocale[0]
  );
}

export function speak(
  text: string,
  lang = speechLanguage(text),
  rate = 1,
  voiceURI?: string,
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    toast.error("Trình duyệt này chưa hỗ trợ đọc văn bản.");
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  const voices = languageVoices(lang);
  const voice = defaultVoice(voices, lang, voiceURI);
  if (voice) u.voice = voice;
  u.onerror = (event) => {
    if (!["interrupted", "canceled"].includes(event.error)) toast.error("Không phát được giọng đọc. Hãy kiểm tra giọng ngôn ngữ đã cài trên trình duyệt/hệ điều hành.");
  };
  window.speechSynthesis.speak(u);
}
export function AudioButton({
  text,
  lang = speechLanguage(text),
  label,
}: {
  text: string;
  lang?: string;
  label?: string;
}) {
  const voices = useLanguageVoices(lang);
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(1);
  return (
    <span className="audio-button">
      <Button
        variant="ghost"
        size={label ? "sm" : "icon"}
        onClick={() => speak(text, lang, rate, voiceURI)}
        aria-label={label || `Nghe phát âm ${text}`}
      >
        <Volume2 size={18} />
        {label}
      </Button>
      {voices.length > 1 && (
        <select
          className="audio-voice-select"
          value={voiceURI}
          onChange={(event) => setVoiceURI(event.target.value)}
          aria-label="Chọn giọng đọc"
          title="Chọn giọng đọc"
        >
          <option value="">
            Mặc định dịu · {defaultVoice(voices, lang)?.name || lang}
          </option>
          {voices.map((voice) => (
            <option key={voice.voiceURI} value={voice.voiceURI}>
              {voiceLabel(voice)}
            </option>
          ))}
        </select>
      )}
      <select
        className="audio-rate-select"
        value={rate}
        onChange={(event) => setRate(Number(event.target.value))}
        aria-label="Chọn tốc độ đọc"
        title="Chọn tốc độ đọc"
      >
        <option value={0.75}>Chậm</option>
        <option value={1}>Thường</option>
        <option value={1.25}>Nhanh</option>
      </select>
    </span>
  );
}
export function MediaAudioPlayer({
  text,
  translation,
  title,
  audioUrl,
}: {
  text: string;
  translation?: string;
  title?: string;
  audioUrl?: string | null;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [transcript, setTranscript] = useState(false),
    [translated, setTranslated] = useState(false);
  if (!audioUrl)
    return <AudioPlayer text={text} translation={translation} title={title} />;
  return (
    <div className="audio-player">
      <div className="audio-player-title">
        <span className="icon-box orange">
          <Volume2 size={23} />
        </span>
        <div>
          <h3>{title || "Nghe và luyện tập"}</h3>
          <p>Bản thu âm · {speechLanguage(text) === "zh-CN" ? "Tiếng Trung" : "Tiếng Anh"}</p>
        </div>
        <select
          aria-label="Tốc độ bản thu"
          defaultValue="1"
          onChange={(e) => {
            if (audio.current)
              audio.current.playbackRate = Number(e.target.value);
          }}
        >
          {[0.5, 0.75, 1, 1.25, 1.5].map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </div>
      <audio
        className="w-full mt-4"
        ref={audio}
        controls
        src={audioUrl}
        preload="metadata"
        onError={() =>
          toast.error(
            "Không thể tải bản thu. Hãy kiểm tra URL âm thanh hoặc xem transcript.",
          )
        }
      />
      <div className="audio-controls mt-4">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (audio.current) {
              audio.current.currentTime = 0;
              void audio.current
                .play()
                .catch(() => toast.error("Chưa thể phát bản thu."));
            }
          }}
        >
          <RotateCcw size={15} /> Nghe lại
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setTranscript(!transcript)}
        >
          {transcript ? "Ẩn transcript" : "Xem transcript"}
        </Button>
        {translation && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTranslated(!translated)}
          >
            {translated ? "Ẩn bản dịch" : "Bản dịch"}
          </Button>
        )}
      </div>
      {transcript && (
        <div className="transcript">
          <h4>Transcript</h4>
          <p>{text}</p>
        </div>
      )}
      {translated && (
        <div className="transcript">
          <h4>Bản dịch tiếng Việt</h4>
          <p>{translation}</p>
        </div>
      )}
    </div>
  );
}
export function AudioPlayer({
  text,
  translation,
  title = "Lắng nghe và khám phá",
}: {
  text: string;
  translation?: string;
  title?: string;
}) {
  const [playing, setPlaying] = useState(false),
    [paused, setPaused] = useState(false),
    [speed, setSpeed] = useState(1),
    [transcript, setTranscript] = useState(false),
    [translated, setTranslated] = useState(false);
  const lang = speechLanguage(text);
  const voices = useLanguageVoices(lang);
  const [voiceURI, setVoiceURI] = useState("");
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    [],
  );
  function play() {
    if (!("speechSynthesis" in window)) {
      toast.error(
        "Trình duyệt chưa hỗ trợ giọng đọc. Bạn có thể đọc transcript bên dưới.",
      );
      setTranscript(true);
      return;
    }
    if (playing) {
      window.speechSynthesis.pause();
      setPlaying(false);
      setPaused(true);
      return;
    }
    if (paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
      setPaused(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = speed;
    const voice = defaultVoice(voices, lang, voiceURI);
    if (voice) u.voice = voice;
    u.onend = () => {
      setPlaying(false);
      setPaused(false);
    };
    u.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };
    utterance.current = u;
    window.speechSynthesis.speak(u);
    setPlaying(true);
  }
  function replay() {
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setPaused(false);
  }
  return (
    <div className="audio-player">
      <div className="audio-player-title">
        <span className="icon-box orange">
          <Volume2 size={23} />
        </span>
        <div>
          <h3>{title}</h3>
          <p>
            {defaultVoice(voices, lang, voiceURI)
              ? voiceLabel(defaultVoice(voices, lang, voiceURI)!)
              : `Giọng đọc tự động · ${lang}`}
          </p>
        </div>
        <div className="audio-player-settings">
          {voices.length > 1 && (
            <select
              aria-label="Chọn giọng đọc"
              value={voiceURI}
              onChange={(event) => {
                setVoiceURI(event.target.value);
                replay();
              }}
            >
              <option value="">
                Mặc định dịu · {defaultVoice(voices, lang)?.name || lang}
              </option>
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voiceLabel(voice)}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Tốc độ nghe"
            value={speed}
            onChange={(e) => {
              setSpeed(Number(e.target.value));
              replay();
            }}
          >
            {[0.5, 0.75, 1, 1.25, 1.5].map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </div>
      </div>
      <div
        className={`audio-wave ${playing ? "playing" : ""}`}
        aria-hidden="true"
      >
        {Array.from({ length: 48 }, (_, i) => (
          <i
            key={i}
            style={{
              height: 10 + (Math.sin(i * 2.3) + 1) * 19,
              animationDelay: `${i * 0.06}s`,
            }}
          />
        ))}
      </div>
      <div className="audio-controls">
        <Button
          variant="ghost"
          size="icon"
          onClick={replay}
          aria-label="Về đầu bản nghe"
        >
          <RotateCcw size={18} />
        </Button>
        <Button
          size="icon"
          onClick={play}
          aria-label={playing ? "Tạm dừng" : "Phát bản nghe"}
        >
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTranscript(!transcript)}
        >
          {transcript ? "Ẩn transcript" : "Xem transcript"}
        </Button>
        {translation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTranslated(!translated)}
          >
            {translated ? "Ẩn bản dịch" : "Bản dịch"}
          </Button>
        )}
      </div>
      {transcript && (
        <div className="transcript">
          <h4>Transcript</h4>
          <p>{text}</p>
        </div>
      )}
      {translated && (
        <div className="transcript">
          <h4>Bản dịch tiếng Việt</h4>
          <p>{translation}</p>
        </div>
      )}
    </div>
  );
}
