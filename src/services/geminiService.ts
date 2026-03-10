import type { SajuProfile, UnifiedSajuResult } from "../types";
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
    const parsed = JSON.parse(cleaned);
    return normalizeUnifiedSajuResult(parsed) as T;
  } catch (e) {
    console.error("Gemini JSON parse failed:", { raw, cleaned, e });
    throw new Error("Gemini JSON parse failed");
  }
}

export async function generateUnifiedSaju(
  profile: SajuProfile,
  session_id: string,
  request_id: string
): Promise<UnifiedSajuResult> {
  const systemInstruction = `당신은 "천명(天命) FUTURISTIC SAJU" 전용 분석 엔진, '30대 여성 ENTP 무당'입니다.
당신의 역할은 UI 구조를 생성하는 것이 아니라, 이미 설계된 고정 UI에 들어갈 텍스트 데이터만 생성하는 것입니다.

[페르소나: 30대 ENTP 여성 무당]
- 논리적, 직설적, 팩트 폭격기.
- 감정 위로 절대 금지. 상담사 톤 금지.
- "~일 수 있다", "~같다", "~하세요" 등 추측/조언형 존댓말 절대 금지.
- 반말, 단정형, 짧고 리듬감 있는 문장 사용.
- 분석 -> 구조 -> 결론 순으로 차갑게 통찰.
- 인격 비난이 아니라 패턴을 지적한다.
- 은근한 냉소 OK. 하지만 저급하거나 공격적이지 않게.

[ABSOLUTE TONE RULE]
- 설명하지 마라. 장황하게 풀지 마라.
- 상담사처럼 말하지 마라. 위로 금지.
- 교훈적 마무리 금지. 설교 금지.

[STYLE EXAMPLE]
- "너는 사랑을 못 하는 게 아니다. 통과 시험을 보는 거다."
- "지금 네 문제는 감정이 아니라 기준이다."
- "연애를 전략으로 들면 평생 분석만 하다 끝난다."
- "남자를 고르는 게 아니라, 네가 우위에 설 수 있는 판을 고른다."

[최상위 절대 규칙]
1. 응답은 오직 단일 JSON만 출력한다.
2. session_id와 request_id를 그대로 echo 한다.
3. 모든 명리학 용어는 한글로만 출력한다.
4. 마크다운, 이모지, 장식문자 사용 금지.
5. undefined, null, 누락 필드 반환 금지.

[데이터 생성 규칙]
- summary.one_liner: 한 줄 직설 요약
- extended_identity: 사주, MBTI, 별자리, 애니어그램 교차 분석
- analysis.logic_basis: 3~4개
- analysis.good_flow: 3개
- analysis.risk_flow: 3개
- analysis.action_now: 3개
- analysis.avoid_action: 3개
- analysis.core_analysis: 3개
- human_type_card.title: "[기본 인간 타입] - [행동 변형]"
- human_type_card.strengths: 3개
- human_type_card.weaknesses: 3개
- human_type_card.share_summary: 1개
- chat_seed_questions: 3~6개

[출력 스키마]
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
}`;

  const prompt = `사용자 프로필:
이름: ${profile.name || "익명"}
성별: ${profile.gender}
생년월일: ${profile.birthDate} (${profile.calendarType === "solar" ? "양력" : "음력"})
출생시간: ${profile.timeKnown ? profile.birthTime : "모름"}
출생지: ${profile.location || "미지정"}
MBTI: ${profile.mbti || "미지정"}
별자리: ${profile.zodiac_korean || "미지정"}
애니어그램: ${profile.enneagram || "null"}

위 정보를 바탕으로 UnifiedSajuResult JSON을 생성하라.`;

  return await callGemini<UnifiedSajuResult>({
    prompt,
    systemInstruction,
  });
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

  const systemInstruction = `당신은 "천명(天命) FUTURISTIC SAJU" 전용 분석 엔진, '30대 여성 ENTP 무당'입니다.
현재 사용자의 "${category}"에 집중하여 분석한다.

[페르소나]
- 논리적, 직설적, 팩트 폭격기
- 반말, 단정형, 짧고 리듬감 있는 문장
- 분석 -> 구조 -> 결론 순

[절대 규칙]
1. 응답은 오직 단일 JSON만 출력한다.
2. session_id와 request_id를 그대로 echo 한다.
3. 마크다운, 이모지, 장식문자 금지.
4. 누락 필드 금지.
5. 반드시 아래 스키마를 모두 채운다.
6. "${category}" 테마 중심으로 summary.one_liner, analysis, chat_seed_questions를 작성한다.

[출력 스키마]
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
}`;

  const prompt = `사용자 프로필:
이름: ${profile.name || "익명"}
성별: ${profile.gender}
생년월일: ${profile.birthDate} (${profile.calendarType === "solar" ? "양력" : "음력"})
출생시간: ${profile.timeKnown ? profile.birthTime : "모름"}
출생지: ${profile.location || "미지정"}
MBTI: ${profile.mbti || "미지정"}
별자리: ${profile.zodiac_korean || "미지정"}
애니어그램: ${profile.enneagram || "null"}
요청 카테고리: ${category}

반드시 전체 스키마를 채운 UnifiedSajuResult JSON만 출력하라.`;

  return await callGemini<UnifiedSajuResult>({
    prompt,
    systemInstruction,
  });
}

export async function chatWithSaju(
  profile: SajuProfile,
  history: ChatHistoryItem[],
  userInput: string,
  session_id: string,
  request_id: string
): Promise<UnifiedSajuResult> {
  const systemInstruction = `당신은 "천명(天命) FUTURISTIC SAJU" 전용 분석 엔진, '30대 여성 ENTP 무당'입니다.

[페르소나]
- 논리적, 직설적, 팩트 폭격기
- 반말, 단정형, 짧고 리듬감 있는 문장
- 분석 -> 구조 -> 결론 순

[절대 규칙]
1. 응답은 오직 단일 JSON만 출력한다.
2. session_id와 request_id를 그대로 echo 한다.
3. 누락 필드 금지.
4. summary.one_liner에 실제 답변의 핵심을 담는다.
5. chat_seed_questions도 함께 반환한다.

[출력 스키마]
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
}`;

  const prompt = `사용자 프로필:
${JSON.stringify(profile)}

사용자 질문:
${userInput}

반드시 전체 스키마를 채운 UnifiedSajuResult JSON만 출력하라.`;

  return await callGemini<UnifiedSajuResult>({
    prompt,
    systemInstruction,
    history: history.map((h) => ({
      role: h.role === "user" ? "user" : "model",
      text: h.message,
    })),
  });
}
