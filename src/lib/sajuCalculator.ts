import type { SajuProfile } from "../types";

export type CalculatedSaju = {
  pillar: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  elements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  ilgan: string;
  ilgan_display: string;
  sinsal: string[];
  badges: {
    ilgan: string;
    strength: string;
    yongsin: string;
    gisin: string;
    core_pattern: string;
  };
};

function mapStemOrBranchToElement(char: string): "wood" | "fire" | "earth" | "metal" | "water" | null {
  const table: Record<string, "wood" | "fire" | "earth" | "metal" | "water"> = {
    갑: "wood", 을: "wood", 寅: "wood", 인: "wood", 卯: "wood", 묘: "wood",
    병: "fire", 정: "fire", 巳: "fire", 사: "fire", 午: "fire", 오: "fire",
    무: "earth", 기: "earth", 辰: "earth", 진: "earth", 戌: "earth", 술: "earth", 丑: "earth", 축: "earth", 未: "earth", 미: "earth",
    경: "metal", 신: "metal", 申: "metal", 신: "metal", 酉: "metal", 유: "metal",
    임: "water", 계: "water", 子: "water", 자: "water", 亥: "water", 해: "water",
  };
  return table[char] ?? null;
}

function calcElementsFromPillars(pillar: CalculatedSaju["pillar"]) {
  const result = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

  for (const value of Object.values(pillar)) {
    const chars = Array.from(value);
    for (const ch of chars) {
      const el = mapStemOrBranchToElement(ch);
      if (el) result[el] += 1;
    }
  }

  return result;
}

export async function calculateSajuFromProfile(profile: SajuProfile): Promise<CalculatedSaju> {
  const res = await fetch("/api/saju", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      birthDate: profile.birthDate,
      birthTime: profile.timeKnown ? profile.birthTime : "00:00",
      calendarType: profile.calendarType,
      gender: profile.gender,
      location: profile.location || "Seoul",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || "saju calculation failed");
  }

  const data = await res.json();

  const pillar = {
    year: data?.pillar?.year ?? "",
    month: data?.pillar?.month ?? "",
    day: data?.pillar?.day ?? "",
    hour: data?.pillar?.hour ?? "",
  };

  const dayStem = Array.from(pillar.day)[0] || "";

  return {
    pillar,
    elements: calcElementsFromPillars(pillar),
    ilgan: dayStem,
    ilgan_display: dayStem ? `${dayStem} 일간` : "",
    sinsal: [],
    badges: {
      ilgan: dayStem,
      strength: "",
      yongsin: "",
      gisin: "",
      core_pattern: "",
    },
  };
}
