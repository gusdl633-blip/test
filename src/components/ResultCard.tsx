import React from 'react';
import { UnifiedSajuResult } from '../services/geminiService';
import { motion } from 'motion/react';
import { Sparkles, Info, MessageSquare, CheckCircle2, AlertTriangle, ArrowRight, XCircle } from 'lucide-react';
import NeonCard from './ui/NeonCard';
import GlowButton from './ui/GlowButton';

interface Props {
  reading: UnifiedSajuResult;
  categoryLabel: string;
  onConsult: (question?: string) => void;
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
        {/* Section 1: 핵심 분석 */}
        <section>
          <h3 className="text-xs font-bold text-text-sub uppercase tracking-[0.2em] mb-6 flex items-center">
            <div className="w-8 h-[1px] bg-neon-secondary/50 mr-3" />
            핵심 분석
          </h3>
          <div className="grid gap-4">
            {reading.analysis.core_analysis.map((item, i) => (
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

        {/* Section 2: 핵심 근거 */}
        <section className="pt-10 border-t border-white/5">
          <h3 className="text-xs font-bold text-text-sub uppercase tracking-[0.2em] mb-6 flex items-center">
            <div className="w-8 h-[1px] bg-neon-secondary/50 mr-3" />
            핵심 근거
          </h3>
          <div className="grid gap-3">
            {reading.analysis.logic_basis.map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-text-sub/80">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-secondary/40 mt-1.5 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: 좋은 흐름 / 위험 신호 */}
        <div className="grid md:grid-cols-2 gap-6 pt-10 border-t border-white/5">
          <section className="bg-neon-primary/5 p-6 rounded-2xl border border-neon-primary/20">
            <h3 className="flex items-center text-sm font-bold text-neon-primary mb-4">
              <CheckCircle2 className="w-4 h-4 mr-2" /> 좋은 흐름
            </h3>
            <ul className="space-y-3 text-sm text-text-main/90">
              {reading.analysis.good_flow.map((item, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-neon-primary mr-2">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-accent/5 p-6 rounded-2xl border border-accent/20">
            <h3 className="flex items-center text-sm font-bold text-accent mb-4">
              <AlertTriangle className="w-4 h-4 mr-2" /> 위험 신호
            </h3>
            <ul className="space-y-3 text-sm text-text-main/90">
              {reading.analysis.risk_flow.map((item, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-accent mr-2">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Section 4: 지금 당장 액션 / 피해야 할 행동 */}
        <div className="grid md:grid-cols-2 gap-10 pt-10 border-t border-white/5">
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-neon-primary/80 tracking-wider">지금 당장 액션</h3>
            <ul className="space-y-3">
              {reading.analysis.action_now.map((item, i) => (
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
              {reading.analysis.avoid_action.map((item, i) => (
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
            {[
              "연애운 더 깊게",
              "이직 타이밍",
              "상대 성향(생일 필요)",
              "돈 관리법",
              "이번달 조심할 행동",
              "딱 한가지 조언만"
            ].map((q, i) => (
              <button 
                key={`fixed-${i}`} 
                onClick={() => onConsult(q)}
                className="relative z-10 text-[10px] bg-neon-secondary/5 hover:bg-neon-secondary/10 border border-neon-secondary/20 hover:border-neon-secondary/40 px-3 py-1.5 rounded-full transition-all text-left text-neon-secondary/80 hover:text-neon-secondary"
              >
                {q}
              </button>
            ))}
          </div>
          
          <div className="h-[1px] bg-white/5 w-full my-2" />

          <div className="flex flex-wrap gap-2">
            {reading.chat_seed_questions.map((q, i) => (
              <button 
                key={i} 
                onClick={() => onConsult(q)}
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
