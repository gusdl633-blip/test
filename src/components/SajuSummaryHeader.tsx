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
    time: "13:00",
    ilgan: "임(壬)",
    ilgan_display: "⚡ 임 일간"
  },
  badges: {
    ilgan: "임(壬)",
    strength: "신약",
    yongsin: "금",
    gisin: "화",
    core_pattern: "편인격"
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
    water: 2
  },
  sinsal: ["년살", "장성살", "역마살", "문창귀인"],
  analysis: {
    core_analysis: ["사람이 아니라 상황을 계산하는 타입", "방향으로 움직이는 에너지가 강함", "자기 중심이 확고함"],
    logic_basis: ["일간이 임수이다.", "월지에 묘목이 있어 상관격이다.", "일지에 인목이 있어 식신이 강하다."],
    good_flow: ["금운", "수운", "북쪽"],
    risk_flow: ["화운", "토운", "남쪽"],
    action_now: ["명상", "독서", "기록"],
    avoid_action: ["충동구매", "과음", "밤샘"]
  },
  summary: {
    tone: "entp_shaman_female_30s",
    one_liner: "당신은 생각보다 차갑다. 근데 그게 문제는 아니야."
  },
  extended_identity: {
    core_engine: "임수 일간의 냉철한 판단력",
    thinking_style: "ENTP 특유의 논리적 구조 파괴",
    instinct_style: "양자리의 저돌적인 실행력",
    motivation_core: "7w8의 결핍 없는 확장 욕구"
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

export default function SajuSummaryHeader({ data }: Props) {
  // ✅ deep merge: 부분 data가 와도 항상 UI는 완전한 고정값을 보장
  const safeData: UnifiedSajuResult = {
    ...defaultData,
    ...(data ?? {}),
    profile: { ...defaultData.profile, ...(data?.profile ?? {}) },
    badges: { ...defaultData.badges, ...(data?.badges ?? {}) },
    pillar: { ...defaultData.pillar, ...(data?.pillar ?? {}) },
    elements: { ...defaultData.elements, ...(data?.elements ?? {}) },
    analysis: { ...defaultData.analysis, ...(data?.analysis ?? {}) },
    summary: { ...defaultData.summary, ...(data?.summary ?? {}) },
    extended_identity: { ...defaultData.extended_identity, ...(data?.extended_identity ?? {}) },
    sinsal: (data?.sinsal && data.sinsal.filter(Boolean).length > 0) ? data.sinsal : defaultData.sinsal,
    chat_seed_questions: (data?.chat_seed_questions && data.chat_seed_questions.filter(Boolean).length > 0) ? data.chat_seed_questions : defaultData.chat_seed_questions,
  };

  const badges = [
    { label: '일간', value: safeData.badges.ilgan },
    { label: '강약', value: safeData.badges.strength },
    { label: '용신', value: safeData.badges.yongsin },
    { label: '기신', value: safeData.badges.gisin },
    { label: '핵심격', value: safeData.badges.core_pattern },
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
