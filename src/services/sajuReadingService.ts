import type {
  SajuAnalysis,
  SajuCategoryReadingResult,
  SajuData,
  SajuExtendedIdentity,
  SajuHumanTypeCard,
  SajuSummaryResult,
} from "../types/saju";
import { FORTUNE_CATEGORIES, type FortuneCategoryId } from "../constants/fortuneCategories";
import { generateSajuCategoryReading } from "../lib/gemini";

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

/** Non-empty strings only — avoids ResultCard showing blank “filled” slots. */
function normalizeStringList(v: unknown, maxItems = 8): string[] {
  const src = Array.isArray(v) ? v : [];
  return src.map((x) => normalizeText(x)).filter(Boolean).slice(0, maxItems);
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

function stripFences(raw: string): string {
  return raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
}

/** Any user-visible string in the parsed JSON tree (for empty-schema fallback). */
function collectStringLeaves(obj: unknown, out: string[] = []): string[] {
  if (typeof obj === "string") {
    const t = normalizeText(obj);
    if (t) out.push(t);
  } else if (Array.isArray(obj)) {
    obj.forEach((x) => collectStringLeaves(x, out));
  } else if (obj && typeof obj === "object") {
    Object.values(obj).forEach((x) => collectStringLeaves(x, out));
  }
  return out;
}

function parsedHasDisplayableContent(p: ReadingJson): boolean {
  if (normalizeText(p.summary)) return true;
  const core = p.analysis?.core_analysis;
  if (Array.isArray(core) && core.some((x) => normalizeText(x))) return true;
  if (p.extended_identity && Object.values(p.extended_identity).some((v) => normalizeText(v as string)))
    return true;
  if (p.human_type_card?.title && normalizeText(p.human_type_card.title)) return true;
  const h = p.human_type_card;
  if (h && Array.isArray(h.strengths) && h.strengths.some((x) => normalizeText(x))) return true;
  if (h && Array.isArray(h.weaknesses) && h.weaknesses.some((x) => normalizeText(x))) return true;
  return false;
}

function firstMeaningfulSentence(text: string, maxLen = 220): string {
  const t = normalizeText(text);
  if (!t) return "";
  const byStop = t.split(/(?<=[.!?。])\s+/);
  for (const s of byStop) {
    const n = normalizeText(s);
    if (n.length >= 8) return n.slice(0, maxLen);
  }
  const line = t
    .split(/\n/)
    .map(normalizeText)
    .find((l) => l.length >= 4);
  if (line) return line.slice(0, maxLen);
  return t.slice(0, maxLen);
}

function splitCoreParagraphs(text: string, max = 10): string[] {
  const t = normalizeText(text.replace(/\r\n/g, "\n"));
  if (!t) return [];
  let parts = t
    .split(/\n{2,}/)
    .map((p) => normalizeText(p))
    .filter(Boolean);
  if (parts.length === 0) return [];
  if (parts.length === 1 && parts[0].length > 700) {
    const sentences = parts[0]
      .split(/(?<=[.!?。])\s+/)
      .map((s) => normalizeText(s))
      .filter(Boolean);
    return sentences.slice(0, max);
  }
  return parts.slice(0, max);
}

/**
 * If Gemini returns prose or empty JSON slots, merge into a displayable ReadingJson.
 * (Previously: parse failed → {} → normalizeArr padded "", → ResultCard filter(Boolean) === 0 → “empty” UI.)
 */
function enrichReadingFromRaw(
  raw: string,
  parsed: ReadingJson,
  categoryId: string,
  categoryLabel: string,
  summaryHint: string
): ReadingJson {
  const trimmed = raw.trim();
  if (!trimmed) return parsed;

  if (parsedHasDisplayableContent(parsed)) return parsed;

  const stripped = stripFences(trimmed);
  const leaves = collectStringLeaves(parsed);

  if (leaves.length > 0) {
    const headline = firstMeaningfulSentence(leaves.join(" ")) || leaves[0];
    return {
      ...parsed,
      summary: normalizeText(parsed.summary) || headline,
      analysis: {
        ...parsed.analysis,
        core_analysis: leaves.slice(0, 10),
      },
    };
  }

  if (/^\s*\{/.test(stripped) && !parsedHasDisplayableContent(parsed)) {
    const msg =
      summaryHint ||
      "모델이 비어 있는 JSON을 반환했습니다. 잠시 후 카테고리를 다시 선택해 주세요.";
    return {
      summary: msg,
      analysis: {
        core_analysis: [msg],
      },
    };
  }

  const headline =
    firstMeaningfulSentence(stripped) ||
    `${categoryLabel} 운세`.trim() ||
    `${categoryId} 카테고리 해석`;
  let core = splitCoreParagraphs(stripped, 12);
  if (core.length === 0) core = [stripped.slice(0, 4000) || headline];

  return {
    ...parsed,
    summary: normalizeText(parsed.summary) || headline,
    analysis: {
      ...parsed.analysis,
      core_analysis: core,
    },
  };
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

  let core_analysis = normalizeStringList(parsed.analysis?.core_analysis);
  if (core_analysis.length === 0 && normalizeText(parsed.summary)) {
    core_analysis = [normalizeText(parsed.summary)];
  }
  if (core_analysis.length === 0) {
    core_analysis = [oneLiner];
  }

  const analysis: SajuAnalysis = {
    core_analysis,
    logic_basis: normalizeStringList(parsed.analysis?.logic_basis),
    good_flow: normalizeStringList(parsed.analysis?.good_flow),
    risk_flow: normalizeStringList(parsed.analysis?.risk_flow),
    action_now: normalizeStringList(parsed.analysis?.action_now),
    avoid_action: normalizeStringList(parsed.analysis?.avoid_action),
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
    strengths: normalizeStringList(parsed.human_type_card?.strengths),
    weaknesses: normalizeStringList(parsed.human_type_card?.weaknesses),
    share_summary: normalizeText(parsed.human_type_card?.share_summary),
  };

  const result: SajuCategoryReadingResult = {
    session_id: sessionId,
    request_id: requestId,
    profile: resultProfileFromSajuData(sajuData),
    summary: { one_liner: oneLiner },
    analysis,
    extended_identity,
    human_type_card,
  };

  if (import.meta.env.DEV) {
    console.info("[SAJU][reading] normalized SajuCategoryReadingResult", {
      one_liner: result.summary.one_liner,
      core_analysis_len: result.analysis.core_analysis.length,
      core_preview: result.analysis.core_analysis[0]?.slice(0, 120),
    });
  }

  return result;
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

  console.log("[DEBUG] categoryPrompt:", categoryPrompt);

  let finalPrompt = categoryPrompt;
  if (!finalPrompt || !finalPrompt.trim()) {
    finalPrompt = `[카테고리]\nid: ${categoryId}\nlabel: ${label}\n지시: ${prompt}\n\n[핵심 데이터]\n${JSON.stringify(core, null, 2)}\n\n반드시 스키마에 맞는 JSON만 반환해라.`;
  }

  const readingParams = {
    systemInstruction: SAJU_PERSONA_SYSTEM,
    prompt: finalPrompt,
  };
  console.log("[DEBUG] params.prompt:", readingParams.prompt);

  let raw = "";
  try {
    raw = await generateSajuCategoryReading(readingParams);
  } catch (error) {
    console.error("[sajuReadingService/getReading] failed:", error);
  }

  if (import.meta.env.DEV) {
    console.info("[SAJU][reading] raw Gemini category text", {
      categoryId,
      length: raw.length,
      preview: raw.slice(0, 400),
    });
  }

  const parsedJson = parseReadingJson(raw);
  if (import.meta.env.DEV) {
    console.info("[SAJU][reading] parseReadingJson result", {
      keys: Object.keys(parsedJson),
      hasDisplayable: parsedHasDisplayableContent(parsedJson),
    });
  }

  const enriched = enrichReadingFromRaw(
    raw,
    parsedJson,
    categoryId,
    label,
    summary?.summary?.one_liner ?? ""
  );

  if (import.meta.env.DEV) {
    const sum = enriched.summary;
    console.info("[SAJU][reading] after enrichReadingFromRaw", {
      summary: typeof sum === "string" ? sum.slice(0, 120) : sum,
      core_len: Array.isArray(enriched.analysis?.core_analysis)
        ? enriched.analysis!.core_analysis!.length
        : 0,
    });
  }

  return toReadingResult(sajuData, summary, sessionId, requestId, enriched);
}
