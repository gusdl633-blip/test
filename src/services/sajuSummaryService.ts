import type { SajuData, SajuProfile, SajuSummaryResult } from "../types/saju";
import { generateSajuSummary } from "../lib/gemini";
import { buildSajuData, toGeminiPayload } from "./buildSajuData";

function createSummaryResult(
  sajuData: SajuData,
  session_id: string,
  request_id: string,
  one_liner: string
): SajuSummaryResult {
  const { profile, calculated } = sajuData;
  return {
    session_id,
    request_id,
    profile: {
      name: profile.name || "",
      birth: profile.birthDate || "",
      calendar: String(profile.calendarType || ""),
      time: profile.birthTime || "",
      ilgan: calculated.profile.ilgan,
      ilgan_display: calculated.profile.ilgan_display,
      mbti: profile.mbti || "",
      zodiac_korean: profile.zodiac_korean || "",
      enneagram: profile.enneagram || "",
    },
    summary: { one_liner },
  };
}

/**
 * Gets summary from already-built SajuData.
 * Depends on SajuData, not profile-only input.
 */
export async function getSummary(
  sajuData: SajuData,
  sessionId: string,
  requestId: string
): Promise<SajuSummaryResult> {
  let one_liner = "";
  try {
    one_liner = await generateSajuSummary(toGeminiPayload(sajuData));
  } catch (error) {
    console.error("[sajuSummaryService/getSummary] generateSajuSummary failed:", error);
  }

  const fallback = "사주를 바탕으로 한 요약을 불러오는 중입니다.";
  return createSummaryResult(sajuData, sessionId, requestId, one_liner || fallback);
}

/**
 * Backward-compatible wrapper for existing callers.
 * App can migrate to getSummary(sajuData, ...) later.
 */
export async function fetchSummary(
  profile: SajuProfile,
  sessionId: string,
  requestId: string
): Promise<SajuSummaryResult> {
  return getSummary(buildSajuData(profile), sessionId, requestId);
}
