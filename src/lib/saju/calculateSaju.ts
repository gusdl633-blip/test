import type { SajuProfile } from "../../types";
import { STEMS, BRANCHES, STEM_TO_ELEMENT, BRANCH_TO_ELEMENT, type ElementKey } from "./constants";
import type { CalculatedSaju } from "./types";

/** Julian day number for a given date (UTC noon). */
function julianDay(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

/** 庚辰 = 16 in 六十甲子 (0=甲子, 1=乙丑, ..., 16=庚辰). */
const BASE_DAY_INDEX = 16;
const BASE_JD = julianDay(2000, 1, 1);

function parseBirthDate(birthDate: string): { year: number; month: number; day: number } {
  const match = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { year: 2000, month: 1, day: 1 };
  return { year: parseInt(match[1], 10), month: parseInt(match[2], 10), day: parseInt(match[3], 10) };
}

/** Parse time "HH:mm" or "H:mm" -> hour 0-23; returns branch index for 时柱 (子=23,0,1, 丑=1-3, ...). */
function parseTimeToBranchIndex(birthTime: string): number {
  const match = birthTime.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  let hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  if (min >= 30) hour += 1;
  hour = hour % 24;
  if (hour === 0) hour = 24;
  const branchIndex = Math.floor((hour + 1) / 2) % 12;
  return branchIndex;
}

/** 年柱: (year - 4) % 60 -> stem + branch. */
function getYearPillar(year: number): { stem: string; branch: string; stemIndex: number; branchIndex: number } {
  const index = (year - 4) % 60;
  if (index < 0) throw new Error("Invalid year");
  const stemIndex = index % 10;
  const branchIndex = index % 12;
  return { stem: STEMS[stemIndex], branch: BRANCHES[branchIndex], stemIndex, branchIndex };
}

/** 五虎遁: 年干 index -> 寅月 月干 offset */
const MONTH_STEM_OFFSET: Record<number, number> = {
  0: 2, 1: 4, 2: 6, 3: 8, 4: 0, 5: 2, 6: 4, 7: 6, 8: 8, 9: 0,
};

/** 月柱: 寅月=正月(month 1). 月支 = (month + 1) % 12 (寅=2). 月干 from 五虎遁. */
function getMonthPillar(yearStemIndex: number, month: number): { stem: string; branch: string } {
  const branchIndex = (month + 1) % 12;
  const stemOffset = MONTH_STEM_OFFSET[yearStemIndex] ?? 2;
  const stemIndex = (stemOffset + month - 1) % 10;
  return { stem: STEMS[stemIndex], branch: BRANCHES[branchIndex] };
}

/** 日柱: base 2000-01-01 = 庚辰 (index 16). */
function getDayPillar(year: number, month: number, day: number): { stem: string; branch: string; stemIndex: number } {
  const jd = julianDay(year, month, day);
  const index = (jd - BASE_JD + BASE_DAY_INDEX) % 60;
  const safeIndex = index < 0 ? index + 60 : index;
  const stemIndex = safeIndex % 10;
  const branchIndex = safeIndex % 12;
  return { stem: STEMS[stemIndex], branch: BRANCHES[branchIndex], stemIndex };
}

/** 时柱: 甲己日 甲子, 乙庚 丙子, ... hourStem = (dayStemIndex * 2 + hourBranchIndex) % 10. */
function getHourPillar(dayStemIndex: number, hourBranchIndex: number): { stem: string; branch: string } {
  const stemIndex = (dayStemIndex * 2 + hourBranchIndex) % 10;
  return { stem: STEMS[stemIndex], branch: BRANCHES[hourBranchIndex] };
}

/** Count elements from 8 chars (4 pillars, each stem+branch). */
function countElements(pillars: { year: string; month: string; day: string; hour: string }): Record<ElementKey, number> {
  const counts: Record<ElementKey, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const add = (char: string) => {
    const el = STEM_TO_ELEMENT[char] ?? BRANCH_TO_ELEMENT[char];
    if (el) counts[el] = (counts[el] ?? 0) + 1;
  };
  for (const p of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    if (p.length >= 1) add(p[0]);
    if (p.length >= 2) add(p[1]);
  }
  return counts;
}

/** 일간(日干) 한글 표기. */
function ilganDisplay(stem: string): string {
  const map: Record<string, string> = {
    갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊", 기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
  };
  return map[stem] ?? stem;
}

/** 강약 단순 판단: 일간 오행 개수가 8자 중에서 많으면 강, 적으면 약, 아니면 중화. */
function getStrength(ilgan: string, elements: Record<ElementKey, number>): string {
  const el = STEM_TO_ELEMENT[ilgan];
  if (!el) return "중화";
  const myCount = elements[el] ?? 0;
  const total = Object.values(elements).reduce((a, b) => a + b, 0);
  if (total === 0) return "중화";
  const ratio = myCount / total;
  if (ratio >= 0.4) return "강";
  if (ratio <= 0.15) return "약";
  return "중화";
}

/** Synchronous frontend-only saju calculation. No API calls. */
export function calculateSajuFromProfile(profile: SajuProfile): CalculatedSaju {
  const birth = parseBirthDate(profile.birthDate ?? "2000-01-01");
  const timeStr = profile.timeKnown && profile.birthTime ? profile.birthTime : "00:00";
  const hourBranchIndex = parseTimeToBranchIndex(timeStr);

  const yearP = getYearPillar(birth.year);
  const monthP = getMonthPillar(yearP.stemIndex, birth.month);
  const dayP = getDayPillar(birth.year, birth.month, birth.day);
  const hourP = getHourPillar(dayP.stemIndex, hourBranchIndex);

  const pillar = {
    year: yearP.stem + yearP.branch,
    month: monthP.stem + monthP.branch,
    day: dayP.stem + dayP.branch,
    hour: hourP.stem + hourP.branch,
  };

  const elements = countElements(pillar);
  const ilgan = dayP.stem;
  const strength = getStrength(ilgan, elements);

  const birthStr = `${birth.year}-${String(birth.month).padStart(2, "0")}-${String(birth.day).padStart(2, "0")}`;

  return {
    profile: {
      name: profile.name ?? "",
      birth: birthStr,
      time: timeStr,
      calendar: profile.calendarType ?? "solar",
      gender: profile.gender ?? "male",
      location: profile.location ?? "Seoul",
      mbti: profile.mbti ?? "",
      zodiac_korean: profile.zodiac_korean ?? "",
      enneagram: profile.enneagram ?? "",
      ilgan,
      ilgan_display: ilganDisplay(ilgan),
    },
    pillar,
    elements,
    badges: {
      ilgan,
      strength,
      yongsin: "—",
      gisin: "—",
      core_pattern: "—",
    },
    sinsal: [],
    daewoon: [],
    ok: true,
  };
}
