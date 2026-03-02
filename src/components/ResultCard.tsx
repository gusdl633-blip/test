import React from 'react';
import { SajuReading } from '../services/geminiService';
import { motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, ArrowRight, XCircle, Sparkles } from 'lucide-react';
import NeonCard from './ui/NeonCard';
import GlowButton from './ui/GlowButton';

interface Props {
  reading: SajuReading;
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
          <span className="text-accent">"</span>{reading.conclusion}<span className="text-accent">"</span>
        </h2>
      </div>

      <NeonCard className="space-y-10" glowColor="secondary">
        <section>
          <h3 className="text-xs font-bold text-text-sub uppercase tracking-[0.2em] mb-6 flex items-center">
            <div className="w-8 h-[1px] bg-neon-secondary/50 mr-3" />
            핵심 근거
          </h3>
          <div className="grid gap-4">
            {reading.reasoning.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 bg-white/5 border border-white/5 rounded-xl text-lg text-text-main"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-neon-primary/5 p-6 rounded-2xl border border-neon-primary/20 shadow-[0_0_20px_rgba(0,255,156,0.05)]">
            <h3 className="flex items-center text-sm font-bold text-neon-primary mb-4">
              <CheckCircle2 className="w-4 h-4 mr-2" /> 좋은 흐름
            </h3>
            <ul className="space-y-3 text-sm text-text-main/90">
              {reading.goodSigns.map((item, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-neon-primary mr-2">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-accent/5 p-6 rounded-2xl border border-accent/20 shadow-[0_0_20px_rgba(255,138,61,0.05)]">
            <h3 className="flex items-center text-sm font-bold text-accent mb-4">
              <AlertTriangle className="w-4 h-4 mr-2" /> 위험 신호
            </h3>
            <ul className="space-y-3 text-sm text-text-main/90">
              {reading.badSigns.map((item, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-accent mr-2">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-neon-primary/80 tracking-wider">지금 당장 액션</h3>
            <ul className="space-y-3">
              {reading.actionsToTake.map((item, i) => (
                <li key={i} className="flex items-start text-sm text-text-main/80">
                  <ArrowRight className="w-4 h-4 mr-3 mt-0.5 text-neon-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-accent/80 tracking-wider">피해야 할 행동</h3>
            <ul className="space-y-3">
              {reading.actionsToAvoid.map((item, i) => (
                <li key={i} className="flex items-start text-sm text-text-main/80">
                  <XCircle className="w-4 h-4 mr-3 mt-0.5 text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </NeonCard>

      <NeonCard className="bg-bg-end/80 border-neon-secondary/30" glowColor="secondary">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">더 깊은 상담이 필요하신가요?</h3>
            <p className="text-sm text-text-sub">당신의 사주를 바탕으로 1:1 맞춤 상담을 이어갈 수 있습니다.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {reading.followUpQuestions.map((q, i) => (
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
    </motion.div>
  );
}
