/** 천간 (10) - 한글 */
export const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
/** 지지 (12) - 한글 */
export const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

export type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";

/** 천간 → 오행 */
export const STEM_TO_ELEMENT: Record<string, ElementKey> = {
  갑: "wood", 을: "wood",
  병: "fire", 정: "fire",
  무: "earth", 기: "earth",
  경: "metal", 신: "metal",
  임: "water", 계: "water",
};

/** 지지 → 오행 (지지 한글 키) */
export const BRANCH_TO_ELEMENT: Record<string, ElementKey> = {
  인: "wood", 묘: "wood",
  사: "fire", 오: "fire",
  진: "earth", 술: "earth", 축: "earth", 미: "earth",
  신: "metal", 유: "metal",
  자: "water", 해: "water",
};

/** 五虎遁: 年干 index -> 寅月(正月) 月干 index */
const MONTH_STEM_OFFSET: Record<number, number> = {
  0: 2, 1: 4, 2: 6, 3: 8, 4: 0, 5: 2, 6: 4, 7: 6, 8: 8, 9: 0,
};
