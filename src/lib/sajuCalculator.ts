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
  raw?: any;
};

function fallbackIlangan(dayPillar: string) {
  const stem = dayPillar?.[0] || "";
  const map: Record<string, string> = {
    갑: "갑목",
    을: "을목",
    병: "병화",
    정: "정화",
    무: "무토",
    기: "기토",
    경: "경금",
    신: "신금",
    임: "임수",
    계: "계수",
  };
  return map[stem] || stem;
}

export async function calculateSajuFromProfile(
  profile: SajuProfile
): Promise<CalculatedSaju> {
  const res = await fetch("/api/saju", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: profile.name || "",
      gender: profile.gender || "",
      birthDate: profile.birthDate || "",
      birthTime: profile.timeKnown ? profile.birthTime : "00:00",
      calendarType: profile.calendarType || "solar",
      location: profile.location || "Seoul",
      mbti: profile.mbti || "",
      zodiac_korean: profile.zodiac_korean || "",
      enneagram: profile.enneagram || "",
    }),
  });

const text = await res.text();
console.log("SAJU API TEXT RAW:", text);

let data: any = {};
try {
  data = text ? JSON.parse(text) : {};
} catch (e) {
  console.error("SAJU API JSON PARSE FAILED:", e);
  throw new Error(text || "saju calculation failed");
}

console.log("SAJU API RAW:", data);

if (!res.ok) {
  console.error("SAJU API ERROR BODY RAW:", JSON.stringify(data, null, 2));
  console.error("SAJU API ERROR BODY OBJECT:", data);

  throw new Error(
    data?.detail ||
    data?.error ||
    JSON.stringify(data) ||
    "saju calculation failed"
  );
}

  const pillar = {
    year: data?.pillar?.year ?? "",
    month: data?.pillar?.month ?? "",
    day: data?.pillar?.day ?? "",
    hour: data?.pillar?.hour ?? "",
  };

  const ilganFallback = fallbackIlangan(pillar.day);

  return {
    pillar,
    elements: {
      wood: data?.elements?.wood ?? 0,
      fire: data?.elements?.fire ?? 0,
      earth: data?.elements?.earth ?? 0,
      metal: data?.elements?.metal ?? 0,
      water: data?.elements?.water ?? 0,
    },
    ilgan: data?.profile?.ilgan ?? ilganFallback,
    ilgan_display: data?.profile?.ilgan_display ?? `${ilganFallback} 일간`,
    sinsal: data?.sinsal ?? [],
    badges: {
      ilgan: data?.badges?.ilgan ?? ilganFallback,
      strength: data?.badges?.strength ?? "",
      yongsin: data?.badges?.yongsin ?? "",
      gisin: data?.badges?.gisin ?? "",
      core_pattern: data?.badges?.core_pattern ?? "",
    },
    raw: data,
  };
}
