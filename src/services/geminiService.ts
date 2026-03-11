import type { SajuProfile, UnifiedSajuResult } from "../types";
import { calculateSajuFromProfile } from "../lib/sajuCalculator";

export type { SajuProfile, UnifiedSajuResult };

type ChatHistoryItem = { role: string; message: string };

function normalizeUnifiedSajuResult(data: any): UnifiedSajuResult {
  return {
    session_id: data?.session_id ?? "",
    request_id: data?.request_id ?? "",

    profile: {
      name: data?.profile?.name ?? "",
      birth: data?.profile?.birth ?? "",
      calendar: data?.profile?.calendar ?? "",
      time: data?.profile?.time ?? "",
      ilgan: data?.profile?.ilgan ?? "",
      ilgan_display: data?.profile?.ilgan_display ?? "",
      mbti: data?.profile?.mbti ?? "",
      zodiac_korean: data?.profile?.zodiac_korean ?? "",
      enneagram: data?.profile?.enneagram ?? "",
    },

    badges: {
      ilgan: data?.badges?.ilgan ?? "",
      strength: data?.badges?.strength ?? "",
      yongsin: data?.badges?.yongsin ?? "",
      gisin: data?.badges?.gisin ?? "",
      core_pattern: data?.badges?.core_pattern ?? "",
    },

    pillar: {
      year: data?.pillar?.year ?? "",
      month: data?.pillar?.month ?? "",
      day: data?.pillar?.day ?? "",
      hour: data?.pillar?.hour ?? "",
    },

    elements: {
      wood: data?.elements?.wood ?? 0,
      fire: data?.elements?.fire ?? 0,
      earth: data?.elements?.earth ?? 0,
      metal: data?.elements?.metal ?? 0,
      water: data?.elements?.water ?? 0,
    },

    sinsal: Array.isArray(data?.sinsal) ? data.sinsal : [],

    extended_identity: {
      human_type: data?.extended_identity?.human_type ?? "",
      core_engine: data?.extended_identity?.core_engine ?? "",
      thinking_style: data?.extended_identity?.thinking_style ?? "",
      instinct_style: data?.extended_identity?.instinct_style ?? "",
      motivation_core: data?.extended_identity?.motivation_core ?? "",
      weakness_pattern: data?.extended_identity?.weakness_pattern ?? "",
      relationship_pattern: data?.extended_identity?.relationship_pattern ?? "",
      compatibility_type: data?.extended_identity?.compatibility_type ?? "",
    },

    analysis: {
      core_analysis: Array.isArray(data?.analysis?.core_analysis) ? data.analysis.core_analysis : [],
      logic_basis: Array.isArray(data?.analysis?.logic_basis) ? data.analysis.logic_basis : [],
      good_flow: Array.isArray(data?.analysis?.good_flow) ? data.analysis.good_flow : [],
      risk_flow: Array.isArray(data?.analysis?.risk_flow) ? data.analysis.risk_flow : [],
      action_now: Array.isArray(data?.analysis?.action_now) ? data.analysis.action_now : [],
      avoid_action: Array.isArray(data?.analysis?.avoid_action) ? data.analysis.avoid_action : [],
    },

    summary: {
      tone: data?.summary?.tone ?? "entp_shaman_female_30s",
      one_liner: data?.summary?.one_liner ?? "",
    },

    human_type_card: {
      title: data?.human_type_card?.title ?? "",
      strengths: Array.isArray(data?.human_type_card?.strengths) ? data.human_type_card.strengths : [],
      weaknesses: Array.isArray(data?.human_type_card?.weaknesses) ? data.human_type_card.weaknesses : [],
      share_summary: data?.human_type_card?.share_summary ?? "",
    },

    chat_seed_questions: Array.isArray(data?.chat_seed_questions)
      ? data.chat_seed_questions
      : [],
  };
}

function mergeFixedSaju(aiData, fixed, profile, session_id, request_id) {

  return {
  ...aiData,

  pillar: fixed.pillar,
  elements: fixed.elements,
  sinsal: fixed.sinsal,
  badges: fixed.badges,

  profile: {
    ...aiData.profile,
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

  session_id,
  request_id,
};
}

async function callGemini<T>(payload: {
  prompt: string;
  systemInstruction: string;
  history?: { role: "user" | "model"; text: string }[];
}): Promise<T> {
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

  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error("Gemini JSON parse failed:", { raw, cleaned, e });
    throw new Error("Gemini JSON parse failed");
  }
}

function buildFixedSajuPrompt(profile: SajuProfile) {
  const fixed = calculateSajuFromProfile(profile);

  return {
    fixed,
    text: `
사용자 프로필:
${JSON.stringify(
  {
    name: profile.name || "익명",
    gender: profile.gender,
    mbti: profile.mbti || "미지정",
    zodiac_korean: profile.zodiac_korean || "미지정",
    enneagram: profile.enneagram || "null",
  },
  null,
  2
)}

확정된 사주 계산 결과:
${JSON.stringify(fixed, null, 2)}

중요:
- 위 사주 계산 결과는 코드에서 확정된 값이다.
- 년주, 월주, 일주, 시주를 절대 다시 계산하지 마라.
- 오행 개수를 절대 다시 계산하지 마라.
- ilgan, pillar, elements, sinsal, badges 값을 절대 수정하지 마라.
- 너는 오직 해석 텍스트만 생성한다.
`.trim(),
  };
}

export async function generateUnifiedSaju(
  profile: SajuProfile,
  session_id: string,
  request_id: string
): Promise<UnifiedSajuResult> {
  const { text } = buildFixedSajuPrompt(profile);

  const systemInstruction = `
너는 "천명(天命) FUTURISTIC SAJU" 전용 해석 엔진이다.
너는 사주 계산 엔진이 아니다.

[절대 금지]
- 년주/월주/일주/시주 재계산 금지
- 오행 개수 재계산 금지
- ilgan, pillar, elements, sinsal, badges 수정 금지
- 출생정보만 보고 사주 원국을 새로 만들지 마라

[역할]
- 확정된 사주 데이터를 기반으로 해석 문장만 생성한다
- 사주 + MBTI + 별자리 + 애니어그램을 종합해서 성향을 해석한다
- 출력은 반드시 단일 JSON
- 누락 필드 금지

[톤]
- 30대 여성 ENTP 무당
- 반말
- 직설적
- 설명 길게 하지 마라
- 분석 -> 구조 -> 결론

[출력 JSON 스키마]
{
  "session_id": "${session_id}",
  "request_id": "${request_id}",
  "profile": {
    "name": "",
    "birth": "",
    "calendar": "",
    "time": "",
    "ilgan": "",
    "ilgan_display": "",
    "mbti": "",
    "zodiac_korean": "",
    "enneagram": ""
  },
  "badges": {
    "ilgan": "",
    "strength": "",
    "yongsin": "",
    "gisin": "",
    "core_pattern": ""
  },
  "pillar": {
    "year": "",
    "month": "",
    "day": "",
    "hour": ""
  },
  "elements": {
    "wood": 0,
    "fire": 0,
    "earth": 0,
    "metal": 0,
    "water": 0
  },
  "sinsal": [],
  "extended_identity": {
    "human_type": "",
    "core_engine": "",
    "thinking_style": "",
    "instinct_style": "",
    "motivation_core": "",
    "weakness_pattern": "",
    "relationship_pattern": "",
    "compatibility_type": ""
  },
  "analysis": {
    "core_analysis": ["", "", ""],
    "logic_basis": ["", "", "", ""],
    "good_flow": ["", "", ""],
    "risk_flow": ["", "", ""],
    "action_now": ["", "", ""],
    "avoid_action": ["", "", ""]
  },
  "summary": {
    "tone": "entp_shaman_female_30s",
    "one_liner": ""
  },
  "human_type_card": {
    "title": "",
    "strengths": ["", "", ""],
    "weaknesses": ["", "", ""],
    "share_summary": ""
  },
  "chat_seed_questions": ["", "", ""]
}
`.trim();

  const aiResult = await callGemini<any>({
    prompt: `${text}\n\n위 확정값은 그대로 두고 UnifiedSajuResult JSON만 출력하라.`,
    systemInstruction,
  });

  const fixed = await calculateSajuFromProfile(profile);
const aiResult = await callGemini(...);

return mergeFixedSaju(aiResult, fixed, profile, session_id, request_id);
}

export const CATEGORIES = [
  { id: "total", label: "종합 분석", icon: "Sparkles" },
  { id: "wealth", label: "재물운", icon: "Coins" },
  { id: "love", label: "애정운", icon: "Heart" },
  { id: "career", label: "직업운", icon: "Briefcase" },
  { id: "health", label: "건강운", icon: "Activity" },
];

export async function generateSajuReading(
  profile: SajuProfile,
  categoryId: string,
  session_id: string,
  request_id: string
): Promise<UnifiedSajuResult> {
  const category = CATEGORIES.find((c) => c.id === categoryId)?.label || "종합";
  const { text } = buildFixedSajuPrompt(profile);

  const systemInstruction = `
너는 "천명(天命) FUTURISTIC SAJU" 전용 해석 엔진이다.
너는 사주 계산 엔진이 아니다.

[절대 금지]
- pillar 재계산 금지
- elements 재계산 금지
- sinsal, badges 수정 금지

[역할]
- "${category}"에 집중해서 해석한다
- 해석 텍스트만 생성한다
- 출력은 반드시 단일 JSON
- 전체 스키마를 다 채운다

[톤]
- 30대 여성 ENTP 무당
- 반말
- 직설적
- 짧고 강하게

[출력 JSON 스키마]
{
  "session_id": "${session_id}",
  "request_id": "${request_id}",
  "profile": {
    "name": "",
    "birth": "",
    "calendar": "",
    "time": "",
    "ilgan": "",
    "ilgan_display": "",
    "mbti": "",
    "zodiac_korean": "",
    "enneagram": ""
  },
  "badges": {
    "ilgan": "",
    "strength": "",
    "yongsin": "",
    "gisin": "",
    "core_pattern": ""
  },
  "pillar": {
    "year": "",
    "month": "",
    "day": "",
    "hour": ""
  },
  "elements": {
    "wood": 0,
    "fire": 0,
    "earth": 0,
    "metal": 0,
    "water": 0
  },
  "sinsal": [],
  "extended_identity": {
    "human_type": "",
    "core_engine": "",
    "thinking_style": "",
    "instinct_style": "",
    "motivation_core": "",
    "weakness_pattern": "",
    "relationship_pattern": "",
    "compatibility_type": ""
  },
  "analysis": {
    "core_analysis": ["", "", ""],
    "logic_basis": ["", "", "", ""],
    "good_flow": ["", "", ""],
    "risk_flow": ["", "", ""],
    "action_now": ["", "", ""],
    "avoid_action": ["", "", ""]
  },
  "summary": {
    "tone": "entp_shaman_female_30s",
    "one_liner": ""
  },
  "human_type_card": {
    "title": "",
    "strengths": ["", "", ""],
    "weaknesses": ["", "", ""],
    "share_summary": ""
  },
  "chat_seed_questions": ["", "", ""]
}
`.trim();

  const aiResult = await callGemini<any>({
    prompt: `${text}\n\n현재 요청 카테고리: ${category}\n반드시 전체 스키마를 채운 JSON만 출력하라.`,
    systemInstruction,
  });

  return mergeFixedSaju(aiResult, profile, session_id, request_id);
}

export async function chatWithSaju(
  profile: SajuProfile,
  history: ChatHistoryItem[],
  userInput: string,
  session_id: string,
  request_id: string,
  summary?: UnifiedSajuResult | null,
  reading?: UnifiedSajuResult | null
): Promise<UnifiedSajuResult> {
  const fixed = calculateSajuFromProfile(profile);

  const fixedSummary = summary
    ? {
        profile: summary.profile,
        badges: summary.badges,
        pillar: summary.pillar,
        elements: summary.elements,
        sinsal: summary.sinsal,
        extended_identity: summary.extended_identity,
        human_type_card: summary.human_type_card,
        summary: summary.summary,
      }
    : null;

  const fixedReading = reading
    ? {
        summary: reading.summary,
        analysis: reading.analysis,
        extended_identity: reading.extended_identity,
        human_type_card: reading.human_type_card,
        chat_seed_questions: reading.chat_seed_questions,
      }
    : null;

  const systemInstruction = `
너는 "천명(天命) FUTURISTIC SAJU" 전용 상담 엔진이다.
너는 사주 계산 엔진이 아니다.

[절대 금지]
- 년주, 월주, 일주, 시주를 다시 계산하지 마라
- 오행 개수를 다시 계산하지 마라
- 사주 데이터가 없다고 말하지 마라
- 생년월일시를 다시 입력하라고 하지 마라
- 이미 전달된 summary, reading, fixed_saju를 무시하지 마라
- 이전 상담 맥락과 모순되게 말하지 마라

[대화 절대 규칙]
- 현재 대화는 이미 사주 계산이 끝난 사용자에 대한 후속 상담이다
- 지금 사용자는 현재 profile의 인물 한 명이다
- summary와 reading은 현재 사용자에 대한 확정 컨텍스트다
- 답변은 반드시 현재 사용자 기준으로 이어서 말해야 한다
- 말투는 30대 여성 ENTP 무당
- 반말
- 직설적
- 분석 -> 구조 -> 결론 순
- 위로 금지
- 상담사 말투 금지
- 짧고 세게 말해라

[역할]
- 확정된 사주 원국 + MBTI + 별자리 + 애니어그램을 종합해 현재 질문에 답한다
- summary.one_liner에는 이번 질문에 대한 핵심 한 줄 답변을 넣는다
- analysis.core_analysis에는 이번 질문에 맞는 핵심 해석 3개를 넣는다
- chat_seed_questions는 현재 질문과 이어지는 후속 질문 3~6개로 유지한다

[출력 형식]
- 반드시 UnifiedSajuResult 전체 JSON만 출력
- 마크다운 금지
- 코드블록 금지
- 누락 필드 금지
`.trim();

  const prompt = `
현재 상담 대상 프로필:
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

코드에서 확정된 사주 데이터:
${JSON.stringify(fixed, null, 2)}

기본 사주 요약 컨텍스트:
${JSON.stringify(fixedSummary, null, 2)}

현재 보고 있던 결과 카드 컨텍스트:
${JSON.stringify(fixedReading, null, 2)}

사용자 질문:
${userInput}

규칙:
- fixed, summary, reading은 현재 사용자의 확정 데이터다
- 이걸 기반으로 바로 이어서 답해라
- "사주 데이터가 없다" 같은 말 절대 금지
- 현재 질문에 맞는 실제 상담 답변을 만들어라
- pillar, elements, sinsal, badges 값은 절대 바꾸지 마라
- 반드시 UnifiedSajuResult 전체 JSON으로 응답하라
`.trim();

  const aiResult = await callGemini<any>({
    prompt,
    systemInstruction,
    history: history.map((h) => ({
      role: h.role === "user" ? "user" : "model",
      text: h.message,
    })),
  });

  return mergeFixedSaju(aiResult, profile, session_id, request_id);
}
