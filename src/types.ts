export interface SajuProfile {
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  birthTime: string;
  calendarType: 'solar' | 'lunar';
  location?: string;
  timeKnown: boolean;
  mbti?: string;
  zodiac_korean?: string;
  enneagram?: string;
}

export interface UnifiedSajuResult {
  session_id: string;
  request_id: string;
  profile: {
    name: string;
    birth: string;
    calendar: string;
    time: string;
    ilgan: string;
    ilgan_display: string;
    mbti?: string;
    zodiac_korean?: string;
    enneagram?: string;
  };
  badges: {
    ilgan: string;
    strength: string;
    yongsin: string;
    gisin: string;
    core_pattern: string;
  };
  pillar: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  elements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  sinsal: string[];
  extended_identity: {
    human_type: string;
    core_engine: string;
    thinking_style: string;
    instinct_style: string;
    motivation_core: string;
    weakness_pattern: string;
    relationship_pattern: string;
    compatibility_type?: string;
  };
  analysis: {
    core_analysis: string[];
    logic_basis: string[];
    good_flow: string[];
    risk_flow: string[];
    action_now: string[];
    avoid_action: string[];
  };
  summary: {
    tone: string;
    one_liner: string;
  };
  human_type_card: {
    title: string;
    strengths: string[];
    weaknesses: string[];
    share_summary: string;
  };
  chat_seed_questions: string[];
  /** Calculated saju only (pillar/elements/sinsal/badges). Not from Gemini. */
  original?: {
    pillar: { year: string; month: string; day: string; hour: string };
    elements: { wood: number; fire: number; earth: number; metal: number; water: number };
    sinsal: string[];
    badges: { ilgan: string; strength: string; yongsin: string; gisin: string; core_pattern: string };
  };
}

export const CATEGORIES = [
  { id: 'total', label: '종합 분석', icon: 'Sparkles' },
  { id: 'wealth', label: '재물운', icon: 'Coins' },
  { id: 'love', label: '애정운', icon: 'Heart' },
  { id: 'career', label: '직업운', icon: 'Briefcase' },
  { id: 'health', label: '건강운', icon: 'Activity' }
];
