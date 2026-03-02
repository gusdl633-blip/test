import React from 'react';
import { UnifiedSajuResult } from '../services/geminiService';
import { motion } from 'motion/react';
import { Sparkles, Info, MessageSquare } from 'lucide-react';
import NeonCard from './ui/NeonCard';
import GlowButton from './ui/GlowButton';

interface Props {
  reading: UnifiedSajuResult;
  categoryLabel: string;
  onConsult: () => void;
}

export default function ResultCard({ reading, categoryLabel, onConsult }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-3xl mx-auto pb-20"
    >
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center px-4 py-1.5 bg-neon-primary/10 border border-neon-primary/30 text-neon-primary text-xs font-bold rounded-full tracking-widest uppercase"
        >
          <Sparkles className="w-3 h-3 mr-2" />
          {categoryLabel}
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-white">
          <span className="text-accent">"</span>{reading.summary.one_liner}<span className="text-accent">"</span>
        </h2>
      </div>

      <NeonCard className="space-y-10" glowColor="secondary">
        <section>
          <h3 className="text-xs font-bold text-text-sub uppercase tracking-[0.2em] mb-6 flex items-center">
            <div className="w-8 h-[1px] bg-neon-secondary/50 mr-3" />
            핵심 분석
          </h3>
          <div className="grid gap-4">
            {reading.summary.core_points.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-white/5 border border-white/5 rounded-2xl text-lg text-text-main leading-relaxed"
              >
                <span className="text-neon-secondary mr-3 font-mono">0{i + 1}</span>
                {item}
              </motion.div>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-text-sub uppercase tracking-widest">분석 태그</span>
            <div className="flex flex-wrap gap-2">
              {reading.tags.map((tag, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-text-sub">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-text-sub uppercase tracking-widest">신살/특성</span>
            <div className="flex flex-wrap gap-2">
              {reading.sinsal.map((s, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-neon-primary/10 border border-neon-primary/20 text-neon-primary">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </NeonCard>

      <NeonCard className="bg-bg-end/80 border-neon-secondary/30" glowColor="secondary">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">더 깊은 상담이 필요하신가요?</h3>
              <p className="text-sm text-text-sub">당신의 사주를 바탕으로 1:1 맞춤 상담을 이어갈 수 있습니다.</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-neon-secondary/10 border border-neon-secondary/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-neon-secondary" />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {reading.chat_seed_questions.map((q, i) => (
              <button 
                key={i} 
                onClick={onConsult}
                className="relative z-10 text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl transition-all text-left text-text-main/70 hover:text-neon-secondary hover:border-neon-secondary/30"
              >
                {q}
              </button>
            ))}
          </div>

          <GlowButton 
            onClick={onConsult}
            variant="secondary"
            className="w-full z-10 relative"
            size="lg"
          >
            1:1 상담 시작하기
          </GlowButton>
        </div>
      </NeonCard>

      <div className="flex justify-center items-center gap-4 opacity-20">
        <div className="flex items-center gap-1.5">
          <Info className="w-3 h-3" />
          <span className="text-[9px] uppercase tracking-tighter">Session: {reading.session_id}</span>
        </div>
        <div className="w-1 h-1 bg-white/50 rounded-full" />
        <span className="text-[9px] uppercase tracking-tighter">Request: {reading.request_id}</span>
      </div>
    </motion.div>
  );
}
