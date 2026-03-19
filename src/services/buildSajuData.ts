import type { SajuProfile, SajuData } from "../types/saju";
import type { SajuData as GeminiSajuPayload } from "../lib/gemini";
import { calculateSajuFromProfile } from "../lib/saju";

/**
 * Build core SajuData from profile once. Uses front-end saju calculation only.
 * Do not rebuild from display/result objects.
 */
export function buildSajuData(profile: SajuProfile): SajuData {
  const calculated = calculateSajuFromProfile(profile);
  return { profile, calculated };
}

/**
 * Build Gemini API payload from SajuData. For use by summary/chat services only.
 */
export function toGeminiPayload(sajuData: SajuData): GeminiSajuPayload {
  const { profile, calculated } = sajuData;
  return {
    name: profile.name ?? "",
    ilgan: calculated.profile.ilgan_display || calculated.profile.ilgan,
    elements: calculated.elements,
    pillar: calculated.pillar,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    gender: profile.gender,
    strengthSummary: calculated.badges.strength,
    mbti: profile.mbti,
    zodiac_korean: profile.zodiac_korean,
    enneagram: profile.enneagram,
  };
}
