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

function mapStemOrBranchToElement(
  char: string
): "wood" | "fire" | "earth" | "metal" | "water" | null {
  const table: Record<string, "wood" | "fire" | "earth" | "metal" | "water"> = {
    // 천간 한글 + 한자
    갑: "wood",
    을: "wood",
    병: "fire",
    정: "fire",
    무: "earth",
    기: "earth",
    경: "metal",
    신: "metal",
    임: "water",
    계: "water",

    甲: "wood",
    乙: "wood",
    丙: "fire",
    丁: "fire",
    戊: "earth",
    己: "earth",
    庚: "metal",
    辛: "metal",
    壬: "water",
    癸: "water",

    // 지지 한자만 유지
    寅: "wood",
    卯: "wood",
    巳: "fire",
    午: "fire",
    辰: "earth",
    戌: "earth",
    丑: "earth",
    未: "earth",
    申: "metal",
    酉: "metal",
    子: "water",
    亥: "water",
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
