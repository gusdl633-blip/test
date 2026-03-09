import { GoogleGenAI, Type } from "@google/genai";
import type { SajuProfile, UnifiedSajuResult } from "../types";
export type { SajuProfile, UnifiedSajuResult };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
   - human_type: "두 단어 구조" (예: 전략형 도전자, 직관형 창작자, 통찰형 분석가, 질서형 관리자, 충동형 개척자, 관찰형 철학자). 사주+MBTI+별자리+애니어그램 조합으로 결정.
   - core_engine: 사주 기반 에너지 구조
   - thinking_style: MBTI 기반 인지/의사결정 패턴 (사고 알고리즘)
   - instinct_style: 별자리 기반 기질/충동성/속도
   - motivation_core: 애니어그램 기반 동기/두려움 (욕망 구조, 데이터가 null이면 "분석 제외"로 표시)
   - weakness_pattern: 인간 구조적 결함/약점 패턴
   - relationship_pattern: 타인과의 관계 맺기 방식/패턴
   - compatibility_type: (궁합 요청 시에만 생성) 전략형 커플, 지배형 관계, 보완형 파트너, 소모형 관계 등.
3. analysis.logic_basis: 핵심 근거 3~4개 (명리학적 구조 기반 짧은 문장)
4. analysis.good_flow: 좋은 흐름 3개 (짧은 명사형)
5. analysis.risk_flow: 위험 신호 3개 (짧은 명사형)
6. analysis.action_now: 지금 액션 3개 (행동 위주 단문)
7. analysis.avoid_action: 피해야 할 행동 3개 (행동 위주 단문)
8. analysis.core_analysis: [구조 분석1, 구조 분석2, 마지막 한 줄 경고(강하게)] - 총 3개 고정.
9. human_type_card: 인간 분석 카드 데이터.
   - title: "[기본 인간 타입] - [행동 변형]" 형식 (예: 전략형 도전자 - 확장형).
   - strengths: 강점 3개 (짧고 직관적인 문장).
   - weaknesses: 약점 3개 (짧고 직관적인 문장).
   - share_summary: SNS 공유용 한 문장 (예: "나는 전략형 도전자 - 확장형 인간이다. 판을 읽고 움직이는 타입.").

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
    "human_type": "",
    "core_engine": "",
    "thinking_style": "",
    "instinct_style": "",
    "motivation_core": "",
    "weakness_pattern": "",
    "relationship_pattern": ""
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
  "human_type_card": {
    "title": "",
    "strengths": ["", "", ""],
    "weaknesses": ["", "", ""],
    "share_summary": ""
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
              human_type: { type: Type.STRING },
              core_engine: { type: Type.STRING },
              thinking_style: { type: Type.STRING },
              instinct_style: { type: Type.STRING },
              motivation_core: { type: Type.STRING },
              weakness_pattern: { type: Type.STRING },
              relationship_pattern: { type: Type.STRING },
              compatibility_type: { type: Type.STRING }
            },
            required: ["human_type", "core_engine", "thinking_style", "instinct_style", "motivation_core", "weakness_pattern", "relationship_pattern"]
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
          human_type_card: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              share_summary: { type: Type.STRING }
            },
            required: ["title", "strengths", "weaknesses", "share_summary"]
          },
          chat_seed_questions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["session_id", "request_id", "profile", "badges", "pillar", "elements", "sinsal", "extended_identity", "analysis", "summary", "human_type_card", "chat_seed_questions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export const CATEGORIES = [
  { id: 'total', label: '종합 분석', icon: 'Sparkles' },
  { id: 'wealth', label: '재물운', icon: 'Coins' },
  { id: 'love', label: '애정운', icon: 'Heart' },
  { id: 'career', label: '직업운', icon: 'Briefcase' },
  { id: 'health', label: '건강운', icon: 'Activity' }
];

export async function generateSajuReading(
  profile: SajuProfile,
  categoryId: string,
  session_id: string,
  request_id: string
): Promise<UnifiedSajuResult> {
  const category = CATEGORIES.find(c => c.id === categoryId)?.label || '종합';
  const systemInstruction = `당신은 "천명(天命) FUTURISTIC SAJU" 전용 분석 엔진, '30대 여성 ENTP 무당'입니다.
당신은 현재 사용자의 "${category}"에 집중하여 분석을 수행합니다.

[페르소나: 30대 ENTP 여성 무당]
- 논리적, 직설적, 팩트 폭격기.
- 반말, 단정형, 짧고 리듬감 있는 문장 사용.
- 분석 -> 구조 -> 결론 순으로 차갑게 통찰.

[ABSOLUTE TONE RULE]
- 설명하지 마라. 장황하게 풀지 마라.
- 상담사처럼 말하지 마라. 위로 금지.
- 교훈적 마무리 금지. 설교 금지.

[데이터 생성 및 매핑 규칙]
- 모든 응답은 UnifiedSajuResult JSON 형식을 따릅니다.
- "${category}" 테마에 맞춰 모든 분석 텍스트를 생성하십시오.
- extended_identity는 사주, MBTI, 별자리, 애니어그램을 교차 분석하여 작성하십시오.
- human_type은 두 단어 구조로 정의하십시오.
- human_type_card를 생성하십시오. title은 "[기본 인간 타입] - [행동 변형]" 형식이어야 합니다.

[출력 스키마]
(generateUnifiedSaju와 동일한 스키마 사용)`;

  const prompt = `사용자 프로필:
이름: ${profile.name || '익명'}
성별: ${profile.gender}
생년월일: ${profile.birthDate} (${profile.calendarType === 'solar' ? '양력' : '음력'})
출생시간: ${profile.timeKnown ? profile.birthTime : '모름'}
MBTI: ${profile.mbti || '미지정'}
별자리: ${profile.zodiac_korean || '미지정'}
애니어그램: ${profile.enneagram || 'null'}
요청 카테고리: ${category}

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
              human_type: { type: Type.STRING },
              core_engine: { type: Type.STRING },
              thinking_style: { type: Type.STRING },
              instinct_style: { type: Type.STRING },
              motivation_core: { type: Type.STRING },
              weakness_pattern: { type: Type.STRING },
              relationship_pattern: { type: Type.STRING },
              compatibility_type: { type: Type.STRING }
            },
            required: ["human_type", "core_engine", "thinking_style", "instinct_style", "motivation_core", "weakness_pattern", "relationship_pattern"]
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
          human_type_card: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              share_summary: { type: Type.STRING }
            },
            required: ["title", "strengths", "weaknesses", "share_summary"]
          },
          chat_seed_questions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["session_id", "request_id", "profile", "badges", "pillar", "elements", "sinsal", "extended_identity", "analysis", "summary", "human_type_card", "chat_seed_questions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function chatWithSaju(
  profile: SajuProfile,
  history: { role: string; message: string }[],
  userInput: string,
  session_id: string,
  request_id: string
): Promise<UnifiedSajuResult> {
  const systemInstruction = `당신은 "천명(天命) FUTURISTIC SAJU" 전용 분석 엔진, '30대 여성 ENTP 무당'입니다.

[페르소나: 30대 ENTP 여성 무당]
- 논리적, 직설적, 팩트 폭격기.
- 반말, 단정형, 짧고 리듬감 있는 문장 사용.
- 분석 -> 구조 -> 결론 순으로 차갑게 통찰.

[ABSOLUTE TONE RULE]
- 설명하지 마라. 장황하게 풀지 마라.
- 상담사처럼 말하지 마라. 위로 금지.
- 교훈적 마무리 금지. 설교 금지.

[참고 데이터]
사용자 프로필: ${JSON.stringify(profile)}

[대화 규칙]
- 사용자의 질문에 대해 사주와 MBTI, 별자리, 애니어그램을 교차 분석하여 답변하십시오.
- 응답은 반드시 UnifiedSajuResult JSON 형식을 유지하십시오.
- summary.one_liner에 실제 답변 내용을 담으십시오.
- human_type_card를 대화 맥락에 맞게 업데이트하거나 유지하십시오.
- 다른 필드들은 대화 맥락에 따라 업데이트하거나 유지하십시오.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.message }] })),
      { role: 'user', parts: [{ text: userInput }] }
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      // Reuse the same schema for consistency
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          session_id: { type: Type.STRING },
          request_id: { type: Type.STRING },
          profile: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, birth: { type: Type.STRING }, calendar: { type: Type.STRING }, time: { type: Type.STRING }, ilgan: { type: Type.STRING }, ilgan_display: { type: Type.STRING } } },
          badges: { type: Type.OBJECT, properties: { ilgan: { type: Type.STRING }, strength: { type: Type.STRING }, yongsin: { type: Type.STRING }, gisin: { type: Type.STRING }, core_pattern: { type: Type.STRING } } },
          pillar: { type: Type.OBJECT, properties: { year: { type: Type.STRING }, month: { type: Type.STRING }, day: { type: Type.STRING }, hour: { type: Type.STRING } } },
          elements: { type: Type.OBJECT, properties: { wood: { type: Type.NUMBER }, fire: { type: Type.NUMBER }, earth: { type: Type.NUMBER }, metal: { type: Type.NUMBER }, water: { type: Type.NUMBER } } },
          sinsal: { type: Type.ARRAY, items: { type: Type.STRING } },
          extended_identity: { type: Type.OBJECT, properties: { human_type: { type: Type.STRING }, core_engine: { type: Type.STRING }, thinking_style: { type: Type.STRING }, instinct_style: { type: Type.STRING }, motivation_core: { type: Type.STRING }, weakness_pattern: { type: Type.STRING }, relationship_pattern: { type: Type.STRING }, compatibility_type: { type: Type.STRING } } },
          analysis: { type: Type.OBJECT, properties: { core_analysis: { type: Type.ARRAY, items: { type: Type.STRING } }, logic_basis: { type: Type.ARRAY, items: { type: Type.STRING } }, good_flow: { type: Type.ARRAY, items: { type: Type.STRING } }, risk_flow: { type: Type.ARRAY, items: { type: Type.STRING } }, action_now: { type: Type.ARRAY, items: { type: Type.STRING } }, avoid_action: { type: Type.ARRAY, items: { type: Type.STRING } } } },
          summary: { type: Type.OBJECT, properties: { tone: { type: Type.STRING }, one_liner: { type: Type.STRING } } },
          human_type_card: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }, share_summary: { type: Type.STRING } } },
          chat_seed_questions: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    },
  });

  return JSON.parse(response.text || "{}");
}

