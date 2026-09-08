"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
export function speak(text: string, lang = "en-US", rate = 1) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        toast.error("Trình duyệt này chưa hỗ trợ đọc văn bản.");
        return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === lang);
    if (voice)
        u.voice = voice;
    window.speechSynthesis.speak(u);
}
export function AudioButton({ text, lang = "en-US", label }: {
    text: string;
    lang?: string;
    label?: string;
}) {
    return <Button variant="ghost" size={label ? "sm" : "icon"} onClick={() => speak(text, lang)} aria-label={label || `Nghe phát âm ${text}`}><Volume2 size={18}/>{label}</Button>;
}
export function MediaAudioPlayer({ text, translation, title, audioUrl }: {
    text: string;
    translation?: string;
    title?: string;
    audioUrl?: string | null;
}) {
    const audio = useRef<HTMLAudioElement | null>(null);
    const [transcript, setTranscript] = useState(false), [translated, setTranslated] = useState(false);
    if (!audioUrl)
        return <AudioPlayer text={text} translation={translation} title={title}/>;
    return <div className="audio-player"><div className="audio-player-title"><span className="icon-box orange"><Volume2 size={23}/></span><div><h3>{title || "Nghe và luyện tập"}</h3><p>Bản thu âm · English</p></div><select aria-label="Tốc độ bản thu" defaultValue="1" onChange={e => {
            if (audio.current)
                audio.current.playbackRate = Number(e.target.value);
        }}>{[.5, .75, 1, 1.25, 1.5].map(s => <option key={s} value={s}>{s}×</option>)}</select></div><audio className="w-full mt-4" ref={audio} controls src={audioUrl} preload="metadata" onError={() => toast.error("Không thể tải bản thu. Hãy kiểm tra URL âm thanh hoặc xem transcript.")}/><div className="audio-controls mt-4"><Button size="sm" variant="ghost" onClick={() => {
            if (audio.current) {
                audio.current.currentTime = 0;
                void audio.current.play().catch(() => toast.error("Chưa thể phát bản thu."));
            }
        }}><RotateCcw size={15}/> Nghe lại</Button><Button size="sm" variant="outline" onClick={() => setTranscript(!transcript)}>{transcript ? "Ẩn transcript" : "Xem transcript"}</Button>{translation && <Button size="sm" variant="ghost" onClick={() => setTranslated(!translated)}>{translated ? "Ẩn bản dịch" : "Bản dịch"}</Button>}</div>{transcript && <div className="transcript"><h4>Transcript</h4><p>{text}</p></div>}{translated && <div className="transcript"><h4>Bản dịch tiếng Việt</h4><p>{translation}</p></div>}</div>;
}
export function AudioPlayer({ text, translation, title = "Lắng nghe và khám phá" }: {
    text: string;
    translation?: string;
    title?: string;
}) {
    const [playing, setPlaying] = useState(false), [paused, setPaused] = useState(false), [speed, setSpeed] = useState(1), [transcript, setTranscript] = useState(false), [translated, setTranslated] = useState(false);
    const utterance = useRef<SpeechSynthesisUtterance | null>(null);
    useEffect(() => () => {
        window.speechSynthesis?.cancel();
    }, []);
    function play() {
        if (!("speechSynthesis" in window)) {
            toast.error("Trình duyệt chưa hỗ trợ giọng đọc. Bạn có thể đọc transcript bên dưới.");
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
        u.lang = "en-US";
        u.rate = speed;
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
    return <div className="audio-player"><div className="audio-player-title"><span className="icon-box orange"><Volume2 size={23}/></span><div><h3>{title}</h3><p>Giọng đọc tổng hợp · English (US)</p></div><select aria-label="Tốc độ nghe" value={speed} onChange={e => {
        setSpeed(Number(e.target.value));
        replay();
    }}>{[.5, .75, 1, 1.25, 1.5].map(s => <option key={s} value={s}>{s}×</option>)}</select></div><div className={`audio-wave ${playing ? "playing" : ""}`} aria-hidden="true">{Array.from({ length: 48 }, (_, i) => <i key={i} style={{ height: 10 + (Math.sin(i * 2.3) + 1) * 19, animationDelay: `${i * .06}s` }}/>)}</div><div className="audio-controls"><Button variant="ghost" size="icon" onClick={replay} aria-label="Về đầu bản nghe"><RotateCcw size={18}/></Button><Button size="icon" onClick={play} aria-label={playing ? "Tạm dừng" : "Phát bản nghe"}>{playing ? <Pause size={20}/> : <Play size={20}/>}</Button><Button variant="outline" size="sm" onClick={() => setTranscript(!transcript)}>{transcript ? "Ẩn transcript" : "Xem transcript"}</Button>{translation && <Button variant="ghost" size="sm" onClick={() => setTranslated(!translated)}>{translated ? "Ẩn bản dịch" : "Bản dịch"}</Button>}</div>{transcript && <div className="transcript"><h4>Transcript</h4><p>{text}</p></div>}{translated && <div className="transcript"><h4>Bản dịch tiếng Việt</h4><p>{translation}</p></div>}</div>;
}
