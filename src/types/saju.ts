/**
 * Centralized saju types.
 * SajuData = core state. SajuSummaryResult / SajuCategoryReadingResult = strict service result shapes.
 * DisplaySajuResult = full UI shape (boundary only).
 */

import type { CalculatedSaju } from "../lib/saju";

export interface SajuProfile {
  name: string;
  gender: "male" | "female";
  birthDate: string;
  birthTime: string;
  calendarType: "solar" | "lunar";
  location?: string;
  timeKnown: boolean;
  mbti?: string;
  zodiac_korean?: string;
  enneagram?: string;
}

/** Core state: profile + calculated saju. Single source of truth. */
export interface SajuData {
  profile: SajuProfile;
  calculated: CalculatedSaju;
}

/** Profile shape in result/display objects (ilgan, birth, calendar, etc.). */
export interface SajuResultProfile {
  name: string;
  birth: string;
  calendar: string;
  time: string;
  ilgan: string;
  ilgan_display: string;
  mbti?: string;
  zodiac_korean?: string;
  enneagram?: string;
}

/** Minimal summary result: session, profile, one_liner only. */
export interface SajuSummaryResult {
  session_id: string;
  request_id: string;
  profile: SajuResultProfile;
  summary: { one_liner: string };
}

/** Analysis block (category reading). */
export interface SajuAnalysis {
  core_analysis: string[];
  logic_basis: string[];
  good_flow: string[];
  risk_flow: string[];
  action_now: string[];
  avoid_action: string[];
}

/** Extended identity block (category reading). */
export interface SajuExtendedIdentity {
  human_type: string;
  core_engine: string;
  thinking_style: string;
  instinct_style: string;
  motivation_core: string;
  weakness_pattern: string;
  relationship_pattern: string;
  compatibility_type?: string;
}

/** Human type card block (category reading). */
export interface SajuHumanTypeCard {
  title: string;
  strengths: string[];
  weaknesses: string[];
  share_summary: string;
}

/** Category reading result: session, profile, one_liner, analysis, extended_identity, human_type_card. */
export interface SajuCategoryReadingResult {
  session_id: string;
  request_id: string;
  profile: SajuResultProfile;
  summary: { one_liner: string };
  analysis: SajuAnalysis;
  extended_identity: SajuExtendedIdentity;
  human_type_card: SajuHumanTypeCard;
}

/** Shape used by SajuSummaryHeader, ResultCard, ChatInterface. UI boundary only. */
export interface DisplaySajuResult {
  session_id: string;
  request_id: string;
  profile: SajuResultProfile;
  badges: {
    ilgan: string;
    strength: string;
    yongsin: string;
    gisin: string;
    core_pattern: string;
  };
  pillar: { year: string; month: string; day: string; hour: string };
  elements: { wood: number; fire: number; earth: number; metal: number; water: number };
  sinsal: string[];
  extended_identity: SajuExtendedIdentity;
  analysis: SajuAnalysis;
  summary: { tone: string; one_liner: string };
  human_type_card: SajuHumanTypeCard;
  chat_seed_questions: string[];
  original?: {
    pillar: { year: string; month: string; day: string; hour: string };
    elements: { wood: number; fire: number; earth: number; metal: number; water: number };
    sinsal: string[];
    badges: { ilgan: string; strength: string; yongsin: string; gisin: string; core_pattern: string };
  };
}

/** @deprecated Use DisplaySajuResult. */
export type UnifiedSajuResult = DisplaySajuResult;
