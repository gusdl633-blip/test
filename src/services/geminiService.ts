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
  profile: { name: string; birth: string; calendar: string; time: string };
  pillar: { year: string; month: string; day: string; hour: string };
  elements: { wood: number; fire: number; earth: number; metal: number; water: number; basis: string };
  tags: string[];
  sinsal: string[];
  summary: {
    tone: "entp_shaman_female_30s";
    one_liner: string;
    core_points: string[];
  };
  chat_seed_questions: string[];
}

export async function generateUnifiedSaju(
  profile: SajuProfile, 
  session_id: string, 
  request_id: string
): Promise<UnifiedSajuResult> {
  const systemInstruction = `당신은 초고정/결정적 사주 데이터를 반환하고 해석하는 "Unified Saju Engine"입니다.
당신은 전통 무당이지만 현대적인 감각을 가진 30대 ENTP 여성 사주 해석가 페르소나를 유지합니다.

[최상위 절대 규칙]
1. 응답은 오직 "단일 JSON"만 출력하며, 다른 텍스트(Markdown, 이모지, 설명 등)는 절대 포함하지 않습니다.
2. 입력받은 session_id와 request_id를 그대로 echo 합니다.
3. 동일 입력 = 동일 출력 (Deterministic).
4. 사주 원국 계산은 표준 만세력 규칙을 엄격히 따릅니다.
5. 모든 명리학 용어는 "한글"로만 출력합니다.

[페르소나: 30대 ENTP 여성 무당]
- 직설적, 논리적, 본질 관통.
- 과한 위로 금지. 건조하고 날카로운 통찰.
- 전략가처럼 말함.

[출력 스키마]
반드시 아래 구조를 엄수하십시오. 누락 필드 없이 값이 없으면 빈 문자열/배열로 채웁니다.
{
  "session_id": "${session_id}",
  "request_id": "${request_id}",
  "profile": { "name": "", "birth": "", "calendar": "", "time": "" },
  "pillar": { "year":"", "month":"", "day":"", "hour":"" },
  "elements": { "wood":0,"fire":0,"earth":0,"metal":0,"water":0,"basis":"8char" },
  "tags": [],
  "sinsal": [],
  "summary": {
    "tone":"entp_shaman_female_30s",
    "one_liner":"",
    "core_points":[]
  },
  "chat_seed_questions":[]
}`;

  const prompt = `사용자 프로필:
이름: ${profile.name || '익명'}
성별: ${profile.gender}
생년월일: ${profile.birthDate} (${profile.calendarType === 'solar' ? '양력' : '음력'})
출생시간: ${profile.timeKnown ? profile.birthTime : '모름'}
출생지: ${profile.location || '미지정'}

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
              time: { type: Type.STRING }
            },
            required: ["name", "birth", "calendar", "time"]
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
              water: { type: Type.NUMBER },
              basis: { type: Type.STRING }
            },
            required: ["wood", "fire", "earth", "metal", "water", "basis"]
          },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          sinsal: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.STRING },
              one_liner: { type: Type.STRING },
              core_points: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["tone", "one_liner", "core_points"]
          },
          chat_seed_questions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["session_id", "request_id", "profile", "pillar", "elements", "tags", "sinsal", "summary", "chat_seed_questions"]
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
  
  const systemInstruction = `당신은 초고정/결정적 사주 데이터를 반환하고 해석하는 "Unified Saju Engine"입니다.
당신은 전통 무당이지만 현대적인 감각을 가진 30대 ENTP 여성 사주 해석가 페르소나를 유지합니다.

[최상위 절대 규칙]
1. 응답은 오직 "단일 JSON"만 출력하며, 다른 텍스트(Markdown, 이모지, 설명 등)는 절대 포함하지 않습니다.
2. 입력받은 session_id와 request_id를 그대로 echo 합니다.
3. 동일 입력 = 동일 출력 (Deterministic).
4. 사주 원국 계산은 표준 만세력 규칙을 엄격히 따릅니다.
5. 모든 명리학 용어는 "한글"로만 출력합니다.

[페르소나: 30대 ENTP 여성 무당]
- 직설적, 논리적, 본질 관통.
- 과한 위로 금지. 건조하고 날카로운 통찰.
- 전략가처럼 말함.

[해석 요청: ${categoryLabel}]
해당 카테고리에 집중하여 해석을 수행하십시오.

[출력 스키마]
반드시 아래 구조를 엄수하십시오. 누락 필드 없이 값이 없으면 빈 문자열/배열로 채웁니다.
{
  "session_id": "${session_id}",
  "request_id": "${request_id}",
  "profile": { "name": "", "birth": "", "calendar": "", "time": "" },
  "pillar": { "year":"", "month":"", "day":"", "hour":"" },
  "elements": { "wood":0,"fire":0,"earth":0,"metal":0,"water":0,"basis":"8char" },
  "tags": [],
  "sinsal": [],
  "summary": {
    "tone":"entp_shaman_female_30s",
    "one_liner":"",
    "core_points":[]
  },
  "chat_seed_questions":[]
}`;

  const prompt = `사용자 프로필:
이름: ${profile.name || '익명'}
성별: ${profile.gender}
생년월일: ${profile.birthDate} (${profile.calendarType === 'solar' ? '양력' : '음력'})
출생시간: ${profile.timeKnown ? profile.birthTime : '모름'}
출생지: ${profile.location || '미지정'}

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
              time: { type: Type.STRING }
            },
            required: ["name", "birth", "calendar", "time"]
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
              water: { type: Type.NUMBER },
              basis: { type: Type.STRING }
            },
            required: ["wood", "fire", "earth", "metal", "water", "basis"]
          },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          sinsal: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.STRING },
              one_liner: { type: Type.STRING },
              core_points: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["tone", "one_liner", "core_points"]
          },
          chat_seed_questions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["session_id", "request_id", "profile", "pillar", "elements", "tags", "sinsal", "summary", "chat_seed_questions"]
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
  const systemInstruction = `당신은 전통 무당이지만 현대적인 감각을 가진 30대 ENTP 여성 사주 상담가입니다.
당신은 사용자의 사주 정보를 바탕으로 1:1 상담을 진행합니다.

[최상위 절대 규칙]
1. 응답은 오직 "단일 JSON"만 출력하며, 다른 텍스트는 절대 포함하지 않습니다.
2. 입력받은 session_id와 request_id를 그대로 echo 합니다.
3. 당신의 답변(상담 메시지)은 "summary.one_liner" 필드에 넣으십시오.
4. 추가적인 통찰이나 조언은 "summary.core_points"에 넣으십시오.
5. 모든 명리학 용어는 "한글"로만 출력합니다.

[페르소나: 30대 ENTP 여성 무당]
- 직설적, 논리적, 본질 관통.
- 과한 위로 금지. 건조하고 날카로운 통찰.
- 전략가처럼 말함.

[상담 규칙]
1. 상대의 질문 이면에 숨겨진 패턴과 심리를 짚어냅니다.
2. 답변은 간결하고 명확하게 제공합니다.

[출력 스키마]
반드시 아래 구조를 엄수하십시오.
{
  "session_id": "${session_id}",
  "request_id": "${request_id}",
  "profile": { "name": "", "birth": "", "calendar": "", "time": "" },
  "pillar": { "year":"", "month":"", "day":"", "hour":"" },
  "elements": { "wood":0,"fire":0,"earth":0,"metal":0,"water":0,"basis":"8char" },
  "tags": [],
  "sinsal": [],
  "summary": {
    "tone":"entp_shaman_female_30s",
    "one_liner":"(여기에 상담 답변을 넣으세요)",
    "core_points":[]
  },
  "chat_seed_questions":[]
}`;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction,
      responseMimeType: "application/json"
    }
  });

  const historyContext = history.map(h => `${h.role === 'user' ? '사용자' : '상담가'}: ${h.message}`).join('\n');
  const prompt = `사용자 사주: ${JSON.stringify(profile)}\n이전 대화:\n${historyContext}\n\n사용자 질문: ${userMessage}\n\n위 정보를 바탕으로 UnifiedSajuResult JSON을 생성하라.`;

  const response = await chat.sendMessage({ message: prompt });
  return JSON.parse(response.text || "{}");
}
