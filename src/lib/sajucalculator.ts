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

export function calculateSajuFromProfile(profile: {
  birthDate: string;
  birthTime?: string;
  calendarType: "solar" | "lunar";
  gender: string;
  location?: string;
}): CalculatedSaju {
  // TODO:
  // 1) 만세력 라이브러리 입력 포맷 변환
  // 2) 라이브러리 호출
  // 3) 결과를 앱 공통 구조로 매핑

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
