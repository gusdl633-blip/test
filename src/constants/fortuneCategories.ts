export type FortuneCategoryId =
  | "overall"
  | "money"
  | "love"
  | "career"
  | "health"
  | "year2026"
  | "today";

export type FortuneCategory = {
  id: FortuneCategoryId;
  order: number;
  label: string;
  titleEn: string;
  subtitle: string;
  icon: string;
};

export const FORTUNE_CATEGORIES: FortuneCategory[] = [
  { id: "overall", order: 1, label: "종합운", titleEn: "Sparkles", subtitle: "전체 흐름 분석", icon: "sparkles" },
  { id: "money", order: 2, label: "재물운", titleEn: "Coins", subtitle: "돈과 소비 흐름", icon: "coins" },
  { id: "love", order: 3, label: "애정운", titleEn: "Heart", subtitle: "연애와 관계 흐름", icon: "heart" },
  { id: "career", order: 4, label: "직업운", titleEn: "Briefcase", subtitle: "일과 커리어 흐름", icon: "briefcase" },
  { id: "health", order: 5, label: "건강운", titleEn: "Activity", subtitle: "체력과 컨디션 흐름", icon: "activity" },
  { id: "year2026", order: 6, label: "2026년 운세", titleEn: "Calendar", subtitle: "2026년 전체 흐름", icon: "calendar" },
  { id: "today", order: 7, label: "오늘의 운세", titleEn: "Sun", subtitle: "오늘 하루 흐름", icon: "sun" },
];

