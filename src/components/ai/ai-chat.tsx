"use client";
import { useLearningLanguage } from "@/components/learning/language-switcher";
import { learningLanguages } from "@/lib/languages";
import { useEffect, useRef, useState } from "react";
import {
  Coffee,
  Crown,
  Info,
  Loader2,
  MessageSquare,
  Mic,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { api } from "@/lib/utils";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/dashboard/dashboard";
import { AudioButton, speak } from "@/components/learning/audio-player";
import { VoiceMessageInput } from "@/components/learning/voice-message-input";
import { SpeechAssessment } from "@/components/learning/speech-assessment";
import type { TutorReply } from "@/services/ai";
type TutorMetadata = Omit<TutorReply, "reply">;
type TutorMessage = {
  id?: string;
  role: string;
  content: string;
  metadata?: TutorMetadata | null;
};
type Conversation = {
  id: string;
  title?: string | null;
  scenario: string;
  difficulty: string;
  correction: string;
  messages?: TutorMessage[];
};
type AIStatus = {
  configured: boolean;
  model: string;
  plan: "FREE" | "PREMIUM";
  usage: {
    chat: {
      used: number;
      limit: number | null;
    };
  };
};
const scenarios = [
  "Coffee Shop",
  "Airport",
  "Hotel",
  "Job Interview",
  "Restaurant",
  "Meeting",
  "Travel",
  "Shopping",
  "Making Friends",
];
export function AIChat({ voiceMode = false }: { voiceMode?: boolean }) {
  const language = useLearningLanguage();
  const { data: status, refresh: refreshStatus } =
    useData<AIStatus>("/ai/status");
  const { data: history, refresh: refreshHistory } =
    useData<Conversation[]>("/ai");
  const [scenario, setScenario] = useState("Coffee Shop");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [correction, setCorrection] = useState("important");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const bottom = useRef<HTMLDivElement | null>(null);
  const recognition = useRef<SpeechRecognition | null>(null);
  const chatRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);
  useEffect(() => () => { chatRequest.current?.abort(); recognition.current?.abort(); window.speechSynthesis?.cancel(); }, []);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy || voiceActive || !status?.configured) return;
    setBusy(true);
    setError("");
    setMessage("");
    setMessages((current) => [...current, { role: "user", content: text }]);
    const controller = new AbortController(); chatRequest.current = controller;
    try {
      const result = await api<{
        conversationId: string;
        message: TutorMessage;
      }>("/ai/chat", {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          conversationId,
          scenario,
          difficulty,
          correction,
        }),
      });
      if (controller.signal.aborted) return;
      setMessages((current) => [...current, result.message]);
      setConversationId(result.conversationId);
      if (autoSpeak) speak(result.message.content, learningLanguages[language].speech);
      refreshHistory();
      refreshStatus();
    } catch (caught) {
      if (controller.signal.aborted) return;
      setMessages((current) => current.slice(0, -1));
      setMessage(text);
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function openConversation(id: string) {
    try {
      const conversation = await api<Conversation>(`/ai/${id}`);
      setConversationId(id);
      setScenario(conversation.scenario);
      setDifficulty(conversation.difficulty);
      setCorrection(conversation.correction);
      setMessages(conversation.messages || []);
      setError("");
    } catch (caught) {
      toast.error((caught as Error).message);
    }
  }
  async function removeConversation(id: string) {
    if (
      !window.confirm(
        "Xóa cuộc trò chuyện này? Nội dung đã xóa không thể khôi phục.",
      )
    )
      return;
    try {
      await api(`/ai/${id}`, { method: "DELETE" });
      if (conversationId === id) newChat();
      refreshHistory();
      toast.success("Đã xóa cuộc trò chuyện");
    } catch (caught) {
      toast.error((caught as Error).message);
    }
  }
  function newChat() {
    recognition.current?.abort(); window.speechSynthesis?.cancel();
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
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      toast.error("Trình duyệt chưa hỗ trợ nhập bằng giọng nói.");
      return;
    }
    const instance = new Recognition();
    recognition.current = instance;
    instance.lang = learningLanguages[language].speech;
    instance.continuous = false;
    instance.interimResults = false;
    instance.onresult = (event) =>
      setMessage((current) =>
        `${current} ${event.results[0][0].transcript}`.trim(),
      );
    instance.onend = () => setListening(false);
    instance.onerror = () => {
      setListening(false);
      toast.error("Không thể nhận dạng giọng nói. Hãy thử nhập văn bản.");
    };
    instance.start();
    setListening(true);
  }
  const quota = status?.usage.chat;
  const quotaText =
    status?.plan === "PREMIUM"
      ? "Premium · không giới hạn lượt học"
      : quota
        ? `${quota.used}/${quota.limit} lượt hôm nay`
        : "Đang tải hạn mức";
  return (
    <>
      <PageHeading
        title={voiceMode ? "Nói chuyện theo tình huống" : "Một cuộc trò chuyện. Thêm tự tin."}
        description={`Luyện giao tiếp theo tình huống cùng giáo viên ${language === "zh" ? "tiếng Trung" : "tiếng Anh"} AI.`}
      >
        <Badge>
          <Sparkles size={12} /> AI Tutor
        </Badge>
      </PageHeading>
      <div className="ai-workspace">
        <aside className="card ai-context">
          <Button
            variant="outline"
            className="w-full"
            onClick={newChat}
            disabled={busy || voiceActive}
          >
            <Plus size={16} /> Cuộc trò chuyện mới
          </Button>
          <div className="field mt-4">
            <label htmlFor="scenario">Tình huống</label>
            <select
              id="scenario"
              value={scenario}
              disabled={Boolean(conversationId) || busy || voiceActive}
              onChange={(event) => setScenario(event.target.value)}
            >
              {scenarios.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="difficulty">Độ khó hội thoại</label>
            <select
              id="difficulty"
              value={difficulty}
              disabled={Boolean(conversationId) || busy || voiceActive}
              onChange={(event) => setDifficulty(event.target.value)}
            >
              {["Beginner", "Intermediate", "Advanced"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="correction">Cách sửa lỗi</label>
            <select
              id="correction"
              value={correction}
              disabled={Boolean(conversationId) || busy || voiceActive}
              onChange={(event) => setCorrection(event.target.value)}
            >
              <option value="none">Không ngắt để sửa</option>
              <option value="important">Chỉ sửa lỗi quan trọng</option>
              <option value="all">Sửa mọi lỗi đáng chú ý</option>
            </select>
          </div>
          <div className="ai-quota">
            <span>
              {status?.plan === "PREMIUM" ? (
                <Crown size={14} />
              ) : (
                <Sparkles size={14} />
              )}{" "}
              {quotaText}
            </span>
            <small>{status?.model || "Đang đọc cấu hình model"}</small>
          </div>
          <hr className="divider" />
          <h4>Trò chuyện gần đây</h4>
          <div className="conversation-history">
            {history?.length ? (
              history.map((item) => (
                <div
                  className={`conversation-item ${item.id === conversationId ? "active" : ""}`}
                  key={item.id}
                >
                  <button
                    onClick={() => openConversation(item.id)}
                    disabled={busy || voiceActive}
                  >
                    <MessageSquare size={14} />
                    <span>
                      {item.title || item.scenario}
                      <small>{item.scenario}</small>
                    </span>
                  </button>
                  <button
                    aria-label={`Xóa ${item.title || item.scenario}`}
                    onClick={() => removeConversation(item.id)}
                    disabled={busy || voiceActive}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            ) : (
              <p>Cuộc trò chuyện của bạn sẽ được lưu ở đây.</p>
            )}
          </div>
        </aside>
        <Card className={`chat-surface ${voiceMode ? "voice-chat-surface" : ""}`}>
          <div className="chat-header">
            <span className="icon-box purple">
              <Sparkles size={22} />
            </span>
            <div>
              <h3>EnglishMaster AI</h3>
              <p>
                {scenario} · {difficulty}
              </p>
            </div>
            <Badge className={status?.configured ? "green" : "neutral"}>
              {status?.configured ? "Sẵn sàng trò chuyện" : "Chưa kết nối AI"}
            </Badge>
          </div>
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <span className="icon-box purple">
                  <Coffee size={33} />
                </span>
                <h2>{language === "zh" ? "我们一起练习中文吧！" : `Let’s talk about ${scenario.toLowerCase()}.`}</h2>
                <p>
                  Hãy bắt đầu bằng một lời chào. AI sẽ điều chỉnh câu trả lời
                  {language === "zh" ? "bằng chữ Hán giản thể, kèm Pinyin và giải thích tiếng Việt." : "theo trình độ CEFR của bạn."}
                </p>
                <div className="starter-prompts">
                  {(language === "zh" ? ["你好！我们可以练习中文吗？", "请帮我介绍自己。", "我想学习日常对话。"] : [
                    "Hi! Can we practice a conversation?",
                    "Could you help me introduce myself?",
                    "I go to school yesterday. Is that correct?",
                  ]).map((text) => (
                    <button key={text} onClick={() => setMessage(text)}>
                      {text}
                      <Send size={13} />
                    </button>
                  ))}
                </div>
                {status && !status.configured && (
                  <div className="notice">
                    <Info size={17} />
                    <span>
                      Chưa có khóa Groq. Thêm <code>GROQ_API_KEY</code> vào{" "}
                      <code>.env</code> và khởi động lại server.
                    </span>
                  </div>
                )}
              </div>
            )}
            {messages.map((item, index) => (
              <TutorMessageView
                key={item.id || `${item.role}-${index}`}
                message={item}
                voiceMode={voiceMode}
                locale={learningLanguages[language].speech}
                disabled={voiceActive || busy}
              />
            ))}
            {busy && (
              <div className="chat-thinking">
                <Sparkles size={16} />
                <span>Đang chuẩn bị phản hồi phù hợp với bạn</span>
                <Loader2 size={15} className="spin" />
              </div>
            )}
            <div ref={bottom} />
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {voiceMode && <>
            <label className="voice-autoplay"><input type="checkbox" checked={autoSpeak} onChange={(event) => { setAutoSpeak(event.target.checked); if (!event.target.checked) window.speechSynthesis?.cancel(); }} /> AI tự đọc câu trả lời</label>
            <VoiceMessageInput locale={learningLanguages[language].speech} disabled={busy || !status?.configured} onActive={setVoiceActive} onUse={setMessage} />
          </>}
          <form className="chat-composer" onSubmit={send}>
            {!voiceMode &&
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={busy || !status?.configured}
              onClick={dictate}
              aria-label={
                listening ? "Dừng nhập bằng giọng nói" : "Nhập bằng giọng nói"
              }
            >
              <Mic size={20} className={listening ? "orange-text" : ""} />
            </Button>}
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                status?.configured
                  ? language === "zh" ? "Nhập tiếng Trung hoặc dùng micro…" : "Type your message in English…"
                  : "Cấu hình Groq API key để bắt đầu…"
              }
              aria-label="Tin nhắn gửi AI Tutor"
              rows={1}
              maxLength={2000}
              disabled={busy || voiceActive || !status?.configured}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || busy || voiceActive || !status?.configured}
              aria-label="Gửi tin nhắn"
            >
              <Send size={18} />
            </Button>
          </form>
          <p className="chat-disclaimer">
            AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
          </p>
        </Card>
      </div>
    </>
  );
}
function TutorMessageView({ message, voiceMode, locale, disabled }: { message: TutorMessage; voiceMode?: boolean; locale: string; disabled: boolean }) {
  const feedback = message.metadata;
  const spoken = `${message.content}${feedback?.followUp ? `. ${feedback.followUp}` : ""}`;
  const practice = (feedback?.correction?.corrected || message.content.match(/[^.!?。！？]+[.!?。！？]?/u)?.[0] || "").trim();
  return (
    <div className={`chat-message ${message.role}`}>
      <span className="chat-avatar">
        {message.role === "assistant" ? <Sparkles size={18} /> : "Bạn"}
      </span>
      <div>
        <div className="message-content">{message.content}</div>
        {message.role === "assistant" && feedback && (
          <div className="tutor-feedback">
            {feedback.correction && (
              <div className="correction-card">
                <span>Sửa câu nhẹ nhàng</span>
                <del>{feedback.correction.original}</del>
                <strong>{feedback.correction.corrected}</strong>
                <p>{feedback.correction.explanation}</p>
                <small>
                  Cách nói tự nhiên: {feedback.correction.naturalAlternative}
                </small>
              </div>
            )}
            {feedback.vocabulary.length > 0 && (
              <div className="tutor-vocabulary">
                <span>Cụm từ hữu ích</span>
                {feedback.vocabulary.map((item) => (
                  <p key={`${item.phrase}-${item.meaning}`}>
                    <strong>{item.phrase}</strong> · {item.meaning}
                  </p>
                ))}
              </div>
            )}
            <p className="tutor-follow-up">{feedback.followUp}</p>
          </div>
        )}
        {message.role === "assistant" && (
          <>
            {!disabled && <AudioButton text={spoken} lang={locale} label="Nghe phản hồi" />}
            {voiceMode && practice.length <= 500 && <SpeechAssessment text={practice} locale={locale} disabled={disabled} />}
          </>
        )}
      </div>
    </div>
  );
}
