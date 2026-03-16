import type { SajuProfile, UnifiedSajuResult } from "../types";
export type { SajuProfile, UnifiedSajuResult };

import { calculateSajuFromProfile, type CalculatedSaju } from "../lib/sajuCalculator";

type ChatHistoryItem = { role: string; message: string };

const SAJU_PERSONA_SYSTEM = `
너는 "천명(天命) FUTURISTIC SAJU" 전용 분석 엔진이다.
페르소나는 30대 여성 ENTP 무당이다.

역할:
- 사주 원국 계산 금지. 이미 계산된 사주 데이터를 근거로 해석 문장만 생성한다.

절대 규칙:
- 반드시 JSON만 출력한다. JSON 외 텍스트 금지.
- pillar, elements, sinsal, badges 값 생성/수정 금지.
- 상담사 톤 금지. 존댓말 금지. 위로/교훈/격려 금지.
- 반말. 직설. 짧은 문장.
- 장황한 설명 금지. 판단형 문장만 쓴다.
- 한 문장 길이 20~40자 내외. 길면 쪼개라.

문장 규칙(강제):
- 각 배열 항목은 한 문장만 쓴다.
- 문장은 마침표로 끝낸다.
- 아래 표현 금지: "합니다", "있습니다", "중요합니다", "추구합니다", "할 수", "바랍니다", "응원", "괜찮", "힘든", "도움", "하세요".
`.trim();

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
      ilgan: fixed.profile.ilgan,
      ilgan_display: fixed.profile.ilgan_display,
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
      ilgan: fixed.profile.ilgan,
      ilgan_display: fixed.profile.ilgan_display,
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

  const systemInstruction = SAJU_PERSONA_SYSTEM;

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
    console.log("[SAJU PROMPT STYLE]", { mode: "analysis", persona: "ENTP_SHAMAN" });
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

function normalizeCategoryReading(aiResult: any) {
  // Strict schema:
  // {
  //   analysis: [string, string, string],
  //   structure: { coreEngine, thinkingAlgorithm, instinctTemperament, motivationCore, weaknessPattern, relationshipPattern },
  //   humanType: { title, strengths[3], weaknesses[3], shareSummary },
  //   evidence[3], goodFlow[3], riskSignals[3], actions[3], avoidActions[3]
  // }

  const analysis = Array.isArray(aiResult?.analysis) ? aiResult.analysis.slice(0, 3) : [];
  const evidence = Array.isArray(aiResult?.evidence) ? aiResult.evidence.slice(0, 3) : [];
  const goodFlow = Array.isArray(aiResult?.goodFlow) ? aiResult.goodFlow.slice(0, 3) : [];
  const riskSignals = Array.isArray(aiResult?.riskSignals) ? aiResult.riskSignals.slice(0, 3) : [];
  const actions = Array.isArray(aiResult?.actions) ? aiResult.actions.slice(0, 3) : [];
  const avoidActions = Array.isArray(aiResult?.avoidActions) ? aiResult.avoidActions.slice(0, 3) : [];

  const structure = {
    coreEngine: typeof aiResult?.structure?.coreEngine === "string" ? aiResult.structure.coreEngine : "",
    thinkingAlgorithm:
      typeof aiResult?.structure?.thinkingAlgorithm === "string" ? aiResult.structure.thinkingAlgorithm : "",
    instinctTemperament:
      typeof aiResult?.structure?.instinctTemperament === "string" ? aiResult.structure.instinctTemperament : "",
    motivationCore:
      typeof aiResult?.structure?.motivationCore === "string" ? aiResult.structure.motivationCore : "",
    weaknessPattern:
      typeof aiResult?.structure?.weaknessPattern === "string" ? aiResult.structure.weaknessPattern : "",
    relationshipPattern:
      typeof aiResult?.structure?.relationshipPattern === "string" ? aiResult.structure.relationshipPattern : "",
  };

  const humanType = {
    title: typeof aiResult?.humanType?.title === "string" ? aiResult.humanType.title : "",
    strengths: Array.isArray(aiResult?.humanType?.strengths) ? aiResult.humanType.strengths.slice(0, 3) : [],
    weaknesses: Array.isArray(aiResult?.humanType?.weaknesses) ? aiResult.humanType.weaknesses.slice(0, 3) : [],
    shareSummary:
      typeof aiResult?.humanType?.shareSummary === "string" ? aiResult.humanType.shareSummary : "",
  };

  const one_liner =
    (typeof analysis?.[0] === "string" && analysis[0]) ||
    (typeof humanType.shareSummary === "string" && humanType.shareSummary) ||
    "";

  return {
    one_liner,
    analysis,
    structure,
    humanType,
    evidence,
    goodFlow,
    riskSignals,
    actions,
    avoidActions,
  };
}

function hasForbiddenTone(text: unknown) {
  if (typeof text !== "string") return false;
  const t = text.trim();
  if (!t) return false;
  if (t.length > 60) return true;
  const forbidden = [
    "합니다",
    "했습니다",
    "있습니다",
    "됩니다",
    "필요합니다",
    "바람직합니다",
    "보입니다",
    "경향이 있습니다",
    "하세요",
    "하실",
    "괜찮",
    "힘든",
    "응원",
    "바랍니다",
    "도움",
    "할 수",
    "중요합니다",
    "추구합니다",
  ];
  return forbidden.some((w) => t.includes(w));
}

function countForbiddenInObject(obj: any) {
  let count = 0;
  const visit = (v: any) => {
    if (typeof v === "string") {
      if (hasForbiddenTone(v)) count += 1;
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(visit);
      return;
    }
    if (v && typeof v === "object") {
      Object.values(v).forEach(visit);
    }
  };
  visit(obj);
  return count;
}

type StrictGeminiResult = {
  analysis: string[];
  structure: {
    coreEngine: string;
    thinkingAlgorithm: string;
    instinctTemperament: string;
    motivationCore: string;
    weaknessPattern: string;
    relationshipPattern: string;
  };
  humanType: {
    title: string;
    strengths: string[];
    weaknesses: string[];
    shareSummary: string;
  };
  evidence: string[];
  goodFlow: string[];
  riskSignals: string[];
  actions: string[];
  avoidActions: string[];
};

function isNonEmptyString(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}

function validateStrictSchema(obj: any) {
  const issues: string[] = [];

  const allowedKeys = new Set([
    "analysis",
    "structure",
    "humanType",
    "evidence",
    "goodFlow",
    "riskSignals",
    "actions",
    "avoidActions",
  ]);

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, issues: ["root is not an object"] };
  }

  for (const k of Object.keys(obj)) {
    if (!allowedKeys.has(k)) issues.push(`unknown key: ${k}`);
  }

  const mustBe3Strings = (key: string) => {
    const arr = (obj as any)[key];
    if (!Array.isArray(arr)) {
      issues.push(`${key} is not array`);
      return;
    }
    if (arr.length !== 3) issues.push(`${key} length != 3`);
    for (let i = 0; i < Math.min(arr.length, 3); i++) {
      if (!isNonEmptyString(arr[i])) issues.push(`${key}[${i}] empty`);
    }
  };

  mustBe3Strings("analysis");
  mustBe3Strings("evidence");
  mustBe3Strings("goodFlow");
  mustBe3Strings("riskSignals");
  mustBe3Strings("actions");
  mustBe3Strings("avoidActions");

  const structure = obj.structure;
  if (!structure || typeof structure !== "object" || Array.isArray(structure)) {
    issues.push("structure is not object");
  } else {
    const sKeys = [
      "coreEngine",
      "thinkingAlgorithm",
      "instinctTemperament",
      "motivationCore",
      "weaknessPattern",
      "relationshipPattern",
    ] as const;
    for (const k of sKeys) {
      if (!isNonEmptyString(structure[k])) issues.push(`structure.${k} empty`);
    }
  }

  const humanType = obj.humanType;
  if (!humanType || typeof humanType !== "object" || Array.isArray(humanType)) {
    issues.push("humanType is not object");
  } else {
    if (!isNonEmptyString(humanType.title)) issues.push("humanType.title empty");
    if (!isNonEmptyString(humanType.shareSummary)) issues.push("humanType.shareSummary empty");

    const validate3 = (key: "strengths" | "weaknesses") => {
      const arr = humanType[key];
      if (!Array.isArray(arr)) {
        issues.push(`humanType.${key} is not array`);
        return;
      }
      if (arr.length !== 3) issues.push(`humanType.${key} length != 3`);
      for (let i = 0; i < Math.min(arr.length, 3); i++) {
        if (!isNonEmptyString(arr[i])) issues.push(`humanType.${key}[${i}] empty`);
      }
    };
    validate3("strengths");
    validate3("weaknesses");
  }

  return { ok: issues.length === 0, issues };
}

export async function generateSajuReading(
  profile: SajuProfile,
  categoryId: string,
  sessionId: string,
  requestId: string
): Promise<UnifiedSajuResult> {
  const fixed = await generateUnifiedSaju(profile, sessionId, requestId);

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
    hidden_elements: (fixed as any).hidden_elements,
    visible_ten_gods: (fixed as any).visible_ten_gods,
    hidden_ten_gods: (fixed as any).hidden_ten_gods,
    badges: fixed.badges,
    sinsal: fixed.sinsal,
    daewoon: (fixed as any).daewoon,
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
5. 모든 섹션을 비우지 마라. 전부 채워라.
6. 내용이 비어 있으면 안 된다.
7. 직설적이고 간결하게 써라.

반환 JSON 스키마(이 구조만 반환):
{
  "analysis": ["string", "string", "string"],
  "structure": {
    "coreEngine": "string",
    "thinkingAlgorithm": "string",
    "instinctTemperament": "string",
    "motivationCore": "string",
    "weaknessPattern": "string",
    "relationshipPattern": "string"
  },
  "humanType": {
    "title": "string",
    "strengths": ["string","string","string"],
    "weaknesses": ["string","string","string"],
    "shareSummary": "string"
  },
  "evidence": ["string","string","string"],
  "goodFlow": ["string","string","string"],
  "riskSignals": ["string","string","string"],
  "actions": ["string","string","string"],
  "avoidActions": ["string","string","string"]
}
`.trim();

  console.log("[SAJU PROMPT STYLE]", { mode: "analysis", persona: "ENTP_SHAMAN" });
  let aiResult = await callGemini<any>({
    prompt,
    systemInstruction: SAJU_PERSONA_SYSTEM,
    history: [],
  });

  const toneForbiddenCount = countForbiddenInObject(aiResult);
  const schemaCheck = validateStrictSchema(aiResult);

  if (toneForbiddenCount > 0 || !schemaCheck.ok) {
    console.warn("[SAJU][retry] violations detected, retrying once", {
      toneForbiddenCount,
      schemaOk: schemaCheck.ok,
      schemaIssues: schemaCheck.issues.slice(0, 12),
    });
    aiResult = await callGemini<any>({
      prompt: `${prompt}

규칙 위반했다.
- 같은 JSON 스키마 그대로 다시 반환.
- 키 이름 바꾸지 마라.
- 모든 배열은 3개로 채워라. 빈 문자열 금지.
- structure/humanType 모든 필드 채워라. 빈 문자열 금지.
- 존댓말/설명체/위로체 금지. "~합니다/~있습니다/할 수 있습니다/중요합니다/추구합니다/필요합니다/바람직합니다/보입니다/경향이 있습니다" 금지.
`.trim(),
      systemInstruction: SAJU_PERSONA_SYSTEM,
      history: [],
    });
  }

  console.log("AI RESULT:", aiResult);

  const finalToneForbiddenCount = countForbiddenInObject(aiResult);
  const finalSchemaCheck = validateStrictSchema(aiResult);
  if (finalToneForbiddenCount > 0 || !finalSchemaCheck.ok) {
    console.error("[SAJU][retry] still invalid after retry", {
      finalToneForbiddenCount,
      schemaOk: finalSchemaCheck.ok,
      schemaIssues: finalSchemaCheck.issues.slice(0, 20),
    });
    throw new Error(
      `Gemini result invalid (tone/schema). issues=${finalSchemaCheck.issues.slice(0, 10).join("; ")}`
    );
  }

  const parsed = normalizeCategoryReading(aiResult);

  const mapped: UnifiedSajuResult = {
    ...fixed,
    summary: {
      ...fixed.summary,
      one_liner: parsed.one_liner,
    },
    analysis: {
      ...fixed.analysis,
      core_analysis: parsed.analysis,
      logic_basis: parsed.evidence,
      good_flow: parsed.goodFlow,
      risk_flow: parsed.riskSignals,
      action_now: parsed.actions,
      avoid_action: parsed.avoidActions,
    },
    extended_identity: {
      ...fixed.extended_identity,
      core_engine: parsed.structure.coreEngine,
      thinking_style: parsed.structure.thinkingAlgorithm,
      instinct_style: parsed.structure.instinctTemperament,
      motivation_core: parsed.structure.motivationCore,
      weakness_pattern: parsed.structure.weaknessPattern,
      relationship_pattern: parsed.structure.relationshipPattern,
    },
    human_type_card: {
      ...fixed.human_type_card,
      title: parsed.humanType.title,
      strengths: parsed.humanType.strengths,
      weaknesses: parsed.humanType.weaknesses,
      share_summary: parsed.humanType.shareSummary,
    },
  };

  console.log("[SAJU] mapped reading (generateSajuReading):", {
    hasSummary: !!mapped.summary?.one_liner,
    core_analysis_len: mapped.analysis?.core_analysis?.filter(Boolean).length ?? 0,
    core_engine: mapped.extended_identity?.core_engine,
    thinking_style: mapped.extended_identity?.thinking_style,
    instinct_style: mapped.extended_identity?.instinct_style,
    motivation_core: mapped.extended_identity?.motivation_core,
    weakness_pattern: mapped.extended_identity?.weakness_pattern,
    relationship_pattern: mapped.extended_identity?.relationship_pattern,
    human_type_title: mapped.human_type_card?.title,
  });

  return mapped;
}

export async function chatWithSaju(
  profile: SajuProfile,
  summary: UnifiedSajuResult | null,
  reading: UnifiedSajuResult | null,
  userInput: string,
  sessionId: string,
  requestId: string
): Promise<UnifiedSajuResult> {
  const fixed = summary ?? (await generateUnifiedSaju(profile, sessionId, requestId));

  const prompt = `
너는 사주 기반 상담 엔진이다.

아래는 이미 확정된 사용자 데이터다.
절대 바꾸지 말고, 이 값을 근거로만 답해라.

[프로필]
${JSON.stringify(fixed.profile, null, 2)}

[사주 구조]
${JSON.stringify(
  {
    pillar: fixed.pillar,
    elements: fixed.elements,
    hidden_elements: (fixed as any).hidden_elements,
    visible_ten_gods: (fixed as any).visible_ten_gods,
    hidden_ten_gods: (fixed as any).hidden_ten_gods,
    badges: fixed.badges,
    sinsal: fixed.sinsal,
    daewoon: (fixed as any).daewoon,
  },
  null,
  2
)}

[현재 보고 있던 리딩]
${JSON.stringify(reading ?? {}, null, 2)}

[사용자 질문]
${userInput}

반드시 한국어로만 답해라.
JSON만 반환해라.

반환 JSON 스키마(이 구조만 반환):
{
  "analysis": ["string", "string", "string"],
  "structure": {
    "coreEngine": "string",
    "thinkingAlgorithm": "string",
    "instinctTemperament": "string",
    "motivationCore": "string",
    "weaknessPattern": "string",
    "relationshipPattern": "string"
  },
  "humanType": {
    "title": "string",
    "strengths": ["string","string","string"],
    "weaknesses": ["string","string","string"],
    "shareSummary": "string"
  },
  "evidence": ["string","string","string"],
  "goodFlow": ["string","string","string"],
  "riskSignals": ["string","string","string"],
  "actions": ["string","string","string"],
  "avoidActions": ["string","string","string"]
}
`.trim();

  console.log("[SAJU PROMPT STYLE]", { mode: "chat", persona: "ENTP_SHAMAN" });
  let aiResult = await callGemini<any>({
    prompt,
    systemInstruction: SAJU_PERSONA_SYSTEM,
    history: [],
  });

  const toneForbiddenCount = countForbiddenInObject(aiResult);
  const schemaCheck = validateStrictSchema(aiResult);

  if (toneForbiddenCount > 0 || !schemaCheck.ok) {
    console.warn("[SAJU][retry][chat] violations detected, retrying once", {
      toneForbiddenCount,
      schemaOk: schemaCheck.ok,
      schemaIssues: schemaCheck.issues.slice(0, 12),
    });
    aiResult = await callGemini<any>({
      prompt: `${prompt}

규칙 위반했다.
- 같은 JSON 스키마 그대로 다시 반환.
- 키 이름 바꾸지 마라.
- 모든 배열은 3개로 채워라. 빈 문자열 금지.
- structure/humanType 모든 필드 채워라. 빈 문자열 금지.
- 존댓말/설명체/위로체 금지. "~합니다/~있습니다/할 수 있습니다/중요합니다/추구합니다/필요합니다/바람직합니다/보입니다/경향이 있습니다" 금지.
`.trim(),
      systemInstruction: SAJU_PERSONA_SYSTEM,
      history: [],
    });
  }

  const parsed = normalizeCategoryReading(aiResult);

  const finalToneForbiddenCount = countForbiddenInObject(aiResult);
  const finalSchemaCheck = validateStrictSchema(aiResult);
  if (finalToneForbiddenCount > 0 || !finalSchemaCheck.ok) {
    console.error("[SAJU][retry][chat] still invalid after retry", {
      finalToneForbiddenCount,
      schemaOk: finalSchemaCheck.ok,
      schemaIssues: finalSchemaCheck.issues.slice(0, 20),
    });
    throw new Error(
      `Gemini chat result invalid (tone/schema). issues=${finalSchemaCheck.issues.slice(0, 10).join("; ")}`
    );
  }

  const mapped: UnifiedSajuResult = {
    ...fixed,
    summary: {
      ...fixed.summary,
      one_liner: parsed.one_liner,
    },
    analysis: {
      ...fixed.analysis,
      core_analysis: parsed.analysis,
      logic_basis: parsed.evidence,
      good_flow: parsed.goodFlow,
      risk_flow: parsed.riskSignals,
      action_now: parsed.actions,
      avoid_action: parsed.avoidActions,
    },
    extended_identity: {
      ...fixed.extended_identity,
      core_engine: parsed.structure.coreEngine,
      thinking_style: parsed.structure.thinkingAlgorithm,
      instinct_style: parsed.structure.instinctTemperament,
      motivation_core: parsed.structure.motivationCore,
      weakness_pattern: parsed.structure.weaknessPattern,
      relationship_pattern: parsed.structure.relationshipPattern,
    },
    human_type_card: {
      ...fixed.human_type_card,
      title: parsed.humanType.title,
      strengths: parsed.humanType.strengths,
      weaknesses: parsed.humanType.weaknesses,
      share_summary: parsed.humanType.shareSummary,
    },
  };

  console.log("[SAJU][chat] mapped result:", {
    one_liner: mapped.summary?.one_liner,
    core_analysis_len: mapped.analysis?.core_analysis?.filter(Boolean).length ?? 0,
    core_engine: mapped.extended_identity?.core_engine,
  });

  return mapped;
}
