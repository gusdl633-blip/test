import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SajuProfile {
  name?: string;
  gender: string;
  birthDate: string;
  calendarType: 'solar' | 'lunar';
  birthTime?: string;
  timeKnown: boolean;
  location?: string;
  mbti?: string;
  zodiac_korean?: string;
  enneagram?: string | null;
}

export const CATEGORIES = [
  { id: 'yearly', label: '올해/이번달 운세', icon: '📅' },
  { id: 'romance', label: '연애운', icon: '❤️' },
  { id: 'marriage', label: '결혼운/배우자', icon: '💍' },
  { id: 'career', label: '직장운', icon: '💼' },
  { id: 'wealth', label: '금전운', icon: '💰' },
  { id: 'business', label: '사업운', icon: '🚀' },
  { id: 'exam', label: '시험/합격운', icon: '🎓' },
  { id: 'health', label: '건강운', icon: '🏥' },
  { id: 'relationship', label: '대인관계', icon: '🤝' },
  { id: 'moving', label: '이사/이동운', icon: '🏠' },
];

export interface UnifiedSajuResult {
  session_id: string;
  request_id: string;
  profile: { 
    name: string; 
    birth: string; 
    calendar: string; 
    time: string;
    ilgan: string; // 예: 임(壬)
    ilgan_display: string; // e.g., "⚡ 임 일간"
  };
  badges: {
    ilgan: string; // 예: 임(壬)
    strength: string; // 신약/신강
    yongsin: string; // 한글
    gisin: string; // 한글
    core_pattern: string; // 핵심격 (한글)
  };
  pillar: { 
    year: string; // 한글 간지 (예: 임인)
    month: string; 
    day: string; 
    hour: string 
  };
  elements: { 
    wood: number; 
    fire: number; 
    earth: number; 
    metal: number; 
    water: number; 
  };
  sinsal: string[]; // 최대 8개, 실제 존재하는 신살만 한글로
  analysis: {
    core_analysis: string[]; // 3개 고정
    logic_basis: string[]; // 3~4개
    good_flow: string[]; // 3개
    risk_flow: string[]; // 3개
    action_now: string[]; // 3개
    avoid_action: string[]; // 3개
  };
  summary: {
    tone: "entp_shaman_female_30s";
    one_liner: string;
  };
  extended_identity: {
    core_engine: string;
    thinking_style: string;
    instinct_style: string;
    motivation_core: string;
  };
  chat_seed_questions: string[];
}

export async function generateUnifiedSaju(
  profile: SajuProfile, 
  session_id: string, 
  request_id: string
): Promise<UnifiedSajuResult> {
  const systemInstruction = `당신은 "천명(天命) FUTURISTIC SAJU" 전용 분석 엔진, '30대 여성 ENTP 무당'입니다.
당신의 역할은 UI 구조를 생성하는 것이 아니라, 이미 설계된 고정 UI에 들어갈 텍스트 데이터만 생성하는 것입니다.

[페르소나: 30대 ENTP 여성 무당]
- 논리적, 직설적, 팩트 폭격기.
- 감정 위로 절대 금지. 상담사 톤 금지.
- "~일 수 있다", "~같다", "~하세요" 등 추측/조언형 존댓말 절대 금지.
- 반말, 단정형, 짧고 리듬감 있는 문장 사용.
- 분석 -> 구조 -> 결론 순으로 차갑게 통찰.
- 인격 비난이 아니라 패턴을 지적한다.
- 은근한 냉소 OK. 하지만 저급하거나 공격적이지 않게.

[ABSOLUTE TONE RULE]
- 설명하지 마라. 장황하게 풀지 마라.
- 상담사처럼 말하지 마라. 위로 금지.
- 교훈적 마무리 금지. 설교 금지.

[STYLE EXAMPLE]
- “너는 사랑을 못 하는 게 아니다. 통과 시험을 보는 거다.”
- “지금 네 문제는 감정이 아니라 기준이다.”
- “연애를 전략으로 들면 평생 분석만 하다 끝난다.”
- “남자를 고르는 게 아니라, 네가 우위에 설 수 있는 판을 고른다.”

[최상위 절대 규칙]
1. 응답은 오직 "단일 JSON"만 출력하며, 다른 텍스트는 절대 포함하지 않습니다.
2. 입력받은 session_id와 request_id를 그대로 echo 합니다.
3. 모든 명리학 용어는 "한글"로만 출력합니다.
4. 마크다운, 이모지, 장식문자 사용을 절대 금지합니다.
5. 절대로 undefined, null, 누락 필드를 반환하지 않습니다.

[데이터 생성 및 매핑 규칙 (7단계 구조)]
1. summary.one_liner: 한 줄 직설 요약 (강하게 팩트 꽂기)
2. extended_identity: 사주(엔진), MBTI(알고리즘), 별자리(기질), 애니어그램(욕망)을 교차 분석하여 인간의 작동 원리를 정의.
   - core_engine: 사주 기반 에너지 구조
   - thinking_style: MBTI 기반 인지/의사결정 패턴
   - instinct_style: 별자리 기반 기질/충동성/속도
   - motivation_core: 애니어그램 기반 동기/두려움 (데이터가 null이면 "분석 제외"로 표시)
3. analysis.logic_basis: 핵심 근거 3~4개 (명리학적 구조 기반 짧은 문장)
4. analysis.good_flow: 좋은 흐름 3개 (짧은 명사형)
5. analysis.risk_flow: 위험 신호 3개 (짧은 명사형)
6. analysis.action_now: 지금 액션 3개 (행동 위주 단문)
7. analysis.avoid_action: 피해야 할 행동 3개 (행동 위주 단문)
8. analysis.core_analysis: [구조 분석1, 구조 분석2, 마지막 한 줄 경고(강하게)] - 총 3개 고정.

[통합 분석 가이드]
- 사주(에너지) -> MBTI(사고) -> 별자리(기질) -> 애니어그램(욕망) 순으로 교차 분석한다.
- 단독 분석 절대 금지. 항상 사주를 엔진으로 두고 나머지를 결합하여 "뾰족하게" 해석하라.
- 예: "임수는 판을 읽고, ENTP는 구조를 깨며, 양자리는 바로 들이밀고, 7w8은 이기려고 움직인다. 그래서 너는 판단->실행->분석 순으로 움직인다."

[출력 스키마]
{
  "session_id": "${session_id}",
  "request_id": "${request_id}",
  "profile": { "name": "", "birth": "", "calendar": "", "time": "", "ilgan": "", "ilgan_display": "" },
  "badges": { "ilgan": "", "strength": "", "yongsin": "", "gisin": "", "core_pattern": "" },
  "pillar": { "year":"", "month":"", "day":"", "hour":"" },
  "elements": { "wood":0,"fire":0,"earth":0,"metal":0,"water":0 },
  "sinsal": [],
  "extended_identity": {
    "core_engine": "",
    "thinking_style": "",
    "instinct_style": "",
    "motivation_core": ""
  },
  "analysis": {
    "core_analysis": ["", "", ""],
    "logic_basis": ["", "", "", ""],
    "good_flow": ["", "", ""],
    "risk_flow": ["", "", ""],
    "action_now": ["", "", ""],
    "avoid_action": ["", "", ""]
  },
  "summary": {
    "tone":"entp_shaman_female_30s",
    "one_liner":""
  },
  "chat_seed_questions":[]
}`;

  const prompt = `사용자 프로필:
이름: ${profile.name || '익명'}
성별: ${profile.gender}
생년월일: ${profile.birthDate} (${profile.calendarType === 'solar' ? '양력' : '음력'})
출생시간: ${profile.timeKnown ? profile.birthTime : '모름'}
출생지: ${profile.location || '미지정'}
MBTI: ${profile.mbti || '미지정'}
별자리: ${profile.zodiac_korean || '미지정'}
애니어그램: ${profile.enneagram || 'null'}

위 정보를 바탕으로 UnifiedSajuResult JSON을 생성하라.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          session_id: { type: Type.STRING },
          request_id: { type: Type.STRING },
          profile: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              birth: { type: Type.STRING },
              calendar: { type: Type.STRING },
              time: { type: Type.STRING },
              ilgan: { type: Type.STRING },
              ilgan_display: { type: Type.STRING }
            },
            required: ["name", "birth", "calendar", "time", "ilgan", "ilgan_display"]
          },
          badges: {
            type: Type.OBJECT,
            properties: {
              ilgan: { type: Type.STRING },
              strength: { type: Type.STRING },
              yongsin: { type: Type.STRING },
              gisin: { type: Type.STRING },
              core_pattern: { type: Type.STRING }
            },
            required: ["ilgan", "strength", "yongsin", "gisin", "core_pattern"]
          },
          pillar: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.STRING },
              month: { type: Type.STRING },
              day: { type: Type.STRING },
              hour: { type: Type.STRING }
            },
            required: ["year", "month", "day", "hour"]
          },
          elements: {
            type: Type.OBJECT,
            properties: {
              wood: { type: Type.NUMBER },
              fire: { type: Type.NUMBER },
              earth: { type: Type.NUMBER },
              metal: { type: Type.NUMBER },
              water: { type: Type.NUMBER }
            },
            required: ["wood", "fire", "earth", "metal", "water"]
          },
          sinsal: { type: Type.ARRAY, items: { type: Type.STRING } },
          extended_identity: {
            type: Type.OBJECT,
            properties: {
              core_engine: { type: Type.STRING },
              thinking_style: { type: Type.STRING },
              instinct_style: { type: Type.STRING },
              motivation_core: { type: Type.STRING }
            },
            required: ["core_engine", "thinking_style", "instinct_style", "motivation_core"]
          },
          analysis: {
            type: Type.OBJECT,
            properties: {
              core_analysis: { type: Type.ARRAY, items: { type: Type.STRING } },
              logic_basis: { type: Type.ARRAY, items: { type: Type.STRING } },
              good_flow: { type: Type.ARRAY, items: { type: Type.STRING } },
              risk_flow: { type: Type.ARRAY, items: { type: Type.STRING } },
              action_now: { type: Type.ARRAY, items: { type: Type.STRING } },
              avoid_action: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["core_analysis", "logic_basis", "good_flow", "risk_flow", "action_now", "avoid_action"]
          },
          summary: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.STRING },
              one_liner: { type: Type.STRING }
            },
            required: ["tone", "one_liner"]
          },
          chat_seed_questions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["session_id", "request_id", "profile", "badges", "pillar", "elements", "sinsal", "extended_identity", "analysis", "summary", "chat_seed_questions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateSajuReading(
  profile: SajuProfile, 
  category: string,
  session_id: string,
  request_id: string
): Promise<UnifiedSajuResult> {
  const categoryLabel = CATEGORIES.find(c => c.id === category)?.label || category;
  
  const systemInstruction = `당신은 "천명(天命) FUTURISTIC SAJU" 전용 분석 엔진, '30대 여성 ENTP 무당'입니다.
당신의 역할은 UI 구조를 생성하는 것이 아니라, 이미 설계된 고정 UI에 들어갈 텍스트 데이터만 생성하는 것입니다.

[페르소나: 30대 ENTP 여성 무당]
- 논리적, 직설적, 팩트 폭격기.
- 감정 위로 절대 금지. 상담사 톤 금지.
- "~일 수 있다", "~같다", "~하세요" 등 추측/조언형 존댓말 절대 금지.
- 반말, 단정형, 짧고 리듬감 있는 문장 사용.
- 분석 -> 구조 -> 결론 순으로 차갑게 통찰.
- 인격 비난이 아니라 패턴을 지적한다.
- 은근한 냉소 OK. 하지만 저급하거나 공격적이지 않게.

[ABSOLUTE TONE RULE]
- 설명하지 마라. 장황하게 풀지 마라.
- 상담사처럼 말하지 마라. 위로 금지.
- 교훈적 마무리 금지. 설교 금지.

[STYLE EXAMPLE]
- “너는 사랑을 못 하는 게 아니다. 통과 시험을 보는 거다.”
- “지금 네 문제는 감정이 아니라 기준이다.”
- “연애를 전략으로 들면 평생 분석만 하다 끝난다.”
- “남자를 고르는 게 아니라, 네가 우위에 설 수 있는 판을 고른다.”

[해석 요청: ${categoryLabel}]
해당 카테고리에 집중하여 해석을 수행하십시오.

[최상위 절대 규칙]
1. 응답은 오직 "단일 JSON"만 출력하며, 다른 텍스트는 절대 포함하지 않습니다.
2. 입력받은 session_id와 request_id를 그대로 echo 합니다.
3. 모든 명리학 용어는 "한글"로만 출력합니다.
4. 마크다운, 이모지, 장식문자 사용을 절대 금지합니다.
5. 절대로 undefined, null, 누락 필드를 반환하지 않습니다.

[데이터 생성 및 매핑 규칙 (7단계 구조)]
1. summary.one_liner: 한 줄 직설 요약 (강하게 팩트 꽂기)
2. extended_identity: 사주(엔진), MBTI(알고리즘), 별자리(기질), 애니어그램(욕망)을 교차 분석하여 인간의 작동 원리를 정의.
   - core_engine: 사주 기반 에너지 구조
   - thinking_style: MBTI 기반 인지/의사결정 패턴
   - instinct_style: 별자리 기반 기질/충동성/속도
   - motivation_core: 애니어그램 기반 동기/두려움 (데이터가 null이면 "분석 제외"로 표시)
3. analysis.logic_basis: 핵심 근거 3~4개 (명리학적 구조 기반 짧은 문장)
4. analysis.good_flow: 좋은 흐름 3개 (짧은 명사형)
5. analysis.risk_flow: 위험 신호 3개 (짧은 명사형)
6. analysis.action_now: 지금 액션 3개 (행동 위주 단문)
7. analysis.avoid_action: 피해야 할 행동 3개 (행동 위주 단문)
8. analysis.core_analysis: [구조 분석1, 구조 분석2, 마지막 한 줄 경고(강하게)] - 총 3개 고정.

[통합 분석 가이드]
- 사주(에너지) -> MBTI(사고) -> 별자리(기질) -> 애니어그램(욕망) 순으로 교차 분석한다.
- 단독 분석 절대 금지. 항상 사주를 엔진으로 두고 나머지를 결합하여 "뾰족하게" 해석하라.
- 예: "임수는 판을 읽고, ENTP는 구조를 깨며, 양자리는 바로 들이밀고, 7w8은 이기려고 움직인다. 그래서 너는 판단->실행->분석 순으로 움직인다."

[출력 스키마]
{
  "session_id": "${session_id}",
  "request_id": "${request_id}",
  "profile": { "name": "", "birth": "", "calendar": "", "time": "", "ilgan": "", "ilgan_display": "" },
  "badges": { "ilgan": "", "strength": "", "yongsin": "", "gisin": "", "core_pattern": "" },
  "pillar": { "year":"", "month":"", "day":"", "hour":"" },
  "elements": { "wood":0,"fire":0,"earth":0,"metal":0,"water":0 },
  "sinsal": [],
  "extended_identity": {
    "core_engine": "",
    "thinking_style": "",
    "instinct_style": "",
    "motivation_core": ""
  },
  "analysis": {
    "core_analysis": ["", "", ""],
    "logic_basis": ["", "", "", ""],
    "good_flow": ["", "", ""],
    "risk_flow": ["", "", ""],
    "action_now": ["", "", ""],
    "avoid_action": ["", "", ""]
  },
  "summary": {
    "tone":"entp_shaman_female_30s",
    "one_liner":""
  },
  "chat_seed_questions":[]
}`;

  const prompt = `사용자 프로필:
이름: ${profile.name || '익명'}
성별: ${profile.gender}
생년월일: ${profile.birthDate} (${profile.calendarType === 'solar' ? '양력' : '음력'})
출생시간: ${profile.timeKnown ? profile.birthTime : '모름'}
출생지: ${profile.location || '미지정'}
MBTI: ${profile.mbti || '미지정'}
별자리: ${profile.zodiac_korean || '미지정'}
애니어그램: ${profile.enneagram || 'null'}

카테고리: ${categoryLabel}

위 정보를 바탕으로 UnifiedSajuResult JSON을 생성하라.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          session_id: { type: Type.STRING },
          request_id: { type: Type.STRING },
          profile: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              birth: { type: Type.STRING },
              calendar: { type: Type.STRING },
              time: { type: Type.STRING },
              ilgan: { type: Type.STRING },
              ilgan_display: { type: Type.STRING }
            },
            required: ["name", "birth", "calendar", "time", "ilgan", "ilgan_display"]
          },
          badges: {
            type: Type.OBJECT,
            properties: {
              ilgan: { type: Type.STRING },
              strength: { type: Type.STRING },
              yongsin: { type: Type.STRING },
              gisin: { type: Type.STRING },
              core_pattern: { type: Type.STRING }
            },
            required: ["ilgan", "strength", "yongsin", "gisin", "core_pattern"]
          },
          pillar: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.STRING },
              month: { type: Type.STRING },
              day: { type: Type.STRING },
              hour: { type: Type.STRING }
            },
            required: ["year", "month", "day", "hour"]
          },
          elements: {
            type: Type.OBJECT,
            properties: {
              wood: { type: Type.NUMBER },
              fire: { type: Type.NUMBER },
              earth: { type: Type.NUMBER },
              metal: { type: Type.NUMBER },
              water: { type: Type.NUMBER }
            },
            required: ["wood", "fire", "earth", "metal", "water"]
          },
          sinsal: { type: Type.ARRAY, items: { type: Type.STRING } },
          extended_identity: {
            type: Type.OBJECT,
            properties: {
              core_engine: { type: Type.STRING },
              thinking_style: { type: Type.STRING },
              instinct_style: { type: Type.STRING },
              motivation_core: { type: Type.STRING }
            },
            required: ["core_engine", "thinking_style", "instinct_style", "motivation_core"]
          },
          analysis: {
            type: Type.OBJECT,
            properties: {
              core_analysis: { type: Type.ARRAY, items: { type: Type.STRING } },
              logic_basis: { type: Type.ARRAY, items: { type: Type.STRING } },
              good_flow: { type: Type.ARRAY, items: { type: Type.STRING } },
              risk_flow: { type: Type.ARRAY, items: { type: Type.STRING } },
              action_now: { type: Type.ARRAY, items: { type: Type.STRING } },
              avoid_action: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["core_analysis", "logic_basis", "good_flow", "risk_flow", "action_now", "avoid_action"]
          },
          summary: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.STRING },
              one_liner: { type: Type.STRING }
            },
            required: ["tone", "one_liner"]
          },
          chat_seed_questions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["session_id", "request_id", "profile", "badges", "pillar", "elements", "sinsal", "extended_identity", "analysis", "summary", "chat_seed_questions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function chatWithSaju(
  profile: SajuProfile, 
  history: any[], 
  userMessage: string,
  session_id: string,
  request_id: string
): Promise<UnifiedSajuResult> {
  const systemInstruction = `당신은 "천명(天命) FUTURISTIC SAJU" 전용 분석 엔진, '30대 여성 ENTP 무당'입니다.
당신은 사용자의 사주 정보를 바탕으로 1:1 상담을 진행합니다.

[페르소나: 30대 ENTP 여성 무당]
- 논리적, 직설적, 팩트 폭격기.
- 감정 위로 절대 금지. 상담사 톤 금지.
- "~일 수 있다", "~같다", "~하세요" 등 추측/조언형 존댓말 절대 금지.
- 반말, 단정형, 짧고 리듬감 있는 문장 사용.
- 분석 -> 구조 -> 결론 순으로 차갑게 통찰.
- 인격 비난이 아니라 패턴을 지적한다.
- 은근한 냉소 OK. 하지만 저급하거나 공격적이지 않게.

[ABSOLUTE TONE RULE]
- 설명하지 마라. 장황하게 풀지 마라.
- 상담사처럼 말하지 마라. 위로 금지.
- 교훈적 마무리 금지. 설교 금지.

[STYLE EXAMPLE]
- “너는 사랑을 못 하는 게 아니다. 통과 시험을 보는 거다.”
- “지금 네 문제는 감정이 아니라 기준이다.”
- “연애를 전략으로 들면 평생 분석만 하다 끝난다.”
- “남자를 고르는 게 아니라, 네가 우위에 설 수 있는 판을 고른다.”

[최상위 절대 규칙]
1. 응답은 오직 "단일 JSON"만 출력하며, 다른 텍스트는 절대 포함하지 않습니다.
2. 입력받은 session_id와 request_id를 그대로 echo 합니다.
3. 당신의 답변(상담 메시지)은 "summary.one_liner" 필드에 넣으십시오.
4. 모든 명리학 용어는 "한글"로만 출력합니다.
5. 마크다운, 이모지, 장식문자 사용을 절대 금지합니다.
6. 절대로 undefined, null, 누락 필드를 반환하지 않습니다.

[상담 규칙]
1. 질문 받아도 설명형으로 풀지 말고, 핵심 -> 구조 -> 경고 순으로 답한다.
2. 상대의 질문 이면에 숨겨진 패턴과 심리를 짚어낸다.
3. 답변은 간결하고 명확하게 제공한다.

[통합 분석 가이드]
- 사주(에너지) -> MBTI(사고) -> 별자리(기질) -> 애니어그램(욕망) 순으로 교차 분석한다.
- 단독 분석 절대 금지. 항상 사주를 엔진으로 두고 나머지를 결합하여 "뾰족하게" 해석하라.

[출력 스키마]
{
  "session_id": "${session_id}",
  "request_id": "${request_id}",
  "profile": { "name": "", "birth": "", "calendar": "", "time": "", "ilgan": "", "ilgan_display": "" },
  "badges": { "ilgan": "", "strength": "", "yongsin": "", "gisin": "", "core_pattern": "" },
  "pillar": { "year":"", "month":"", "day":"", "hour":"" },
  "elements": { "wood":0,"fire":0,"earth":0,"metal":0,"water":0 },
  "sinsal": [],
  "extended_identity": {
    "core_engine": "",
    "thinking_style": "",
    "instinct_style": "",
    "motivation_core": ""
  },
  "analysis": {
    "core_analysis": ["", "", ""],
    "logic_basis": ["", "", "", ""],
    "good_flow": ["", "", ""],
    "risk_flow": ["", "", ""],
    "action_now": ["", "", ""],
    "avoid_action": ["", "", ""]
  },
  "summary": {
    "tone":"entp_shaman_female_30s",
    "one_liner":"(여기에 상담 답변을 넣으세요)"
  },
  "chat_seed_questions":[]
}`;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          session_id: { type: Type.STRING },
          request_id: { type: Type.STRING },
          profile: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              birth: { type: Type.STRING },
              calendar: { type: Type.STRING },
              time: { type: Type.STRING },
              ilgan: { type: Type.STRING },
              ilgan_display: { type: Type.STRING }
            },
            required: ["name", "birth", "calendar", "time", "ilgan", "ilgan_display"]
          },
          badges: {
            type: Type.OBJECT,
            properties: {
              ilgan: { type: Type.STRING },
              strength: { type: Type.STRING },
              yongsin: { type: Type.STRING },
              gisin: { type: Type.STRING },
              core_pattern: { type: Type.STRING }
            },
            required: ["ilgan", "strength", "yongsin", "gisin", "core_pattern"]
          },
          pillar: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.STRING },
              month: { type: Type.STRING },
              day: { type: Type.STRING },
              hour: { type: Type.STRING }
            },
            required: ["year", "month", "day", "hour"]
          },
          elements: {
            type: Type.OBJECT,
            properties: {
              wood: { type: Type.NUMBER },
              fire: { type: Type.NUMBER },
              earth: { type: Type.NUMBER },
              metal: { type: Type.NUMBER },
              water: { type: Type.NUMBER }
            },
            required: ["wood", "fire", "earth", "metal", "water"]
          },
          sinsal: { type: Type.ARRAY, items: { type: Type.STRING } },
          extended_identity: {
            type: Type.OBJECT,
            properties: {
              core_engine: { type: Type.STRING },
              thinking_style: { type: Type.STRING },
              instinct_style: { type: Type.STRING },
              motivation_core: { type: Type.STRING }
            },
            required: ["core_engine", "thinking_style", "instinct_style", "motivation_core"]
          },
          analysis: {
            type: Type.OBJECT,
            properties: {
              core_analysis: { type: Type.ARRAY, items: { type: Type.STRING } },
              logic_basis: { type: Type.ARRAY, items: { type: Type.STRING } },
              good_flow: { type: Type.ARRAY, items: { type: Type.STRING } },
              risk_flow: { type: Type.ARRAY, items: { type: Type.STRING } },
              action_now: { type: Type.ARRAY, items: { type: Type.STRING } },
              avoid_action: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["core_analysis", "logic_basis", "good_flow", "risk_flow", "action_now", "avoid_action"]
          },
          summary: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.STRING },
              one_liner: { type: Type.STRING }
            },
            required: ["tone", "one_liner"]
          },
          chat_seed_questions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["session_id", "request_id", "profile", "badges", "pillar", "elements", "sinsal", "extended_identity", "analysis", "summary", "chat_seed_questions"]
      }
    }
  });

  const historyContext = history.map(h => `${h.role === 'user' ? '사용자' : '상담가'}: ${h.message}`).join('\n');
  const prompt = `사용자 프로필:
MBTI: ${profile.mbti || '미지정'}
별자리: ${profile.zodiac_korean || '미지정'}
애니어그램: ${profile.enneagram || 'null'}

사용자 사주: ${JSON.stringify(profile)}
이전 대화:
${historyContext}

사용자 질문: ${userMessage}

위 정보를 바탕으로 UnifiedSajuResult JSON을 생성하라.`;

  const response = await chat.sendMessage({ message: prompt });
  return JSON.parse(response.text || "{}");
}
