import React, { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import type { SajuProfile, UnifiedSajuResult } from "../services/geminiService";
import { chatWithSaju } from "../services/geminiService";

type ChatMessage = {
  role: "user" | "assistant";
  message: string;
};

interface Props {
  profile: SajuProfile;
  sessionId: string;
  initialMessage?: string;
  summary?: UnifiedSajuResult | null;
  reading?: UnifiedSajuResult | null;
}

export default function ChatInterface({
  profile,
  sessionId,
  initialMessage = "",
  summary = null,
  reading = null,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialMessage);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setInput(initialMessage || "");
  }, [initialMessage]);

  useEffect(() => {
    if (!initialMessage?.trim()) return;
    if (messages.length > 0) return;

    void handleSend(initialMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
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
      const requestId = Math.random().toString(36).substring(7);

      const result = await chatWithSaju(profile, history, input, sessionId, requestId);

      const assistantText =
        result?.summary?.one_liner ||
        result?.analysis?.core_analysis?.[0] ||
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
          message: "지금 상담 엔진 연결이 불안정하다. 잠깐 뒤 다시 쳐.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
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

        <div className="min-h-[520px] px-8 py-8 space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  msg.role === "user"
                    ? "max-w-[70%] px-6 py-5 rounded-[24px] border border-neon-primary/40 bg-neon-primary/10 text-neon-primary"
                    : "max-w-[70%] px-6 py-5 rounded-[24px] border border-neon-secondary/20 bg-white/5 text-white"
                }
              >
                {msg.message}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[70%] px-6 py-5 rounded-[24px] border border-neon-secondary/20 bg-white/5 text-text-sub">
                답변 정리 중이다...
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-6 py-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              "연애운 더 깊게",
              "이직 타이밍",
              "상대 성향(생일 필요)",
              "돈 관리법",
              "이번달 조심할 행동",
              "딱 한가지 조언만",
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => void handleSend(q)}
                className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-text-sub hover:text-white hover:border-neon-secondary/40 transition"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSend();
                }
              }}
              placeholder="상담 내용을 입력하세요..."
              className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-white outline-none"
            />
            <button
              onClick={() => void handleSend()}
              className="w-16 h-14 rounded-2xl bg-neon-secondary text-black font-bold"
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
