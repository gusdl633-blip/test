import type {
  DisplaySajuResult,
  SajuAnalysis,
  SajuCategoryReadingResult,
  SajuData,
  SajuExtendedIdentity,
  SajuHumanTypeCard,
  SajuProfile,
  SajuSummaryResult,
} from "../types/saju";
import { FORTUNE_CATEGORIES, type FortuneCategoryId } from "../constants/fortuneCategories";
import { generateSajuCategoryReading } from "../lib/gemini";
import { buildSajuData } from "./buildSajuData";

const SAJU_PERSONA_SYSTEM = `
너는 사주 기반 카테고리 해석 엔진이다.
- 입력된 데이터만 근거로 해석한다.
- JSON만 반환한다.
- 과장된 일반론, 반복 표현을 피한다.
`.trim();

type ReadingJson = {
  summary?: string;
  analysis?: Partial<SajuAnalysis>;
  extended_identity?: Partial<SajuExtendedIdentity>;
  human_type_card?: Partial<SajuHumanTypeCard>;
};

function normalizeText(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.trim().replace(/\s+/g, " ");
}

function normalizeArr(v: unknown, n = 3): string[] {
  const src = Array.isArray(v) ? v : [];
  const out = src.slice(0, n).map((x) => normalizeText(x));
  while (out.length < n) out.push("");
  return out;
}

function resultProfileFromSajuData(sajuData: SajuData): SajuCategoryReadingResult["profile"] {
  const { profile, calculated } = sajuData;
  return {
    name: profile.name || "",
    birth: profile.birthDate || "",
    calendar: String(profile.calendarType || ""),
    time: profile.birthTime || "",
    ilgan: calculated.profile.ilgan,
    ilgan_display: calculated.profile.ilgan_display,
    mbti: profile.mbti || "",
    zodiac_korean: profile.zodiac_korean || "",
    enneagram: profile.enneagram || "",
  };
}

function buildCategoryPrompt(categoryId: FortuneCategoryId | string): { label: string; prompt: string } {
  const label =
    FORTUNE_CATEGORIES.find((c) => c.id === categoryId)?.label ??
    (typeof categoryId === "string" ? categoryId : "카테고리");

  switch (categoryId) {
    case "overall":
      return { label, prompt: "전체 흐름, 핵심 강점, 반복 약점, 현재 주의점 중심으로 해석해라." };
    case "money":
      return { label, prompt: "재물 흐름, 소비 패턴, 손실 리스크, 지금 필요한 금전 행동을 해석해라." };
    case "love":
      return { label, prompt: "관계 성향, 감정 패턴, 반복 실수, 현재 연애/관계 주의점을 해석해라." };
    case "career":
      return { label, prompt: "일 방식, 강점 직무, 충돌 포인트, 현재 커리어 선택 리스크를 해석해라." };
    case "health":
      return { label, prompt: "체력 소모 패턴, 생활 취약점, 현재 건강 관리 우선순위를 해석해라." };
    case "year2026":
      return { label, prompt: "2026년의 전체 흐름, 기회, 리스크, 핵심 행동 원칙을 해석해라." };
    case "today":
      return { label, prompt: "오늘의 감정 흐름, 주의 행동, 밀어붙일 행동을 짧고 명확하게 해석해라." };
    default:
      return { label, prompt: "현재 운 흐름과 핵심 행동 포인트를 해석해라." };
  }
}

function parseReadingJson(rawText: string): ReadingJson {
  const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as ReadingJson;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0].replace(/,(\s*[}\]])/g, "$1")) as ReadingJson;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
      } catch {
        // fallthrough
      }
    }
  }
  return {};
}

function toReadingResult(
  sajuData: SajuData,
  summary: SajuSummaryResult | null,
  sessionId: string,
  requestId: string,
  parsed: ReadingJson
): SajuCategoryReadingResult {
  const oneLiner =
    normalizeText(parsed.summary) ||
    summary?.summary?.one_liner ||
    "카테고리 해석을 불러오는 중입니다.";

  const analysis: SajuAnalysis = {
    core_analysis: normalizeArr(parsed.analysis?.core_analysis),
    logic_basis: normalizeArr(parsed.analysis?.logic_basis),
    good_flow: normalizeArr(parsed.analysis?.good_flow),
    risk_flow: normalizeArr(parsed.analysis?.risk_flow),
    action_now: normalizeArr(parsed.analysis?.action_now),
    avoid_action: normalizeArr(parsed.analysis?.avoid_action),
  };

  const extended_identity: SajuExtendedIdentity = {
    human_type: normalizeText(parsed.extended_identity?.human_type),
    core_engine: normalizeText(parsed.extended_identity?.core_engine),
    thinking_style: normalizeText(parsed.extended_identity?.thinking_style),
    instinct_style: normalizeText(parsed.extended_identity?.instinct_style),
    motivation_core: normalizeText(parsed.extended_identity?.motivation_core),
    weakness_pattern: normalizeText(parsed.extended_identity?.weakness_pattern),
    relationship_pattern: normalizeText(parsed.extended_identity?.relationship_pattern),
    compatibility_type: normalizeText(parsed.extended_identity?.compatibility_type),
  };

  const human_type_card: SajuHumanTypeCard = {
    title: normalizeText(parsed.human_type_card?.title),
    strengths: normalizeArr(parsed.human_type_card?.strengths),
    weaknesses: normalizeArr(parsed.human_type_card?.weaknesses),
    share_summary: normalizeText(parsed.human_type_card?.share_summary),
  };

  return {
    session_id: sessionId,
    request_id: requestId,
    profile: resultProfileFromSajuData(sajuData),
    summary: { one_liner: oneLiner },
    analysis,
    extended_identity,
    human_type_card,
  };
}

/**
 * Primary API for category reading.
 * Uses sajuData as source of truth; summary is optional extra context.
 */
export async function getReading(
  sajuData: SajuData,
  summary: SajuSummaryResult | null,
  categoryId: string,
  sessionId: string,
  requestId: string
): Promise<SajuCategoryReadingResult> {
  const { label, prompt } = buildCategoryPrompt(categoryId);
  const core = {
    profile: {
      name: sajuData.profile.name,
      gender: sajuData.profile.gender,
      birthDate: sajuData.profile.birthDate,
      birthTime: sajuData.profile.birthTime,
      mbti: sajuData.profile.mbti,
      zodiac_korean: sajuData.profile.zodiac_korean,
      enneagram: sajuData.profile.enneagram,
    },
    saju: {
      ilgan: sajuData.calculated.profile.ilgan_display || sajuData.calculated.profile.ilgan,
      pillar: sajuData.calculated.pillar,
      elements: sajuData.calculated.elements,
      badges: sajuData.calculated.badges,
    },
    summaryHint: summary?.summary?.one_liner ?? "",
  };

  const categoryPrompt = `
[카테고리]
id: ${categoryId}
label: ${label}
지시: ${prompt}

[핵심 데이터]
${JSON.stringify(core, null, 2)}

반드시 JSON만 반환:
{
  "summary": "string",
  "analysis": {
    "core_analysis": ["string","string","string"],
    "logic_basis": ["string","string","string"],
    "good_flow": ["string","string","string"],
    "risk_flow": ["string","string","string"],
    "action_now": ["string","string","string"],
    "avoid_action": ["string","string","string"]
  },
  "extended_identity": {
    "human_type": "string",
    "core_engine": "string",
    "thinking_style": "string",
    "instinct_style": "string",
    "motivation_core": "string",
    "weakness_pattern": "string",
    "relationship_pattern": "string",
    "compatibility_type": "string"
  },
  "human_type_card": {
    "title": "string",
    "strengths": ["string","string","string"],
    "weaknesses": ["string","string","string"],
    "share_summary": "string"
  }
}
`;

  let raw = "";
  try {
    raw = await generateSajuCategoryReading({
      systemInstruction: SAJU_PERSONA_SYSTEM,
      prompt: categoryPrompt,
    });
  } catch (error) {
    console.error("[sajuReadingService/getReading] failed:", error);
  }

  return toReadingResult(sajuData, summary, sessionId, requestId, parseReadingJson(raw));
}

/** Convert SajuCategoryReadingResult to DisplaySajuResult for UI. */
function toDisplayReading(sajuData: SajuData, reading: SajuCategoryReadingResult): DisplaySajuResult {
  const { calculated } = sajuData;
  return {
    ...reading,
    summary: { tone: "entp_shaman_female_30s", one_liner: reading.summary.one_liner },
    badges: calculated.badges,
    pillar: calculated.pillar,
    elements: calculated.elements,
    sinsal: calculated.sinsal,
    chat_seed_questions: [],
    original: {
      pillar: calculated.pillar,
      elements: calculated.elements,
      sinsal: calculated.sinsal,
      badges: calculated.badges,
    },
  };
}

/**
 * Backward-compat: build SajuData from profile, call getReading, convert to DisplaySajuResult for UI.
 * Prefer getReading(sajuData, summary, ...) when App stores sajuData.
 */
export async function fetchCategoryReading(
  profile: SajuProfile,
  summary: SajuSummaryResult | null,
  categoryId: string,
  sessionId: string,
  requestId: string
): Promise<DisplaySajuResult> {
  const sajuData = buildSajuData(profile);
  const reading = await getReading(sajuData, summary, categoryId, sessionId, requestId);
  return toDisplayReading(sajuData, reading);
}
