export type {
  SajuProfile,
  SajuData,
  DisplaySajuResult,
  SajuSummaryResult,
  SajuCategoryReadingResult,
  UnifiedSajuResult,
} from "./types/saju";

export const CATEGORIES = [
  { id: "total", label: "종합 분석", icon: "Sparkles" },
  { id: "wealth", label: "재물운", icon: "Coins" },
  { id: "love", label: "애정운", icon: "Heart" },
  { id: "career", label: "직업운", icon: "Briefcase" },
  { id: "health", label: "건강운", icon: "Activity" },
];
