import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import type { SajuProfile, UnifiedSajuResult } from "../services/geminiService";
import { chatWithSaju } from "../services/geminiService";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  message: string;
};

interface ChatInterfaceProps {
  profile: SajuProfile;
  sessionId: string;
  initialMessage?: string;
  summary?: UnifiedSajuResult | null;
  reading?: UnifiedSajuResult | null;
}

const QUICK_QUESTIONS = [
  "연애운 더 깊게",
  "이직 타이밍",
  "상대 성향(생일 필요)",
  "돈 관리법",
  "이번달 조심할 행동",
  "딱 한가지 조언만",
];

export default function ChatInterface({
  profile,
  sessionId,
  initialMessage = "",
  summary = null,
  reading = null,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialMessage);
  const [isLoading, setIsLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const didAutoSendRef = useRef(false);

  const seedQuestions = useMemo(() => {
    const fromSummary = summary?.chat_seed_questions ?? [];
    const fromReading = reading?.chat_seed_questions ?? [];
    return [...fromReading, ...fromSummary].filter(Boolean).slice(0, 6);
  }, [summary, reading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    setInput(initialMessage || "");
    if (initialMessage?.trim()) {
      didAutoSendRef.current = false;
    }
  }, [initialMessage]);

  useEffect(() => {
    if (!initialMessage?.trim()) return;
    if (didAutoSendRef.current) return;
    if (isLoading) return;

    didAutoSendRef.current = true;
    void handleSend(initialMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, isLoading]);

  const handleQuickQuestion = async (question: string) => {
    if (isLoading) return;
    setInput(question);
    await handleSend(question);
  };

  const handleSend = async (forcedMessage?: string) => {
    const text = (forcedMessage ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      message: text,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const requestId = Math.random().toString(36).substring(2, 10);

      console.log("[SAJU][chat] context before chatWithSaju:", {
        sessionId,
        requestId,
        hasSummary: !!summary,
        hasReading: !!reading,
        profile: {
          birthDate: profile.birthDate,
          birthTime: profile.birthTime,
          calendarType: profile.calendarType,
          gender: profile.gender,
          mbti: profile.mbti,
          zodiac_korean: profile.zodiac_korean,
          enneagram: profile.enneagram,
        },
      });

      const result = await chatWithSaju(
        profile,
        summary,
        reading,
        text,
        sessionId,
        requestId
      );

      const assistantText =
        result?.summary?.one_liner ||
        result?.analysis?.core_analysis?.[0] ||
        result?.analysis?.logic_basis?.[0] ||
        "지금 답변을 정리 중이다.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          message: assistantText,
        },
      ]);
    } catch (error) {
      console.error("chatWithSaju failed:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          message: "지금 상담 엔진 연결이 불안정하다. 잠깐 뒤 다시와.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSend();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="rounded-[28px] border border-white/10 bg-black/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-neon-secondary" />
            <h2 className="text-xl font-bold text-white">내 사주 요약</h2>
          </div>
        </div>

        <div className="min-h-[520px] px-6 py-8 space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="text-sm text-text-sub/70">
              궁금한 걸 바로 물어봐. 애매하게 말해도 되지만, 질문이 구체적일수록 답도 날카로워진다.
            </div>
          )}

          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={`${msg.role}-${index}-${msg.message.slice(0, 20)}`}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[82%] rounded-[28px] px-6 py-5 text-[15px] leading-8 whitespace-pre-wrap break-words",
                    isUser
                      ? "bg-neon-primary/10 border border-neon-primary/35 text-neon-primary"
                      : "bg-white/5 border border-white/12 text-white",
                  ].join(" ")}
                >
                  {msg.message}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[82%] rounded-[28px] px-6 py-5 bg-white/5 border border-white/12 text-white">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                  <span className="inline-block w-2 h-2 rounded-full bg-white/60 animate-pulse [animation-delay:150ms]" />
                  <span className="inline-block w-2 h-2 rounded-full bg-white/60 animate-pulse [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/10 px-6 py-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(seedQuestions.length > 0 ? seedQuestions : QUICK_QUESTIONS).map((q, i) => (
              <button
                key={`${q}-${i}`}
                type="button"
                onClick={() => void handleQuickQuestion(q)}
                disabled={isLoading}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-all text-text-main/80 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="상담 내용을 입력하세요..."
              disabled={isLoading}
              className="flex-1 h-14 rounded-[18px] bg-white/5 border border-white/10 px-5 text-white placeholder:text-text-sub/45 outline-none focus:border-neon-secondary/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-14 px-6 rounded-[18px] bg-neon-secondary text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-4 h-4 mr-2" />
              전송
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
