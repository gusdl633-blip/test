import type { SajuProfile, UnifiedSajuResult } from "../types";
export type { SajuProfile, UnifiedSajuResult };

import { calculateSajuFromProfile, type CalculatedSaju } from "../lib/sajuCalculator";

type ChatHistoryItem = { role: string; message: string };

async function callGemini<T>(payload: {
  prompt: string;
  systemInstruction: string;
  history?: { role: "user" | "model"; text: string }[];
}) {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: payload.prompt,
      systemInstruction: payload.systemInstruction,
      history: payload.history ?? [],
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail || error?.error || "Gemini API request failed");
  }

  const data = await res.json();
  const raw = typeof data?.text === "string" ? data.text : "{}";

  const cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

function createEmptyUnifiedResult(
  profile: SajuProfile,
  fixed: CalculatedSaju,
  session_id: string,
  request_id: string
): UnifiedSajuResult {
  return {
    session_id,
    request_id,
    profile: {
      name: profile.name || "",
      birth: profile.birthDate || "",
      calendar: profile.calendarType || "",
      time: profile.birthTime || "",
      ilgan: fixed.ilgan,
      ilgan_display: fixed.ilgan_display,
      mbti: profile.mbti || "",
      zodiac_korean: profile.zodiac_korean || "",
      enneagram: profile.enneagram || "",
    },
    badges: fixed.badges,
    pillar: fixed.pillar,
    elements: fixed.elements,
    sinsal: fixed.sinsal,
    extended_identity: {
      human_type: "",
      core_engine: "",
      thinking_style: "",
      instinct_style: "",
      motivation_core: "",
      weakness_pattern: "",
      relationship_pattern: "",
      compatibility_type: "",
    },
    analysis: {
      core_analysis: ["", "", ""],
      logic_basis: ["", "", "", ""],
      good_flow: ["", "", ""],
      risk_flow: ["", "", ""],
      action_now: ["", "", ""],
      avoid_action: ["", "", ""],
    },
    summary: {
      tone: "entp_shaman_female_30s",
      one_liner: "",
    },
    human_type_card: {
      title: "",
      strengths: ["", "", ""],
      weaknesses: ["", "", ""],
      share_summary: "",
    },
    chat_seed_questions: [],
  };
}

function mergeFixedSaju(
  aiData: Partial<UnifiedSajuResult> | undefined,
  fixed: CalculatedSaju,
  profile: SajuProfile,
  session_id: string,
  request_id: string
): UnifiedSajuResult {
  const safe = aiData ?? {};

  return {
    session_id,
    request_id,

    profile: {
      name: profile.name || "",
      birth: profile.birthDate || "",
      calendar: profile.calendarType || "",
      time: profile.birthTime || "",
      ilgan: fixed.ilgan,
      ilgan_display: fixed.ilgan_display,
      mbti: profile.mbti || "",
      zodiac_korean: profile.zodiac_korean || "",
      enneagram: profile.enneagram || "",
    },

    badges: fixed.badges,
    pillar: fixed.pillar,
    elements: fixed.elements,
    sinsal: fixed.sinsal,

    extended_identity: {
      human_type: safe?.extended_identity?.human_type ?? "",
      core_engine: safe?.extended_identity?.core_engine ?? "",
      thinking_style: safe?.extended_identity?.thinking_style ?? "",
      instinct_style: safe?.extended_identity?.instinct_style ?? "",
      motivation_core: safe?.extended_identity?.motivation_core ?? "",
      weakness_pattern: safe?.extended_identity?.weakness_pattern ?? "",
      relationship_pattern: safe?.extended_identity?.relationship_pattern ?? "",
      compatibility_type: safe?.extended_identity?.compatibility_type ?? "",
    },

    analysis: {
      core_analysis: safe?.analysis?.core_analysis ?? ["", "", ""],
      logic_basis: safe?.analysis?.logic_basis ?? ["", "", "", ""],
      good_flow: safe?.analysis?.good_flow ?? ["", "", ""],
      risk_flow: safe?.analysis?.risk_flow ?? ["", "", ""],
      action_now: safe?.analysis?.action_now ?? ["", "", ""],
      avoid_action: safe?.analysis?.avoid_action ?? ["", "", ""],
    },

    summary: {
      tone: safe?.summary?.tone ?? "entp_shaman_female_30s",
      one_liner: safe?.summary?.one_liner ?? "",
    },

    human_type_card: {
      title: safe?.human_type_card?.title ?? "",
      strengths: safe?.human_type_card?.strengths ?? ["", "", ""],
      weaknesses: safe?.human_type_card?.weaknesses ?? ["", "", ""],
      share_summary: safe?.human_type_card?.share_summary ?? "",
    },

    chat_seed_questions: safe?.chat_seed_questions ?? [],
  };
}

export const CATEGORIES = [
  {
    id: "overall",
    titleKr: "종합운",
    titleEn: "Sparkles",
    subtitle: "전체 흐름 분석",
    icon: "sparkles",
  },
  {
    id: "money",
    titleKr: "재물운",
    titleEn: "Coins",
    subtitle: "돈과 소비 흐름",
    icon: "coins",
  },
  {
    id: "love",
    titleKr: "애정운",
    titleEn: "Heart",
    subtitle: "연애와 관계 흐름",
    icon: "heart",
  },
  {
    id: "career",
    titleKr: "직업운",
    titleEn: "Briefcase",
    subtitle: "일과 커리어 흐름",
    icon: "briefcase",
  },
  {
    id: "health",
    titleKr: "건강운",
    titleEn: "Activity",
    subtitle: "체력과 컨디션 흐름",
    icon: "activity",
  },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  overall: "종합운",
  money: "재물운",
  love: "애정운",
  career: "직업운",
  health: "건강운",
};

const CATEGORY_PROMPTS: Record<string, string> = {
  overall:
    "이 사람의 전체 운 흐름을 분석해라. 현재 분위기, 가장 강한 장점, 반복되는 약점, 지금 특히 조심할 점을 중심으로 정리해라.",
  money:
    "이 사람의 재물운을 분석해라. 돈을 버는 방식, 새는 지점, 소비 패턴, 모아지는 구조인지 흩어지는 구조인지, 당장 조심할 금전 리스크를 정리해라.",
  love:
    "이 사람의 애정운을 분석해라. 연애 성향, 관계 패턴, 감정 기복, 끌리는 상대 유형, 관계에서 반복되는 실수와 지금 시점의 애정 흐름을 정리해라.",
  career:
    "이 사람의 직업운을 분석해라. 일복, 커리어 방향, 잘 맞는 직무 스타일, 조직형/개인형 성향, 직장에서 반복되는 문제, 지금 시점의 커리어 흐름과 조심할 점을 정리해라.",
  health:
    "이 사람의 건강운을 분석해라. 체력 기복, 에너지 소모 패턴, 무리하기 쉬운 포인트, 생활 습관상 취약점, 지금 시점의 건강 관리 포인트를 정리해라.",
};

export async function generateUnifiedSaju(
  profile: SajuProfile,
  session_id: string,
  request_id: string
): Promise<UnifiedSajuResult> {
  const fixed = await calculateSajuFromProfile(profile);

  const systemInstruction = `당신은 "천명(天命) FUTURISTIC SAJU" 전용 분석 엔진, 30대 여성 ENTP 무당입니다.
역할은 사주 원국을 계산하는 것이 아니라, 이미 계산된 사주 데이터를 바탕으로 해석 문장만 만드는 것입니다.

규칙:
- 반드시 JSON만 출력
- pillar, elements, sinsal, badges 값은 생성하거나 수정하지 마라
- 상담사 톤 금지
- 반말, 직설, 짧은 문장
- 위로 금지
- 장황한 설명 금지`;

  const prompt = `
사용자 프로필:
${JSON.stringify(
  {
    name: profile.name || "익명",
    gender: profile.gender,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    calendarType: profile.calendarType,
    location: profile.location || "",
    mbti: profile.mbti || "",
    zodiac_korean: profile.zodiac_korean || "",
    enneagram: profile.enneagram || "",
  },
  null,
  2
)}

확정 사주 데이터:
${JSON.stringify(fixed, null, 2)}

반드시 UnifiedSajuResult 형식의 JSON 전체를 출력하되,
해석 문장만 생성하고 사주 원국 값은 건드리지 마라.
`.trim();

  try {
    const aiResult = await callGemini<Partial<UnifiedSajuResult>>({
      prompt,
      systemInstruction,
    });

    return mergeFixedSaju(aiResult, fixed, profile, session_id, request_id);
  } catch (error) {
    console.error("generateUnifiedSaju failed:", error);
    return createEmptyUnifiedResult(profile, fixed, session_id, request_id);
  }
}

export async function generateSajuReading(
  profile: SajuProfile,
  categoryId: string,
  sessionId: string,
  requestId: string
): Promise<UnifiedSajuResult> {
  const fixed = await generateUnifiedSaju(profile, sessionId);

  if (!CATEGORY_PROMPTS[categoryId]) {
    throw new Error(`unknown categoryId: ${categoryId}`);
  }

  const categoryLabel = CATEGORY_LABELS[categoryId];
  const categoryPrompt = CATEGORY_PROMPTS[categoryId];

  console.log("CATEGORY ID:", categoryId);
  console.log("CATEGORY LABEL:", categoryLabel);
  console.log("CATEGORY PROMPT:", categoryPrompt);
  console.log("FIXED SAJU:", fixed);

  const prompt = `
너는 사주 기반 인간 패턴 해석 시스템이다.

아래는 이미 확정된 사용자 사주/성향 데이터다.
이 값을 바꾸지 말고, 그대로 근거로만 사용해라.

[확정 프로필]
${JSON.stringify(fixed.profile, null, 2)}

[확정 사주 구조]
${JSON.stringify(
  {
    pillar: fixed.pillar,
    elements: fixed.elements,
    hidden_elements: fixed.hidden_elements,
    visible_ten_gods: fixed.visible_ten_gods,
    hidden_ten_gods: fixed.hidden_ten_gods,
    badges: fixed.badges,
    sinsal: fixed.sinsal,
    daewoon: fixed.daewoon,
  },
  null,
  2
)}

[현재 요청 카테고리]
- id: ${categoryId}
- label: ${categoryLabel}

[카테고리 분석 지시]
${categoryPrompt}

반드시 아래 규칙을 지켜라.

1. 결과는 한국어로만 작성해라.
2. 사주 원 데이터(pillar, elements, badges 등)는 절대 바꾸지 마라.
3. 결과 JSON만 반환해라.
4. 아래 JSON 스키마를 반드시 지켜라.
5. summary.one_liner, core_analysis, human_structure, archetype 모두 채워라.
6. 내용이 비어 있으면 안 된다.
7. 직설적이고 간결하게 써라.

반환 JSON 스키마:
{
  "summary": {
    "one_liner": "한 줄 요약",
    "keywords": ["키워드1", "키워드2", "키워드3"]
  },
  "core_analysis": [
    "핵심 분석 1",
    "핵심 분석 2",
    "핵심 분석 3"
  ],
  "human_structure": {
    "core_engine": "사주 기반 핵심 구조 설명",
    "thinking_algorithm": "MBTI 기반 사고 방식 설명",
    "instinct_temperament": "별자리 기반 기질 설명",
    "motivation_core": "에니어그램 기반 동기 설명",
    "weakness_pattern": "구조적 약점 설명",
    "relationship_pattern": "관계 방식 설명"
  },
  "archetype": {
    "title": "인간 유형 이름",
    "description": "유형 설명",
    "strengths": ["강점1", "강점2", "강점3"],
    "weaknesses": ["약점1", "약점2", "약점3"]
  }
}
`.trim();

  const aiResult = await callGemini<any>({
    prompt,
    systemInstruction:
      "너는 한국어로만 답하는 사주 분석 엔진이다. JSON 외 텍스트를 절대 섞지 마라.",
    history: [],
  });

  console.log("AI RESULT:", aiResult);

  const parsed = normalizeCategoryReading(aiResult, categoryLabel);

  return {
    ...fixed,
    summary: parsed.summary,
    core_analysis: parsed.core_analysis,
    human_structure: parsed.human_structure,
    archetype: parsed.archetype,
  };
}
