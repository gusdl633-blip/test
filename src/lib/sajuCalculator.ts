import type { SajuProfile } from "../types";

export type CalculatedSaju = {
  profile: {
    name: string;
    birth: string;
    time: string;
    calendar: string;
    gender: string;
    location: string;
    mbti: string;
    zodiac_korean: string;
    enneagram: string;
    ilgan: string;
    ilgan_display: string;
  };
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
  hidden_elements?: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  visible_ten_gods?: Record<string, unknown>;
  hidden_ten_gods?: Record<string, unknown>;
  badges: {
    ilgan: string;
    strength: string;
    yongsin: string;
    gisin: string;
    core_pattern: string;
  };
  sinsal: string[];
  daewoon: Array<{
    age_start: number;
    age_end: number;
    pillar: string;
  }>;
  ok?: boolean;
};

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

  if (!res.ok || data?.ok === false) {
    console.error("SAJU API ERROR BODY RAW:", JSON.stringify(data, null, 2));
    console.error("SAJU API ERROR BODY OBJECT:", data);

    throw new Error(
      data?.detail ||
      data?.error ||
      JSON.stringify(data) ||
      "saju calculation failed"
    );
  }

  if (!data?.pillar || !data?.profile || !data?.elements || !data?.badges) {
    throw new Error(`invalid saju response: ${JSON.stringify(data)}`);
  }

  return {
    profile: {
      name: data.profile?.name ?? "",
      birth: data.profile?.birth ?? "",
      time: data.profile?.time ?? "",
      calendar: data.profile?.calendar ?? "solar",
      gender: data.profile?.gender ?? "",
      location: data.profile?.location ?? "Seoul",
      mbti: data.profile?.mbti ?? "",
      zodiac_korean: data.profile?.zodiac_korean ?? "",
      enneagram: data.profile?.enneagram ?? "",
      ilgan: data.profile?.ilgan ?? "",
      ilgan_display: data.profile?.ilgan_display ?? "",
    },
    pillar: {
      year: data.pillar?.year ?? "",
      month: data.pillar?.month ?? "",
      day: data.pillar?.day ?? "",
      hour: data.pillar?.hour ?? "",
    },
    elements: {
      wood: Number(data.elements?.wood ?? 0),
      fire: Number(data.elements?.fire ?? 0),
      earth: Number(data.elements?.earth ?? 0),
      metal: Number(data.elements?.metal ?? 0),
      water: Number(data.elements?.water ?? 0),
    },
    hidden_elements: {
      wood: Number(data.hidden_elements?.wood ?? 0),
      fire: Number(data.hidden_elements?.fire ?? 0),
      earth: Number(data.hidden_elements?.earth ?? 0),
      metal: Number(data.hidden_elements?.metal ?? 0),
      water: Number(data.hidden_elements?.water ?? 0),
    },
    visible_ten_gods: data.visible_ten_gods ?? {},
    hidden_ten_gods: data.hidden_ten_gods ?? {},
    badges: {
      ilgan: data.badges?.ilgan ?? "",
      strength: data.badges?.strength ?? "",
      yongsin: data.badges?.yongsin ?? "",
      gisin: data.badges?.gisin ?? "",
      core_pattern: data.badges?.core_pattern ?? "",
    },
    sinsal: Array.isArray(data.sinsal) ? data.sinsal : [],
    daewoon: Array.isArray(data.daewoon) ? data.daewoon : [],
    ok: true,
  };
}
