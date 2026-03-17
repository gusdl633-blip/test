import type { SajuProfile, UnifiedSajuResult } from "../types";
export type { SajuProfile, UnifiedSajuResult };

import { calculateSajuFromProfile, type CalculatedSaju } from "../lib/sajuCalculator";

type ChatHistoryItem = { role: string; message: string };

const SAJU_PERSONA_SYSTEM = `
너는 "천명(天命) FUTURISTIC SAJU" 전용 분석 엔진이다. 30대 여성 ENTP 무당 캐릭터다.
역할: 사주 원국 계산 금지. 이미 계산된 사주 데이터를 근거로 해석 문장만 만든다.

절대 규칙:
- JSON만 출력. pillar, elements, sinsal, badges 생성/수정 금지.
- 반말만. 존댓말·상담사 톤·위로·교훈·격려 금지.
- 설명 금지. 분석 리포트 톤 금지. 중립적 서술 금지.
- "너"한테 직접 말하듯이 써라. 말하듯이 끊어라.
- 한 문장 = 한 방. 직설. 날카롭게. 판단·긴장·모순 있어도 됨.

문장 스타일(강제):
- 주어 넣어라: "너", "지금 상태", "이 흐름".
- 좋은 예: "너 지금 변화 욕구 터진 상태다." "너 감정 표현 안 한다. 그래서 관계 오래 못 간다." "너 구속 들어오면 바로 답답해한다."
- 금지: "~하는 시기다", "~경향이 있다", "~문제가 발생한다", "~영향을 준다", "~추구하는 성향이다", "~부족하다" (단독). "합니다/있습니다/할 수 있습니다/중요합니다/추구합니다/필요합니다/바람직합니다/보입니다/경향이 있습니다" 전부 금지.
`.trim();

/** Chat-only: minimum length and multi-sentence. Append to SAJU_PERSONA_SYSTEM for chat. */
const SAJU_CHAT_LENGTH_RULES = `
상담 응답 전용 규칙:
- 각 응답은 최소 100자 이상으로 작성한다.
- 짧게 끊지 말고 2~4문장으로 이어서 설명한다.
- 단, 불필요한 감성 표현 없이 직설적으로 말한다.
- 1문장: 핵심 판단. 2문장: 이유. 3문장: 결과/경고. 이 흐름 권장.
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

/** Returns raw response text from Gemini (no parse). Use for safe parse pipeline. */
async function getGeminiRawText(payload: {
  prompt: string;
  systemInstruction: string;
  history?: { role: "user" | "model"; text: string }[];
}): Promise<string> {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  return typeof data?.text === "string" ? data.text : "{}";
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

/** Safe fallback when Gemini parse fails or content is unusable. Preserves original saju and base metadata. */
function createSafeCategoryFallback(fixed: UnifiedSajuResult): UnifiedSajuResult {
  return {
    ...fixed,
    original: fixed.original ?? {
      pillar: fixed.pillar,
      elements: fixed.elements,
      sinsal: fixed.sinsal,
      badges: fixed.badges,
    },
    summary: { ...fixed.summary, one_liner: fixed.summary?.one_liner ?? "" },
    analysis: {
      core_analysis: [],
      logic_basis: [],
      good_flow: [],
      risk_flow: [],
      action_now: [],
      avoid_action: [],
    },
    extended_identity: {
      ...fixed.extended_identity,
      core_engine: "",
      thinking_style: "",
      instinct_style: "",
      motivation_core: "",
      weakness_pattern: "",
      relationship_pattern: "",
    },
    human_type_card: {
      title: "",
      strengths: [],
      weaknesses: [],
      share_summary: "",
    },
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

const MIN_ARRAY_LEN = 3;
const MAX_ARRAY_PAD = 3;

function asString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return String(value);
}

function asStringArray(value: unknown, maxPad: number = MAX_ARRAY_PAD): string[] {
  if (!Array.isArray(value)) return [];
  const list = value
    .slice(0, maxPad)
    .map((v) => (typeof v === "string" ? v : v != null ? String(v) : ""));
  while (list.length < maxPad) list.push("");
  return list;
}

/** Trim, remove repeated punctuation and markdown remnants; optionally apply light tone cleanup. */
function cleanSentence(value: unknown): string {
  let s = asString(value).trim();
  if (!s) return "";
  s = s.replace(/\s+/g, " ").replace(/([.,!?])\1+/g, "$1");
  s = s.replace(/^```\w*\s*|\s*```$/g, "").trim();
  return rewriteStiffPhrases(s);
}

function cleanSentenceArray(value: unknown, maxPad: number = MAX_ARRAY_PAD): string[] {
  const arr = asStringArray(value, maxPad);
  return arr.map((v) => cleanSentence(v));
}

function ensureStringArray(arr: unknown, minLen: number = MIN_ARRAY_LEN): string[] {
  const list = Array.isArray(arr)
    ? arr.slice(0, minLen).map((v) => (typeof v === "string" ? v.trim() : v != null ? String(v).trim() : ""))
    : [];
  while (list.length < minLen) list.push("");
  return list;
}

/** Flexible raw schema from Gemini (all optional). */
type RawCategorySchema = {
  analysis?: string[];
  structure?: {
    coreEngine?: string;
    thinkingAlgorithm?: string;
    instinctTemperament?: string;
    motivationCore?: string;
    weaknessPattern?: string;
    relationshipPattern?: string;
  };
  humanType?: {
    title?: string;
    strengths?: string[];
    weaknesses?: string[];
    shareSummary?: string;
  };
  evidence?: string[];
  goodFlow?: string[];
  riskSignals?: string[];
  actions?: string[];
  avoidActions?: string[];
};

function normalizeCategoryReading(aiResult: any) {
  const raw = aiResult && typeof aiResult === "object" ? aiResult : {};

  const analysis = cleanSentenceArray(raw.analysis);
  const evidence = cleanSentenceArray(raw.evidence);
  const goodFlow = cleanSentenceArray(raw.goodFlow);
  const riskSignals = cleanSentenceArray(raw.riskSignals);
  const actions = cleanSentenceArray(raw.actions);
  const avoidActions = cleanSentenceArray(raw.avoidActions);

  const structure = {
    coreEngine: cleanSentence(raw.structure?.coreEngine),
    thinkingAlgorithm: cleanSentence(raw.structure?.thinkingAlgorithm),
    instinctTemperament: cleanSentence(raw.structure?.instinctTemperament),
    motivationCore: cleanSentence(raw.structure?.motivationCore),
    weaknessPattern: cleanSentence(raw.structure?.weaknessPattern),
    relationshipPattern: cleanSentence(raw.structure?.relationshipPattern),
  };

  const humanType = {
    title: cleanSentence(raw.humanType?.title),
    strengths: cleanSentenceArray(raw.humanType?.strengths),
    weaknesses: cleanSentenceArray(raw.humanType?.weaknesses),
    shareSummary: cleanSentence(raw.humanType?.shareSummary),
  };

  const one_liner =
    (analysis[0] && analysis[0].trim()) ||
    (humanType.shareSummary && humanType.shareSummary.trim()) ||
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

/** Strip markdown wrappers and try parse; if fail, try extract first {...} and remove trailing commas. */
function tryParseJson(rawText: string): { ok: true; data: RawCategorySchema } | { ok: false } {
  let cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  try {
    const data = JSON.parse(cleaned) as RawCategorySchema;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return { ok: true, data };
    }
  } catch {
    // try recover: first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      let block = match[0];
      block = block.replace(/,(\s*[}\]])/g, "$1");
      try {
        const data = JSON.parse(block) as RawCategorySchema;
        if (data && typeof data === "object" && !Array.isArray(data)) {
          return { ok: true, data };
        }
      } catch {
        // ignore
      }
    }
  }
  return { ok: false };
}

/**
 * Central safe pipeline: parse raw Gemini text, normalize, map to UnifiedSajuResult.
 * Never throws for parse/schema/tone. Returns fallback result when parse fails or content unusable.
 */
function safeParseAndNormalizeCategoryReading(
  rawText: string,
  fixed: UnifiedSajuResult
): UnifiedSajuResult {
  console.log("[SAJU][raw Gemini text]", rawText?.slice(0, 200) + (rawText?.length > 200 ? "…" : ""));

  const parsed = tryParseJson(rawText);
  if (!parsed.ok) {
    console.warn("[SAJU][fallback] using safe fallback result (parse failed)");
    return createSafeCategoryFallback(fixed);
  }

  const raw = parsed.data;
  console.log("[SAJU][parsed raw object]", { keys: Object.keys(raw || {}) });

  const schemaCheck = validateStrictSchema(raw);
  if (!schemaCheck.ok) {
    console.warn("[SAJU][schema] partial but recoverable", { issues: schemaCheck.issues.slice(0, 8) });
  }

  const toneCount = countForbiddenInObject(raw);
  if (toneCount > 0) {
    console.warn("[SAJU][tone] cleaned locally", { violationCount: toneCount });
  }

  const normalized = normalizeCategoryReading(raw);
  const withTone = applyToneToParsed(normalized as unknown as Record<string, unknown>) as typeof normalized;

  const mapped: UnifiedSajuResult = {
    ...fixed,
    original: {
      pillar: fixed.pillar,
      elements: fixed.elements,
      sinsal: fixed.sinsal,
      badges: fixed.badges,
    },
    summary: { ...fixed.summary, one_liner: withTone.one_liner },
    analysis: {
      ...fixed.analysis,
      core_analysis: withTone.analysis,
      logic_basis: withTone.evidence,
      good_flow: withTone.goodFlow,
      risk_flow: withTone.riskSignals,
      action_now: withTone.actions,
      avoid_action: withTone.avoidActions,
    },
    extended_identity: {
      ...fixed.extended_identity,
      core_engine: withTone.structure.coreEngine,
      thinking_style: withTone.structure.thinkingAlgorithm,
      instinct_style: withTone.structure.instinctTemperament,
      motivation_core: withTone.structure.motivationCore,
      weakness_pattern: withTone.structure.weaknessPattern,
      relationship_pattern: withTone.structure.relationshipPattern,
    },
    human_type_card: {
      ...fixed.human_type_card,
      title: withTone.humanType.title,
      strengths: withTone.humanType.strengths,
      weaknesses: withTone.humanType.weaknesses,
      share_summary: withTone.humanType.shareSummary,
    },
  };

  return mapped;
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
    "경향이 있다",
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
    "시기다",
    "시기이다",
    "문제가 발생",
    "문제를 일으킨다",
    "영향을 준다",
    "영향을 미친다",
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

/** Post-process: rewrite stiff/report phrases to direct speech. No Gemini call. */
function rewriteStiffPhrases(s: string): string {
  if (typeof s !== "string" || !s.trim()) return s;
  let t = s.trim();
  t = t.replace(/(.+)(하는 시기다)/g, "지금 $1한다");
  t = t.replace(/(.+)(하는 시기이다)/g, "지금 $1한다");
  t = t.replace(/시기다\.?$/g, "다.");
  t = t.replace(/시기이다\.?$/g, "다.");
  t = t.replace(/문제가 발생한다/g, "문제 터진다");
  t = t.replace(/문제를 일으킨다/g, "문제 터진다");
  t = t.replace(/영향을 준다/g, "영향 바로 간다");
  t = t.replace(/영향을 미친다/g, "영향 바로 간다");
  t = t.replace(/(.+)(경향이 있다)/g, "$1쪽이다");
  t = t.replace(/(.+)(경향이 있다\.?)/g, "$1쪽이다.");
  t = t.replace(/경향이 있다\.?/g, "쪽이다.");
  t = t.replace(/경향이 강하다\.?/g, "강하다.");
  t = t.replace(/할 수 있다\.?/g, "한다.");
  t = t.replace(/할 수 있습니다/g, "한다.");
  t = t.replace(/할 수 있\./g, "한다.");
  t = t.replace(/해 줄 수 있다\.?/g, "해 준다.");
  t = t.replace(/될 수 있다\.?/g, "된다.");
  return t;
}

function applyToneToParsed<T extends Record<string, unknown>>(parsed: T): T {
  const out = { ...parsed } as T;
  const rewrite = (v: unknown): unknown => {
    if (typeof v === "string") return rewriteStiffPhrases(v);
    if (Array.isArray(v)) return v.map(rewrite);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const o = {} as Record<string, unknown>;
      for (const [k, val] of Object.entries(v)) o[k] = rewrite(val);
      return o;
    }
    return v;
  };
  for (const key of Object.keys(out)) {
    (out as Record<string, unknown>)[key] = rewrite((out as Record<string, unknown>)[key]);
  }
  return out;
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

/** True if we can safely normalize (object with expected shape). Only throw when this is false. */
function isRecoverableSchema(obj: unknown): boolean {
  return (
    obj != null &&
    typeof obj === "object" &&
    !Array.isArray(obj) &&
    Object.prototype.toString.call(obj) === "[object Object]"
  );
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
7. 문장 스타일: "너"한테 말하듯이. 한 문장에 주어(너/지금 상태/이 흐름) 넣어라. "~하는 시기다" "~경향이 있다" "~문제가 발생한다" 금지. "지금 ~다" "너 ~한다" "~ 때문에 꼬인다" 써라.

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

  let rawText: string;
  try {
    rawText = await getGeminiRawText({
      prompt,
      systemInstruction: SAJU_PERSONA_SYSTEM,
      history: [],
    });
  } catch (err) {
    console.error("[SAJU][fatal] unrecoverable Gemini result", err);
    throw err;
  }

  const mapped = safeParseAndNormalizeCategoryReading(rawText, fixed);

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

반드시 한국어로만 답해라. JSON만 반환해라.
문장 스타일: "너"한테 말하듯이. 한 문장에 주어 넣어라. "~하는 시기다" "~경향이 있다" "~문제가 발생한다" 금지. "지금 ~다" "너 ~한다" 써라.

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

  let rawText: string;
  try {
    rawText = await getGeminiRawText({
      prompt,
      systemInstruction: SAJU_PERSONA_SYSTEM,
      history: [],
    });
  } catch (err) {
    console.error("[SAJU][fatal] unrecoverable Gemini result (chat)", err);
    throw err;
  }

  const mapped = safeParseAndNormalizeCategoryReading(rawText, fixed);

  console.log("[SAJU][chat] mapped result:", {
    one_liner: mapped.summary?.one_liner,
    core_analysis_len: mapped.analysis?.core_analysis?.filter(Boolean).length ?? 0,
    core_engine: mapped.extended_identity?.core_engine,
  });

  return mapped;
}
