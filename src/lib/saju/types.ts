/** Frontend-only saju types. Compatible with existing UnifiedSajuResult profile/pillar/elements/badges. */
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
  badges: {
    ilgan: string;
    strength: string;
    yongsin: string;
    gisin: string;
    core_pattern: string;
  };
  sinsal: string[];
  daewoon: Array<{ age_start: number; age_end: number; pillar: string }>;
  ok?: boolean;
};
