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

/**
 * 임시 fallback
 * - 라이브러리 연결 전까지 최소한 기준 사용자 데이터는 흔들리지 않게 고정
 * - 나중에 라이브러리 붙이면 이 조건문은 제거 가능
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
 * 여기에 실제 만세력 라이브러리를 연결할 자리
 *
 * 예시 흐름:
 * 1) profile.birthDate / birthTime / calendarType / gender 를 라이브러리 입력 포맷으로 변환
 * 2) 라이브러리 호출
 * 3) 결과를 CalculatedSaju 형태로 매핑해서 return
 */
function calculateWithLibrary(profile: SajuProfile): CalculatedSaju | null {
  try {
    // TODO: 실제 만세력 라이브러리 연결
    // 예시:
    // const result = sajuLib.calculate({
    //   date: profile.birthDate,
    //   time: profile.birthTime || "00:00",
    //   calendar: profile.calendarType,
    //   gender: profile.gender,
    //   location: profile.location,
    // });
    //
    // return {
    //   pillar: {
    //     year: result.yearPillar,
    //     month: result.monthPillar,
    //     day: result.dayPillar,
    //     hour: result.hourPillar,
    //   },
    //   elements: {
    //     wood: result.elements.wood,
    //     fire: result.elements.fire,
    //     earth: result.elements.earth,
    //     metal: result.elements.metal,
    //     water: result.elements.water,
    //   },
    //   ilgan: result.ilgan,
    //   ilgan_display: `${result.ilgan} 일간`,
    //   sinsal: result.sinsal,
    //   badges: {
    //     ilgan: result.ilgan,
    //     strength: result.strength,
    //     yongsin: result.yongsin,
    //     gisin: result.gisin,
    //     core_pattern: result.corePattern,
    //   },
    // };

    return null;
  } catch (error) {
    console.error("calculateWithLibrary failed:", error);
    return null;
  }
}

export function calculateSajuFromProfile(profile: SajuProfile): CalculatedSaju {
  const byLibrary = calculateWithLibrary(profile);
  if (byLibrary) return byLibrary;

  const known = getKnownFixedSaju(profile);
  if (known) return known;

  return emptyCalculatedSaju();
}
