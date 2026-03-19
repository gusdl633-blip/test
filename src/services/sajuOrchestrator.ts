/**
 * Central orchestration layer for Saju flow.
 * App can call buildSajuData once, then getSummary / getReading / chat with the same sajuData.
 */

import type {
  DisplaySajuResult,
  SajuCategoryReadingResult,
  SajuData,
  SajuSummaryResult,
} from "../types/saju";
import { buildSajuData } from "./buildSajuData";
import { getSummary as getSummaryFromService } from "./sajuSummaryService";
import { getReading as getReadingFromService } from "./sajuReadingService";
import { chatReply } from "./sajuChatService";

export { buildSajuData };

/**
 * Get summary from sajuData. Uses sajuSummaryService.
 */
export async function getSummary(
  sajuData: SajuData,
  sessionId: string,
  requestId: string
): Promise<SajuSummaryResult> {
  return getSummaryFromService(sajuData, sessionId, requestId);
}

/**
 * Get category reading from sajuData and optional summary. Uses sajuReadingService.
 */
export async function getReading(
  sajuData: SajuData,
  summary: SajuSummaryResult | null,
  categoryId: string,
  sessionId: string,
  requestId: string
): Promise<SajuCategoryReadingResult> {
  return getReadingFromService(sajuData, summary, categoryId, sessionId, requestId);
}

/**
 * Chat reply with compact context. Uses sajuChatService.
 */
export async function chat(
  sajuData: SajuData,
  summary: SajuSummaryResult | null,
  reading: SajuCategoryReadingResult | null,
  message: string,
  sessionId: string,
  requestId: string,
  recentMessages?: string[]
): Promise<DisplaySajuResult> {
  return chatReply(
    sajuData,
    summary,
    reading,
    message,
    sessionId,
    requestId,
    recentMessages
  );
}
