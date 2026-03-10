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

type RawManseResult = {
  pillar?: {
    year?: string;
    month?: string;
    day?: string;
    hour?: string;
  };
  elements?: {
    wood?: number;
    fire?: number;
    earth?: number;
    metal?: number;
    water?: number;
  };
  ilgan?: string;
  strength?: string;
  yongsin?: string;
  gisin?: string;
  core_pattern?: string;
  sinsal?: string[];
};

function emptyCalculatedSaju(): CalculatedSaju {
  return {
    pillar: {
      year: "",
      month: "",
      day: "",
      hour: "",
    },
    elements: {
      wood: 0,
      fire: 0,
      earth: 0,
      metal: 0,
      water: 0,
    },
    ilgan: "",
    ilgan_display: "",
    sinsal: [],
    badges: {
      ilgan: "",
      strength: "",
      yongsin: "",
      gisin: "",
      core_pattern: "",
    },
  };
}

function normalizeRawManseResult(raw: RawManseResult): CalculatedSaju {
  const ilgan = raw?.ilgan ?? "";

  return {
    pillar: {
      year: raw?.pillar?.year ?? "",
      month: raw?.pillar?.month ?? "",
      day: raw?.pillar?.day ?? "",
      hour: raw?.pillar?.hour ?? "",
    },
    elements: {
      wood: raw?.elements?.wood ?? 0,
      fire: raw?.elements?.fire ?? 0,
      earth: raw?.elements?.earth ?? 0,
      metal: raw?.elements?.metal ?? 0,
      water: raw?.elements?.water ?? 0,
    },
    ilgan,
    ilgan_display: ilgan ? `${ilgan} 일간` : "",
    sinsal: Array.isArray(raw?.sinsal) ? raw.sinsal : [],
    badges: {
      ilgan,
      strength: raw?.strength ?? "",
      yongsin: raw?.yongsin ?? "",
      gisin: raw?.gisin ?? "",
      core_pattern: raw?.core_pattern ?? "",
    },
  };
}

/**
 * 임시 fallback
 * - 라이브러리 붙이기 전 최소 보호장치
 * - 네 기준값 고정
 */
function getKnownFixedSaju(profile: SajuProfile): CalculatedSaju | null {
  if (
    profile.birthDate === "1993-03-22" &&
    profile.birthTime === "13:00" &&
    profile.calendarType === "solar"
  ) {
    return {
      pillar: {
        year: "계유",
        month: "을묘",
        day: "임인",
        hour: "병오",
      },
      elements: {
        wood: 3,
        fire: 2,
        earth: 0,
        metal: 1,
        water: 2,
      },
      ilgan: "임수",
      ilgan_display: "임수 일간",
      sinsal: ["년살", "장성살", "역마살", "문창귀인"],
      badges: {
        ilgan: "임수",
        strength: "신약",
        yongsin: "금",
        gisin: "토",
        core_pattern: "상관격",
      },
    };
  }

  return null;
}

/**
 * 날짜/시간 문자열 정리
 */
function normalizeBirthInput(profile: SajuProfile) {
  const birthDate = profile.birthDate?.trim() || "";
  const birthTime =
    profile.timeKnown && profile.birthTime?.trim()
      ? profile.birthTime.trim()
      : "00:00";

  return {
    birthDate,
    birthTime,
    calendarType: profile.calendarType,
    gender: profile.gender,
    location: profile.location || "",
  };
}

/**
 * 여기만 실제 만세력 라이브러리로 갈아끼우면 된다.
 *
 * 원칙:
 * - 라이브러리 결과를 RawManseResult로 먼저 변환
 * - 그 다음 normalizeRawManseResult로 앱 공통 구조로 변환
 *
 * 지금은 computeManseFromLibrary()라는 "어댑터 함수"를 분리해놨다.
 */
function calculateWithLibrary(profile: SajuProfile): CalculatedSaju | null {
  try {
    const input = normalizeBirthInput(profile);
    const raw = computeManseFromLibrary(input);

    if (!raw) return null;

    const normalized = normalizeRawManseResult(raw);

    // 최소 검증: 일주 정도는 반드시 있어야 함
    if (!normalized.pillar.day) {
      console.warn("Library result missing day pillar:", raw);
      return null;
    }

    return normalized;
  } catch (error) {
    console.error("calculateWithLibrary failed:", error);
    return null;
  }
}

/**
 * 실제 라이브러리 연결 어댑터
 *
 * 지금은 비워둔 상태다.
 * 네가 고른 라이브러리의 반환값을 RawManseResult 형태로 바꿔서 return 하면 끝.
 */
function computeManseFromLibrary(input: {
  birthDate: string;
  birthTime: string;
  calendarType: "solar" | "lunar";
  gender: string;
  location: string;
}): RawManseResult | null {
  /**
   * 예시 패턴 1:
   *
   * const result = someSajuLib.calculate({
   *   date: input.birthDate,
   *   time: input.birthTime,
   *   calendar: input.calendarType,
   *   gender: input.gender,
   *   location: input.location,
   * });
   *
   * return {
   *   pillar: {
   *     year: result.yearPillar,
   *     month: result.monthPillar,
   *     day: result.dayPillar,
   *     hour: result.hourPillar,
   *   },
   *   elements: {
   *     wood: result.elements.wood,
   *     fire: result.elements.fire,
   *     earth: result.elements.earth,
   *     metal: result.elements.metal,
   *     water: result.elements.water,
   *   },
   *   ilgan: result.ilgan,
   *   strength: result.strength,
   *   yongsin: result.yongsin,
   *   gisin: result.gisin,
   *   core_pattern: result.corePattern,
   *   sinsal: result.sinsal,
   * };
   */

  /**
   * 예시 패턴 2:
   *
   * const result = someSajuLib.getManse(input.birthDate, input.birthTime, {
   *   lunar: input.calendarType === "lunar",
   *   gender: input.gender,
   * });
   *
   * return {
   *   pillar: {
   *     year: result.pillars.year.kor,
   *     month: result.pillars.month.kor,
   *     day: result.pillars.day.kor,
   *     hour: result.pillars.hour.kor,
   *   },
   *   elements: {
   *     wood: result.fiveElements.wood,
   *     fire: result.fiveElements.fire,
   *     earth: result.fiveElements.earth,
   *     metal: result.fiveElements.metal,
   *     water: result.fiveElements.water,
   *   },
   *   ilgan: result.dayMaster,
   *   strength: result.strength,
   *   yongsin: result.usefulGod,
   *   gisin: result.harmfulGod,
   *   core_pattern: result.pattern,
   *   sinsal: result.sinsalList,
   * };
   */

  return null;
}

export function calculateSajuFromProfile(profile: SajuProfile): CalculatedSaju {
  const byLibrary = calculateWithLibrary(profile);
  if (byLibrary) return byLibrary;

  const known = getKnownFixedSaju(profile);
  if (known) return known;

  return emptyCalculatedSaju();
}
