import React, { useState, useEffect, useRef } from 'react';
import { SajuProfile, chatWithSaju } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import ChatBubble from './ui/ChatBubble';
import GlowButton from './ui/GlowButton';
import NeonCard from './ui/NeonCard';

interface Message {
  role: 'user' | 'assistant';
  message: string;
}

interface Props {
  profile: SajuProfile;
  initialMessage?: string;
}

export default function ChatInterface({ profile, initialMessage }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessage) {
      handleSend(initialMessage);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { role: 'user', message: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithSaju(profile, messages, text);
      const botMsg: Message = { role: 'assistant', message: response || '죄송합니다. 답변을 생성하지 못했습니다.' };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const chips = [
    "연애운 더 깊게",
    "이직 타이밍",
    "상대 성향(생일 필요)",
    "돈 관리법",
    "이번달 조심할 행동",
    "딱 한가지 조언만"
  ];

  return (
    <div className="flex flex-col h-[85vh] max-w-3xl mx-auto glass-panel overflow-hidden border-neon-secondary/20 shadow-[0_0_50px_rgba(91,225,255,0.05)]">
      {/* Header / Saju Summary */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-md z-10">
        <button 
          onClick={() => setShowSummary(!showSummary)}
          className="w-full p-4 flex justify-between items-center hover:bg-white/5 transition-all"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-neon-secondary" />
            <span className="font-bold text-sm tracking-widest uppercase">내 사주 요약</span>
          </div>
          {showSummary ? <ChevronUp className="w-4 h-4 text-text-sub" /> : <ChevronDown className="w-4 h-4 text-text-sub" />}
        </button>
        <AnimatePresence>
          {showSummary && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6 text-xs text-text-sub/80 space-y-2 overflow-hidden border-t border-white/5 pt-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <p><span className="text-neon-secondary/60 mr-2">성별</span> {profile.gender === 'male' ? '남성' : '여성'}</p>
                <p><span className="text-neon-secondary/60 mr-2">생일</span> {profile.birthDate} ({profile.calendarType})</p>
                <p><span className="text-neon-secondary/60 mr-2">시간</span> {profile.timeKnown ? profile.birthTime : '모름'}</p>
                <p><span className="text-neon-secondary/60 mr-2">지역</span> {profile.location || '미지정'}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-20 space-y-6">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Bot className="w-16 h-16 mx-auto text-neon-secondary opacity-30" />
            </motion.div>
            <div className="space-y-2">
              <p className="text-lg font-bold text-text-main">무엇이 궁금하신가요?</p>
              <p className="text-sm text-text-sub">당신의 사주를 바탕으로 깊이 있는 상담을 시작합니다.</p>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role}>
            {m.message}
          </ChatBubble>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-neon-secondary/20 p-4 rounded-2xl rounded-tl-none shadow-[0_0_15px_rgba(91,225,255,0.05)]">
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 bg-neon-secondary/40 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-neon-secondary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-neon-secondary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-bg-start/80 border-t border-white/10 space-y-5 backdrop-blur-xl">
        <div className="flex flex-wrap gap-2">
          {chips.map((chip, i) => (
            <button 
              key={i}
              onClick={() => handleSend(chip)}
              className="text-[10px] bg-white/5 hover:bg-neon-secondary/10 border border-white/10 hover:border-neon-secondary/30 text-text-sub hover:text-neon-secondary px-3 py-1.5 rounded-full transition-all duration-200"
            >
              {chip}
            </button>
          ))}
        </div>
        <div className="flex space-x-3">
          <input
            type="text"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main placeholder:text-text-sub/40 focus:outline-none focus:ring-2 focus:ring-neon-secondary/30 focus:border-neon-secondary/50 transition-all"
            placeholder="상담 내용을 입력하세요..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
          />
          <GlowButton 
            onClick={() => handleSend(input)}
            disabled={isLoading || !input.trim()}
            variant="secondary"
            className="!px-4"
          >
            <Send className="w-5 h-5" />
          </GlowButton>
        </div>
      </div>
    </div>
  );
}
