import type {
  DisplaySajuResult,
  SajuCategoryReadingResult,
  SajuData,
  SajuSummaryResult,
} from "../types/saju";
import type { GeminiMessage } from "../lib/gemini";
import { generateSajuCategoryReading } from "../lib/gemini";
import { buildSajuData } from "./buildSajuData";

const FALLBACK_REPLY = "현재 응답을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.";
const FALLBACK_EMPTY = "답변을 생성하지 못했습니다. 질문을 다시 구체적으로 적어 주세요.";

const CHAT_SYSTEM = `
사주 상담 챗봇이다. 주어진 맥락만으로 질문에 직접 답한다.
같은 문장·같은 결론 반복 금지. 구체적으로, 짧게. 한국어 상담체.
`.trim();

/**
 * Compact context for chat: no full reading JSON.
 * - profile: minimal from sajuData
 * - summaryOneLiner: one line only
 * - category: current category title
 * - keyTraits: 2–4 short strings from extended_identity
 * - recentMessages: last 5 as strings
 */
export type CompactChatContext = {
  profile: {
    name: string;
    gender?: string;
    birthDate?: string;
    birthTime?: string;
    mbti?: string;
    zodiac_korean?: string;
    enneagram?: string;
  };
  summaryOneLiner: string;
  category: string;
  keyTraits: string[];
  recentMessages: string[];
};

function buildCompactContext(
  sajuData: SajuData,
  summary: SajuSummaryResult | null,
  reading: SajuCategoryReadingResult | null,
  recentMessages: string[]
): CompactChatContext {
  const { profile } = sajuData;
  const summaryOneLiner = summary?.summary?.one_liner ?? "";
  const category = reading?.human_type_card?.title ?? "";
  const keyTraits: string[] = [];
  if (reading?.extended_identity) {
    const e = reading.extended_identity;
    if (e.core_engine) keyTraits.push(e.core_engine);
    if (e.thinking_style) keyTraits.push(e.thinking_style);
    if (e.motivation_core) keyTraits.push(e.motivation_core);
    if (e.weakness_pattern) keyTraits.push(e.weakness_pattern);
    if (e.relationship_pattern) keyTraits.push(e.relationship_pattern);
  }
  return {
    profile: {
      name: profile.name,
      gender: profile.gender,
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      mbti: profile.mbti,
      zodiac_korean: profile.zodiac_korean,
      enneagram: profile.enneagram,
    },
    summaryOneLiner,
    category,
    keyTraits: keyTraits.slice(0, 4),
    recentMessages: recentMessages.slice(-5),
  };
}

function formatCompactPrompt(context: CompactChatContext, userMessage: string): string {
  const lines: string[] = [
    "[프로필]",
    `이름: ${context.profile.name}`,
    context.profile.gender ? `성별: ${context.profile.gender}` : "",
    context.profile.birthDate ? `생년월일: ${context.profile.birthDate}` : "",
    context.profile.birthTime ? `출생시간: ${context.profile.birthTime}` : "",
    context.profile.mbti ? `MBTI: ${context.profile.mbti}` : "",
    context.profile.zodiac_korean ? `별자리: ${context.profile.zodiac_korean}` : "",
    context.profile.enneagram ? `에니어그램: ${context.profile.enneagram}` : "",
  ].filter(Boolean);

  if (context.summaryOneLiner) {
    lines.push("", "[요약 한줄]", context.summaryOneLiner);
  }
  if (context.category) {
    lines.push("", "[현재 카테고리]", context.category);
  }
  if (context.keyTraits.length > 0) {
    lines.push("", "[핵심 특성]", ...context.keyTraits);
  }
  if (context.recentMessages.length > 0) {
    lines.push("", "[최근 대화]", ...context.recentMessages);
  }

  lines.push("", "[현재 질문]", userMessage);
  lines.push("", "위 맥락만 참고해 질문에 직접 답해. 반복 표현 쓰지 마라.");
  return lines.join("\n");
}

function toDisplayResult(
  sajuData: SajuData,
  summary: SajuSummaryResult | null,
  reading: SajuCategoryReadingResult | null,
  reply: string,
  sessionId: string,
  requestId: string
): DisplaySajuResult {
  const { profile, calculated } = sajuData;
  const baseProfile = {
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
  const emptyIdentity = {
    human_type: "",
    core_engine: "",
    thinking_style: "",
    instinct_style: "",
    motivation_core: "",
    weakness_pattern: "",
    relationship_pattern: "",
  };
  const emptyAnalysis = {
    core_analysis: [],
    logic_basis: [],
    good_flow: [],
    risk_flow: [],
    action_now: [],
    avoid_action: [],
  };
  const emptyHumanCard = {
    title: "",
    strengths: [],
    weaknesses: [],
    share_summary: "",
  };
  return {
    session_id: sessionId,
    request_id: requestId,
    profile: baseProfile,
    badges: calculated.badges,
    pillar: calculated.pillar,
    elements: calculated.elements,
    sinsal: calculated.sinsal,
    extended_identity: reading?.extended_identity ?? emptyIdentity,
    analysis: reading?.analysis ?? emptyAnalysis,
    summary: { tone: "entp_shaman_female_30s", one_liner: reply },
    human_type_card: reading?.human_type_card ?? emptyHumanCard,
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
 * Chat using SajuData as primary source. Compact context only; no full reading JSON.
 */
export async function chatReply(
  sajuData: SajuData,
  summary: SajuSummaryResult | null,
  reading: SajuCategoryReadingResult | null,
  userMessage: string,
  sessionId: string,
  requestId: string,
  recentMessages?: string[]
): Promise<DisplaySajuResult> {
  const context = buildCompactContext(
    sajuData,
    summary,
    reading,
    recentMessages ?? []
  );
  const prompt = formatCompactPrompt(context, userMessage);

  let reply = "";
  try {
    reply = await generateSajuCategoryReading({
      systemInstruction: CHAT_SYSTEM,
      prompt,
    });
  } catch (err) {
    console.error("[sajuChatService] chatReply failed:", err);
    reply = FALLBACK_REPLY;
  }
  if (!reply.trim()) reply = FALLBACK_EMPTY;

  return toDisplayResult(sajuData, summary, reading, reply, sessionId, requestId);
}

/**
 * Backward-compat: profile + display summary/reading. Builds sajuData and calls chatReply.
 * ChatInterface uses this until App passes sajuData.
 */
export async function chatReplyWithProfile(
  profile: import("../types/saju").SajuProfile,
  summaryResult: DisplaySajuResult | null,
  userMessage: string,
  sessionId: string,
  requestId: string,
  recentMessages?: GeminiMessage[]
): Promise<DisplaySajuResult> {
  const sajuData = buildSajuData(profile);
  const summary: SajuSummaryResult | null = summaryResult
    ? {
        session_id: summaryResult.session_id,
        request_id: summaryResult.request_id,
        profile: summaryResult.profile,
        summary: summaryResult.summary,
      }
    : null;
  const reading: SajuCategoryReadingResult | null =
    summaryResult &&
    "analysis" in summaryResult &&
    "extended_identity" in summaryResult &&
    "human_type_card" in summaryResult
      ? (summaryResult as unknown as SajuCategoryReadingResult)
      : null;
  const recentStr = (recentMessages ?? []).map((m) => `${m.role}: ${m.text}`);
  return chatReply(
    sajuData,
    summary,
    reading,
    userMessage,
    sessionId,
    requestId,
    recentStr
  );
}
