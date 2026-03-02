import React from 'react';
import { motion } from 'motion/react';
import { User, Calendar, Zap, Info } from 'lucide-react';
import { UnifiedSajuResult } from '../services/geminiService';

interface Props {
  data?: UnifiedSajuResult;
}

const defaultData: UnifiedSajuResult = {
  session_id: "default",
  request_id: "default",
  profile: {
    name: "이주현",
    birth: "1993-03-22",
    calendar: "solar",
    time: "13:00"
  },
  pillar: {
    hour: "병오",
    day: "임인",
    month: "을묘",
    year: "계유"
  },
  elements: {
    wood: 3,
    fire: 2,
    earth: 0,
    metal: 1,
    water: 2,
    basis: "8char"
  },
  tags: ["#상관강함", "#이동성높음", "#재성흐름"],
  sinsal: ["년살", "장성살", "역마살", "문창귀인"],
  summary: {
    tone: "entp_shaman_female_30s",
    one_liner: "당신은 생각보다 차갑다. 근데 그게 문제는 아니야.",
    core_points: ["사람이 아니라 상황을 계산하는 타입", "방향으로 움직이는 에너지가 강함"]
  },
  chat_seed_questions: ["내년 연애운은 어때요?", "지금 이직해도 될까요?"]
};

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

export default function SajuSummaryHeader({ data = defaultData }: Props) {
  const kpis = [
    { label: '일간', value: data.pillar.day.substring(0, 1) + '수' }, // Simplified for UI
    { label: '톤', value: "ENTP 무당" },
    { label: '세션', value: data.session_id.substring(0, 4) },
    { label: '요청', value: data.request_id.substring(0, 4) },
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
                <h2 className="text-lg md:text-xl font-bold text-white">{data.profile.name || '사주 원국'}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-sub">
                  {data.profile.calendar === 'solar' ? '陽' : '陰'}
                </span>
              </div>
              <div className="flex flex-col text-[11px] text-text-sub gap-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {data.profile.birth} {data.profile.time}
                </div>
                <div className="flex items-center gap-1 text-neon-primary font-bold">
                  <Zap className="w-3 h-3" /> {data.pillar.day} 일주
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
                    {(data.pillar as any)[key]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row B: KPI Bar */}
        <div className="flex flex-wrap gap-3">
          {kpis.map((kpi, i) => (
            <div 
              key={i}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 min-w-[100px] flex-1 md:flex-none"
            >
              <span className="text-[10px] text-text-sub font-medium uppercase tracking-wider">{kpi.label}</span>
              <span className="text-xs font-bold text-neon-primary">{kpi.value}</span>
            </div>
          ))}
        </div>

        {/* Row C: Detailed Summary */}
        <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
          {/* Left: Element Distribution */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-text-sub uppercase tracking-widest">오행 분포</span>
              <span className="text-[10px] text-text-sub/50">{data.elements.basis === '8char' ? '8자' : '전체'} 기준</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {['wood', 'fire', 'earth', 'metal', 'water'].map((el) => {
                const count = (data.elements as any)[el];
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

          {/* Right: Tags & Shinsal */}
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-text-sub uppercase tracking-widest">특성 및 신살</span>
              <div className="flex flex-wrap gap-2">
                {data.tags.map((kw, i) => (
                  <span 
                    key={i}
                    className="text-[10px] px-2 py-1 rounded-md bg-neon-secondary/5 border border-neon-secondary/20 text-neon-secondary font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            
            {data.sinsal && data.sinsal.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.sinsal.filter(Boolean).map((item) => (
                  <span 
                    key={item} 
                    className="px-2 py-0.5 rounded-md bg-neon-primary/10 text-neon-primary text-[10px] border border-neon-primary/20 font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Data Version/Timestamp */}
        <div className="flex justify-end items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
          <Info className="w-3 h-3 text-text-sub" />
          <span className="text-[9px] text-text-sub uppercase tracking-tighter">
            Session: {data.session_id} | Request: {data.request_id}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
