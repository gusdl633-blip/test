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
  { id: "total", label: "종합 분석", icon: "Sparkles" },
  { id: "wealth", label: "재물운", icon: "Coins" },
  { id: "love", label: "애정운", icon: "Heart" },
  { id: "career", label: "직업운", icon: "Briefcase" },
  { id: "health", label: "건강운", icon: "Activity" },
];

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
  session_id: string,
  request_id: string
): Promise<UnifiedSajuResult> {
  const fixed = await calculateSajuFromProfile(profile);
  const category = CATEGORIES.find((c) => c.id === categoryId)?.label || "종합 분석";

  const systemInstruction = `당신은 "천명(天命) FUTURISTIC SAJU" 전용 분석 엔진, 30대 여성 ENTP 무당입니다.
역할은 이미 계산된 사주 데이터를 바탕으로 "${category}" 해석 문장만 만드는 것입니다.

규칙:
- 반드시 JSON만 출력
- pillar, elements, sinsal, badges 값은 생성하거나 수정하지 마라
- 반말
- 직설
- 상담사 톤 금지
- 해석은 "${category}" 중심으로 작성`;

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

요청 카테고리:
${category}

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
    console.error("generateSajuReading failed:", error);
    return createEmptyUnifiedResult(profile, fixed, session_id, request_id);
  }
}

export async function chatWithSaju(
  profile: SajuProfile,
  history: ChatHistoryItem[],
  userInput: string,
  session_id: string,
  request_id: string,
  fixedSummary?: UnifiedSajuResult | null,
  fixedReading?: UnifiedSajuResult | null
): Promise<UnifiedSajuResult> {
  const fixed = await calculateSajuFromProfile(profile);

  const systemInstruction = `당신은 "천명(天命) FUTURISTIC SAJU" 전용 분석 엔진, 30대 여성 ENTP 무당입니다.
역할은 이미 계산된 사주 데이터를 바탕으로 상담 답변만 생성하는 것입니다.

규칙:
- 반드시 UnifiedSajuResult 전체 JSON으로 답해라
- pillar, elements, sinsal, badges 값은 절대 바꾸지 마라
- "사주 데이터가 없다" 같은 말 금지
- 이미 제공된 사주 데이터를 바탕으로 바로 이어서 답해라
- 반말, 직설, 짧은 문장
- 상담사 톤 금지`;

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

기본 사주 요약 컨텍스트:
${JSON.stringify(fixedSummary || {}, null, 2)}

현재 보고 있던 결과 카드 컨텍스트:
${JSON.stringify(fixedReading || {}, null, 2)}

사용자 질문:
${userInput}
`.trim();

  try {
    const aiResult = await callGemini<Partial<UnifiedSajuResult>>({
      prompt,
      systemInstruction,
      history: history.map((h) => ({
        role: h.role === "user" ? "user" : "model",
        text: h.message,
      })),
    });

    return mergeFixedSaju(aiResult, fixed, profile, session_id, request_id);
  } catch (error) {
    console.error("chatWithSaju failed:", error);
    return createEmptyUnifiedResult(profile, fixed, session_id, request_id);
  }
}
