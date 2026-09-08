"use client";
import { useEffect, useRef, useState } from "react";
import { Coffee, Mic, Plus, Send, Sparkles, Volume2, Loader2, Info, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { api } from "@/lib/utils";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/dashboard/dashboard";
import { AudioButton } from "@/components/learning/audio-player";
type Conversation = {
    id: string;
    scenario: string;
    difficulty: string;
    correction: string;
    messages?: {
        role: string;
        content: string;
    }[];
};
export function AIChat() {
    const { data: config } = useData<{
        ai: boolean;
    }>("/config");
    const { data: history, refresh } = useData<Conversation[]>("/ai");
    const [scenario, setScenario] = useState("Coffee Shop"), [difficulty, setDifficulty] = useState("Beginner"), [correction, setCorrection] = useState("important"), [message, setMessage] = useState(""), [messages, setMessages] = useState<{
        role: string;
        content: string;
    }[]>([]), [conversationId, setConversationId] = useState<string | undefined>(), [busy, setBusy] = useState(false), [error, setError] = useState(""), [listening, setListening] = useState(false);
    const bottom = useRef<HTMLDivElement | null>(null), recognition = useRef<SpeechRecognition | null>(null);
    useEffect(() => {
        bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [messages, busy]);
    useEffect(() => () => recognition.current?.abort(), []);
    async function send(e: React.FormEvent) {
        e.preventDefault();
        const text = message.trim();
        if (!text || busy)
            return;
        setBusy(true);
        setError("");
        try {
            const result = await api<{
                reply: string;
                conversationId: string;
            }>("/ai/chat", { method: "POST", body: JSON.stringify({ message: text, conversationId, scenario, difficulty, correction }) });
            setMessages(m => [...m, { role: "user", content: text }, { role: "assistant", content: result.reply }]);
            setMessage("");
            setConversationId(result.conversationId);
            refresh();
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    async function open(id: string) {
        try {
            const c = await api<Conversation>(`/ai/${id}`);
            setConversationId(id);
            setScenario(c.scenario);
            setDifficulty(c.difficulty);
            setCorrection(c.correction);
            setMessages(c.messages || []);
            setError("");
        }
        catch (e) {
            toast.error((e as Error).message);
        }
    }
    function newChat() {
        setConversationId(undefined);
        setMessages([]);
        setMessage("");
        setError("");
    }
    function dictate() {
        if (listening) {
            recognition.current?.stop();
            return;
        }
        const R = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!R) {
            toast.error("Trình duyệt chưa hỗ trợ nhập bằng giọng nói.");
            return;
        }
        const r = new R();
        recognition.current = r;
        r.lang = "en-US";
        r.continuous = false;
        r.interimResults = false;
        r.onresult = e => setMessage(m => `${m} ${e.results[0][0].transcript}`.trim());
        r.onend = () => setListening(false);
        r.onerror = () => {
            setListening(false);
            toast.error("Không thể nhận dạng giọng nói. Hãy thử nhập văn bản.");
        };
        r.start();
        setListening(true);
    }
    return <><PageHeading title="Một cuộc trò chuyện. Thêm tự tin." description="Luyện giao tiếp theo tình huống cùng người bạn học AI."><Badge><Sparkles size={12}/> AI Tutor</Badge></PageHeading><div className="ai-workspace"><aside className="card ai-context"><Button variant="outline" className="w-full" onClick={newChat} disabled={busy}><Plus size={16}/> Cuộc trò chuyện mới</Button><div className="field mt-4"><label htmlFor="scenario">Tình huống</label><select id="scenario" value={scenario} disabled={Boolean(conversationId) || busy} onChange={e => setScenario(e.target.value)}>{["Coffee Shop", "Airport", "Hotel", "Job Interview", "Restaurant", "Meeting", "Travel", "Shopping", "Making Friends"].map(s => <option key={s}>{s}</option>)}</select></div><div className="field"><label htmlFor="difficulty">Trình độ</label><select id="difficulty" value={difficulty} disabled={Boolean(conversationId) || busy} onChange={e => setDifficulty(e.target.value)}>{["Beginner", "Intermediate", "Advanced"].map(s => <option key={s}>{s}</option>)}</select></div><div className="field"><label htmlFor="correction">Cách sửa lỗi</label><select id="correction" value={correction} disabled={Boolean(conversationId) || busy} onChange={e => setCorrection(e.target.value)}><option value="none">Không sửa lỗi</option><option value="important">Sửa lỗi quan trọng</option><option value="all">Sửa tất cả</option></select></div><hr className="divider"/><h4>Trò chuyện gần đây</h4><div className="conversation-history">{history?.length ? history.map(c => <button key={c.id} className={c.id === conversationId ? "active" : ""} onClick={() => open(c.id)} disabled={busy}><MessageSquare size={14}/>{c.scenario}</button>) : <p>Cuộc trò chuyện của bạn sẽ được lưu ở đây.</p>}</div></aside><Card className="chat-surface"><div className="chat-header"><span className="icon-box purple"><Sparkles size={22}/></span><div><h3>EnglishMaster AI</h3><p>{scenario} · {difficulty}</p></div><Badge className={config?.ai ? "green" : "neutral"}>{config?.ai ? "Sẵn sàng trò chuyện" : "Chưa kết nối AI"}</Badge></div><div className="chat-messages">{messages.length === 0 && <div className="chat-welcome"><span className="icon-box purple"><Coffee size={33}/></span><h2>Let’s talk about {scenario.toLowerCase()}.</h2><p>Bắt đầu bằng một lời chào. Đừng lo mắc lỗi — đó là cách chúng ta học.</p><div className="starter-prompts">{["Hi! Can we practice a conversation?", "Could you help me introduce myself?", "I go to school yesterday. Is that correct?"].map(t => <button key={t} onClick={() => setMessage(t)}>{t}<ArrowIcon /></button>)}</div>{config && !config.ai && <div className="notice"><Info size={17}/>Dịch vụ AI chưa được cấu hình. Hội thoại sẽ hoạt động khi quản trị viên kết nối khóa API.</div>}</div>}{messages.map((m, i) => <div key={i} className={`chat-message ${m.role}`}><span className="chat-avatar">{m.role === "assistant" ? <Sparkles size={18}/> : "Bạn"}</span><div><div className="message-content">{m.content}</div>{m.role === "assistant" && <AudioButton text={m.content} label="Nghe phản hồi"/>}</div></div>)}{busy && <div className="chat-thinking"><Sparkles size={16}/><span>Đang chuẩn bị phản hồi</span><Loader2 size={15} className="spin"/></div>}<div ref={bottom}/></div>{error && <p className="error-message" role="alert">{error}</p>}<form className="chat-composer" onSubmit={send}><Button type="button" variant="ghost" size="icon" disabled={busy} onClick={dictate} aria-label="Nhập tin nhắn bằng giọng nói"><Mic size={20} className={listening ? "orange-text" : ""}/></Button><textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message in English…" aria-label="Tin nhắn gửi AI Tutor" rows={1} maxLength={2000} onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
            }
        }}/><Button type="submit" size="icon" disabled={!message.trim() || busy || !config?.ai} aria-label="Gửi tin nhắn"><Send size={18}/></Button></form><p className="chat-disclaimer">AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.</p></Card></div></>;
}
function ArrowIcon() {
    return <Send size={13}/>;
}
