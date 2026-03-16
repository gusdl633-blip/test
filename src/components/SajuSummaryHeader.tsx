import React from 'react';
import { motion } from 'motion/react';
import { User, Calendar, Zap, Info } from 'lucide-react';
import { UnifiedSajuResult } from '../services/geminiService';

interface Props {
  data?: UnifiedSajuResult;
}

const elementColors: Record<string, string> = {
  wood: 'bg-green-500/20 text-green-400 border-green-500/30',
  fire: 'bg-red-500/20 text-red-400 border-red-500/30',
  earth: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  metal: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
  water: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const elementLabels: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

const pillarLabels = [
  { key: 'hour', label: '시주' },
  { key: 'day', label: '일주' },
  { key: 'month', label: '월주' },
  { key: 'year', label: '년주' },
];

export default function SajuSummaryHeader({ data }: Props) {
  if (!data) return null;
  const safeData = data;

  const badges = [
    { label: '일간', value: safeData.badges.ilgan },
    { label: '강약', value: safeData.badges.strength },
    { label: '용신', value: safeData.badges.yongsin },
    { label: '기신', value: safeData.badges.gisin },
    { label: '핵심격', value: safeData.badges.core_pattern },
    ...(safeData.profile.mbti ? [{ label: 'MBTI', value: safeData.profile.mbti }] : []),
    ...(safeData.profile.zodiac_korean ? [{ label: '별자리', value: safeData.profile.zodiac_korean }] : []),
    ...(safeData.profile.enneagram ? [{ label: '애니어그램', value: safeData.profile.enneagram }] : []),
  ];

  return (
    <div className="sticky top-0 z-40 w-full mb-8">
      <div className="absolute inset-0 bg-bg-start/80 backdrop-blur-xl border-b border-white/10" />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-[1200px] mx-auto p-4 md:p-6 space-y-6"
      >
        {/* Row A: Profile & Pillars */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-neon-primary/20 to-neon-secondary/20 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,156,0.1)]">
              <User className="w-7 h-7 md:w-8 md:h-8 text-neon-primary" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white">{safeData.profile.name || '사주 원국'}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-sub">
                  {safeData.profile.calendar === 'solar' ? '陽' : '陰'}
                </span>
              </div>
              <div className="flex flex-col text-[11px] text-text-sub gap-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {safeData.profile.birth} {safeData.profile.time}
                </div>
                <div className="flex items-center gap-1 text-neon-primary font-bold">
                  <Zap className="w-3 h-3" /> {safeData.profile.ilgan_display}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 w-full md:w-auto">
            {pillarLabels.map(({ key, label }) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-text-sub uppercase tracking-tighter opacity-60">{label}</span>
                <div className="w-14 h-14 md:w-16 md:h-16 glass-panel flex flex-col items-center justify-center border-white/10 group hover:border-neon-secondary/30 transition-colors">
                  <span className="text-base md:text-lg font-bold text-white tracking-widest">
                    {(safeData.pillar as any)[key]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row B: Badge Bar */}
        <div className="flex flex-wrap gap-3">
          {badges.map((badge, i) => (
            <div 
              key={i}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 min-w-[100px] flex-1 md:flex-none"
            >
              <span className="text-[10px] text-text-sub font-medium uppercase tracking-wider">{badge.label}</span>
              <span className="text-xs font-bold text-neon-primary">{badge.value}</span>
            </div>
          ))}
        </div>

        {/* Row C: Detailed Summary */}
        <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
          {/* Left: Element Distribution */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-text-sub uppercase tracking-widest">오행 분포</span>
              <span className="text-[10px] text-text-sub/50">8자 기준</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {['wood', 'fire', 'earth', 'metal', 'water'].map((el) => {
                const count = (safeData.elements as any)[el];
                return (
                  <div key={el} className="space-y-1.5">
                    <div className={`h-1 rounded-full bg-white/5 overflow-hidden`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / 8) * 100}%` }}
                        className={`h-full ${elementColors[el].split(' ')[0].replace('/20', '')}`}
                      />
                    </div>
                    <div className={`px-1.5 py-1 rounded-md border text-[10px] font-bold flex items-center justify-between ${elementColors[el]}`}>
                      <span>{elementLabels[el]}</span>
                      <span>{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Shinsal */}
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-text-sub uppercase tracking-widest">특성 및 신살</span>
              <div className="flex flex-wrap gap-1.5">
                {safeData.sinsal && safeData.sinsal.filter(Boolean).map((item) => (
                  <span 
                    key={item} 
                    className="px-2 py-0.5 rounded-md bg-neon-primary/10 text-neon-primary text-[10px] border border-neon-primary/20 font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
