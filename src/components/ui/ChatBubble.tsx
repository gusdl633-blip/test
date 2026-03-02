import React from 'react';

interface Props {
  role: 'user' | 'assistant';
  children: React.ReactNode;
  key?: React.Key;
}

export default function ChatBubble({ role, children }: Props) {
  const isUser = role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
        isUser 
          ? 'bg-neon-primary/5 border border-neon-primary/30 text-neon-primary rounded-tr-none shadow-[0_0_15px_rgba(0,255,156,0.1)]' 
          : 'bg-white/5 border border-neon-secondary/30 text-text-main rounded-tl-none shadow-[0_0_15px_rgba(91,225,255,0.1)] backdrop-blur-md'
      }`}>
        {children}
      </div>
    </div>
  );
}
