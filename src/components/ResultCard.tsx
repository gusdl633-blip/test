import React, { useEffect, useRef } from 'react';
import type { SajuProfile, UnifiedSajuResult } from '../services/geminiService';
import { motion } from 'motion/react';
import {
  Sparkles,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import NeonCard from './ui/NeonCard';
import GlowButton from './ui/GlowButton';

type Category = { titleKr?: string; titleEn?: string } | null;

interface Props {
  profile: SajuProfile;
  summary: UnifiedSajuResult | null;
  reading: UnifiedSajuResult | null;
  category: Category;
  isLoading: boolean;
  onAskDeeper: (question?: string) => void;
}

export default function ResultCard({
  profile,
  summary: _summary,
  reading,
  category,
  isLoading,
  onAskDeeper,
}: Props) {
  const didLogRef = useRef(false);

  const categoryLabel = category?.titleKr || category?.titleEn || '';
  const onConsult = onAskDeeper;

  useEffect(() => {
    if (didLogRef.current) return;
    didLogRef.current = true;

    const coreAnalysisLen =
      reading?.analysis?.core_analysis?.filter(Boolean).length ?? 0;

    console.log('[SAJU][ResultCard props]', {
      isLoading,
      categoryLabel,
      hasReading: !!reading,
      one_liner: reading?.summary?.one_liner,
      coreAnalysisLen,
      extended_identity: reading?.extended_identity,
      human_type_card: reading?.human_type_card,
      profile: {
        birthDate: profile.birthDate,
        birthTime: profile.birthTime,
        calendarType: profile.calendarType,
        gender: profile.gender,
      },
    });
  }, [categoryLabel, isLoading, profile, reading]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 max-w-3xl mx-auto pb-20"
      >
        <NeonCard className="space-y-4" glowColor="secondary">
          <div className="text-white font-semibold">분석중...</div>
          <div className="text-sm text-text-sub">
            잠시만 기다려. 결과를 정리하고 있다.
          </div>
        </NeonCard>
      </motion.div>
    );
  }

  if (!reading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 max-w-3xl mx-auto pb-20"
      >
        <NeonCard className="space-y-4" glowColor="secondary">
          <div className="text-white font-semibold">데이터 없음</div>
          <div className="text-sm text-text-sub">
            분석 결과 데이터를 받지 못했다. 잠시 후 다시 시도해라.
          </div>
        </NeonCard>
      </motion.div>
    );
  }

  const summary = reading?.summary ?? { one_liner: '' };
  const analysis = reading?.analysis ?? {
    core_analysis: [],
    logic_basis: [],
    good_flow: [],
    risk_flow: [],
    action_now: [],
    avoid_action: [],
  };

  const extendedIdentity = reading?.extended_identity ?? {
    human_type: '',
    core_engine: '',
    thinking_style: '',
    instinct_style: '',
    motivation_core: '',
    weakness_pattern: '',
    relationship_pattern: '',
    compatibility_type: '',
  };

  const humanTypeCard = reading?.human_type_card ?? {
    title: '',
    strengths: [],
    weaknesses: [],
    share_summary: '',
  };

  const chatSeedQuestions = Array.isArray(reading?.chat_seed_questions)
    ? reading.chat_seed_questions
    : [];

  const coreAnalysis = Array.isArray(analysis?.core_analysis) ? analysis.core_analysis : [];
  const logicBasis = Array.isArray(analysis?.logic_basis) ? analysis.logic_basis : [];
  const goodFlow = Array.isArray(analysis?.good_flow) ? analysis.good_flow : [];
  const riskFlow = Array.isArray(analysis?.risk_flow) ? analysis.risk_flow : [];
  const actionNow = Array.isArray(analysis?.action_now) ? analysis.action_now : [];
  const avoidAction = Array.isArray(analysis?.avoid_action) ? analysis.avoid_action : [];
  const strengths = Array.isArray(humanTypeCard?.strengths) ? humanTypeCard.strengths : [];
  const weaknesses = Array.isArray(humanTypeCard?.weaknesses) ? humanTypeCard.weaknesses : [];

  const hasAnyCore =
    coreAnalysis.filter(Boolean).length > 0 ||
    Boolean(extendedIdentity?.core_engine) ||
    Boolean(humanTypeCard?.title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-3xl mx-auto pb-20"
    >
      {!hasAnyCore && (
        <NeonCard className="space-y-3" glowColor="secondary">
          <div className="text-white font-semibold">분석 데이터가 비어 있다</div>
          <div className="text-sm text-text-sub">
            응답은 받았지만, 핵심 카드에 들어갈 필드가 비어 있다. 콘솔 로그의
            <span className="text-white/80"> [SAJU] mapped reading</span> /
            <span className="text-white/80"> [SAJU][ResultCard props]</span> 를 확인해라.
          </div>
        </NeonCard>
      )}

      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center px-4 py-1.5 bg-neon-primary/10 border border-neon-primary/30 text-neon-primary text-xs font-bold rounded-full tracking-widest uppercase"
        >
          <Sparkles className="w-3 h-3 mr-2" />
          {categoryLabel || ''}
        </motion.div>

        <h2 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-white">
          <span className="text-accent">"</span>
          {summary?.one_liner || '분석 결과를 정리 중이다.'}
          <span className="text-accent">"</span>
        </h2>
      </div>

      <NeonCard className="space-y-10" glowColor="secondary">
        {/* Section 1: 핵심 분석 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-text-sub uppercase tracking-[0.2em] flex items-center">
              <div className="w-8 h-[1px] bg-neon-secondary/50 mr-3" />
              핵심 분석
            </h3>

            <div className="px-3 py-1 bg-neon-primary/10 border border-neon-primary/30 rounded-lg text-[10px] font-bold text-neon-primary uppercase tracking-wider">
              {extendedIdentity?.human_type || '분석 중'}
            </div>
          </div>

          <div className="grid gap-4">
            {coreAnalysis.length > 0 ? (
              coreAnalysis.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-white/5 border border-white/5 rounded-2xl text-lg text-text-main leading-relaxed"
                >
                  <span className="text-neon-secondary mr-3 font-mono">0{i + 1}</span>
                  {item || ''}
                </motion.div>
              ))
            ) : (
              <div className="p-6 bg-white/5 border border-white/5 rounded-2xl text-text-sub">
                핵심 분석 데이터를 불러오는 중이다.
              </div>
            )}
          </div>
        </section>

        {/* Section: 인간 구조 분석 */}
        <section className="pt-10 border-t border-white/5">
          <h3 className="text-xs font-bold text-text-sub uppercase tracking-[0.2em] mb-6 flex items-center">
            <div className="w-8 h-[1px] bg-neon-secondary/50 mr-3" />
            인간 구조 분석
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-text-sub/50 uppercase tracking-wider mb-1">
                Core Engine (사주)
              </div>
              <div className="text-sm text-text-main font-medium">
                {extendedIdentity?.core_engine || '분석 중'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-text-sub/50 uppercase tracking-wider mb-1">
                Thinking Algorithm (MBTI)
              </div>
              <div className="text-sm text-text-main font-medium">
                {extendedIdentity?.thinking_style || '분석 중'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-text-sub/50 uppercase tracking-wider mb-1">
                Instinct Temperament (별자리)
              </div>
              <div className="text-sm text-text-main font-medium">
                {extendedIdentity?.instinct_style || '분석 중'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-text-sub/50 uppercase tracking-wider mb-1">
                Motivation Core (애니어그램)
              </div>
              <div className="text-sm text-text-main font-medium">
                {extendedIdentity?.motivation_core || '분석 중'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-text-sub/50 uppercase tracking-wider mb-1">
                Weakness Pattern (구조적 결함)
              </div>
              <div className="text-sm text-text-main font-medium">
                {extendedIdentity?.weakness_pattern || '분석 중'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-text-sub/50 uppercase tracking-wider mb-1">
                Relationship Pattern (관계 방식)
              </div>
              <div className="text-sm text-text-main font-medium">
                {extendedIdentity?.relationship_pattern || '분석 중'}
              </div>
            </div>

            {extendedIdentity?.compatibility_type ? (
              <div className="p-4 rounded-xl bg-neon-primary/5 border border-neon-primary/20 sm:col-span-2">
                <div className="text-[10px] text-neon-primary uppercase tracking-wider mb-1">
                  Compatibility Type (궁합 유형)
                </div>
                <div className="text-sm text-text-main font-bold">
                  {extendedIdentity.compatibility_type}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Section: 인간 유형 카드 */}
        <section className="pt-10 border-t border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-text-sub uppercase tracking-[0.2em] flex items-center">
              <div className="w-8 h-[1px] bg-neon-secondary/50 mr-3" />
              당신의 인간 유형
            </h3>
          </div>

          <div className="bg-gradient-to-br from-neon-secondary/10 to-neon-primary/10 border border-white/10 rounded-3xl p-8 space-y-8">
            <div className="text-center space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                {humanTypeCard?.title || '인간 유형 분석 중'}
              </div>

              <p className="text-sm text-text-sub/70 italic">
                "{humanTypeCard?.share_summary || ''}"
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-neon-primary uppercase tracking-widest flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> 강점
                </h4>

                <ul className="space-y-3">
                  {strengths.length > 0 ? (
                    strengths.map((s, i) => (
                      <li key={i} className="flex items-start text-sm text-text-main/90">
                        <span className="text-neon-primary mr-2">•</span>
                        {s}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-text-sub">강점 분석 중</li>
                  )}
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-accent uppercase tracking-widest flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" /> 약점
                </h4>

                <ul className="space-y-3">
                  {weaknesses.length > 0 ? (
                    weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start text-sm text-text-main/90">
                        <span className="text-accent mr-2">•</span>
                        {w}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-text-sub">약점 분석 중</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: 핵심 근거 */}
        <section className="pt-10 border-t border-white/5">
          <h3 className="text-xs font-bold text-text-sub uppercase tracking-[0.2em] mb-6 flex items-center">
            <div className="w-8 h-[1px] bg-neon-secondary/50 mr-3" />
            핵심 근거
          </h3>

          <div className="grid gap-3">
            {logicBasis.length > 0 ? (
              logicBasis.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-text-sub/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-secondary/40 mt-1.5 shrink-0" />
                  {item}
                </div>
              ))
            ) : (
              <div className="text-sm text-text-sub">핵심 근거를 정리 중이다.</div>
            )}
          </div>
        </section>

        {/* Section 3: 좋은 흐름 / 위험 신호 */}
        <div className="grid md:grid-cols-2 gap-6 pt-10 border-t border-white/5">
          <section className="bg-neon-primary/5 p-6 rounded-2xl border border-neon-primary/20">
            <h3 className="flex items-center text-sm font-bold text-neon-primary mb-4">
              <CheckCircle2 className="w-4 h-4 mr-2" /> 좋은 흐름
            </h3>

            <ul className="space-y-3 text-sm text-text-main/90">
              {goodFlow.length > 0 ? (
                goodFlow.map((item, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-neon-primary mr-2">•</span>
                    {item}
                  </li>
                ))
              ) : (
                <li className="text-text-sub">좋은 흐름 분석 중</li>
              )}
            </ul>
          </section>

          <section className="bg-accent/5 p-6 rounded-2xl border border-accent/20">
            <h3 className="flex items-center text-sm font-bold text-accent mb-4">
              <AlertTriangle className="w-4 h-4 mr-2" /> 위험 신호
            </h3>

            <ul className="space-y-3 text-sm text-text-main/90">
              {riskFlow.length > 0 ? (
                riskFlow.map((item, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    {item}
                  </li>
                ))
              ) : (
                <li className="text-text-sub">위험 신호 분석 중</li>
              )}
            </ul>
          </section>
        </div>

        {/* Section 4: 지금 당장 액션 / 피해야 할 행동 */}
        <div className="grid md:grid-cols-2 gap-10 pt-10 border-t border-white/5">
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-neon-primary/80 tracking-wider">지금 당장 액션</h3>

            <ul className="space-y-3">
              {actionNow.length > 0 ? (
                actionNow.map((item, i) => (
                  <li key={i} className="flex items-start text-sm text-text-main/80">
                    <ArrowRight className="w-4 h-4 mr-3 mt-0.5 text-neon-primary" />
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-text-sub">실행 항목 분석 중</li>
              )}
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-accent/80 tracking-wider">피해야 할 행동</h3>

            <ul className="space-y-3">
              {avoidAction.length > 0 ? (
                avoidAction.map((item, i) => (
                  <li key={i} className="flex items-start text-sm text-text-main/80">
                    <XCircle className="w-4 h-4 mr-3 mt-0.5 text-accent" />
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-text-sub">주의 행동 분석 중</li>
              )}
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
              '연애운 더 깊게',
              '이직 타이밍',
              '상대 성향(생일 필요)',
              '돈 관리법',
              '이번달 조심할 행동',
              '딱 한가지 조언만',
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
            {chatSeedQuestions.length > 0 ? (
              chatSeedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onConsult(q)}
                  className="relative z-10 text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl transition-all text-left text-text-main/70 hover:text-neon-secondary hover:border-neon-secondary/30"
                >
                  {q}
                </button>
              ))
            ) : (
              <div className="text-sm text-text-sub">추천 질문을 준비 중이다.</div>
            )}
          </div>

          <GlowButton onClick={onConsult} variant="secondary" className="w-full z-10 relative" size="lg">
            1:1 상담 시작하기
          </GlowButton>
        </div>
      </NeonCard>
    </motion.div>
  );
}
