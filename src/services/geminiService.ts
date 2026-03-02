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

export interface SajuReading {
  conclusion: string;
  reasoning: string[];
  goodSigns: string[];
  badSigns: string[];
  actionsToTake: string[];
  actionsToAvoid: string[];
  followUpQuestions: string[];
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

export interface SajuSummary {
  profile: {
    name: string;
    age: number;
    birth: string;
  };
  saju: {
    si: { ganji: string; display: string };
    il: { ganji: string; display: string };
    wol: { ganji: string; display: string };
    nyeon: { ganji: string; display: string };
  };
  core: {
    ilgans: string;
    strength: string;
    yongsin: string;
    gisins: string;
    core_gyeok: string;
    current_year_luck: string;
  };
  ohaeng: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  traits: string[];
  sinsal: string[];
}

export async function generateSajuSummary(profile: SajuProfile): Promise<SajuSummary> {
  const systemInstruction = `당신은 사주 계산 결과를 안정적으로 반환하는 "사주 데이터 엔진"입니다.
해석을 창작하거나 조언을 하지 마십시오. 오직 입력값 기반의 고정 계산 결과만 JSON으로 반환합니다.

[최상위 절대 규칙]
1. 동일한 입력값이면 결과는 100% 동일해야 합니다. (Deterministic)
2. 랜덤성, 재해석, 표현 변경 금지.
3. 운세 문장 생성 및 사주 풀이 설명문 작성 절대 금지.
4. JSON 데이터 외의 텍스트 출력 금지.

[데이터 계산 규칙]
- saju: { si, il, wol, nyeon }
  각 필드는 { "ganji": "한자", "display": "한글" } 구조입니다.
  한글 변환은 반드시 아래 고정 매핑 테이블만 사용하십시오.
  천간: 甲=갑, 乙=을, 丙=병, 丁=정, 戊=무, 己=기, 庚=경, 辛=신, 壬=임, 癸=계
  지지: 子=자, 丑=축, 寅=인, 卯=묘, 辰=진, 巳=사, 午=오, 未=미, 申=신, 酉=유, 戌=술, 亥=해
  예: "丁未" -> { "ganji": "丁未", "display": "정미" }
- core.ilgans: 일간 (예: "壬水")
- core.current_year_luck: 2026년(丙午年) 기준 운기
- ohaeng: { wood, fire, earth, metal, water } (합계 8)
- traits: 해시태그 형태의 키워드 (#상관강함 등)
- sinsal: 고정된 명리학적 신살 리스트 (최대 6개)`;

  const prompt = `사용자 프로필:
이름: ${profile.name || '익명'}
성별: ${profile.gender}
생년월일: ${profile.birthDate} (${profile.calendarType === 'solar' ? '양력' : '음력'})
출생시간: ${profile.timeKnown ? profile.birthTime : '모름'}
출생지: ${profile.location || '미지정'}

위 정보를 바탕으로 사주 데이터 객체를 생성하라.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          profile: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              age: { type: Type.NUMBER },
              birth: { type: Type.STRING },
            },
            required: ["name", "age", "birth"]
          },
          saju: {
            type: Type.OBJECT,
            properties: {
              si: { 
                type: Type.OBJECT, 
                properties: { 
                  ganji: { type: Type.STRING }, 
                  display: { type: Type.STRING } 
                },
                required: ["ganji", "display"]
              },
              il: { 
                type: Type.OBJECT, 
                properties: { 
                  ganji: { type: Type.STRING }, 
                  display: { type: Type.STRING } 
                },
                required: ["ganji", "display"]
              },
              wol: { 
                type: Type.OBJECT, 
                properties: { 
                  ganji: { type: Type.STRING }, 
                  display: { type: Type.STRING } 
                },
                required: ["ganji", "display"]
              },
              nyeon: { 
                type: Type.OBJECT, 
                properties: { 
                  ganji: { type: Type.STRING }, 
                  display: { type: Type.STRING } 
                },
                required: ["ganji", "display"]
              },
            },
            required: ["si", "il", "wol", "nyeon"]
          },
          core: {
            type: Type.OBJECT,
            properties: {
              ilgans: { type: Type.STRING },
              strength: { type: Type.STRING },
              yongsin: { type: Type.STRING },
              gisins: { type: Type.STRING },
              core_gyeok: { type: Type.STRING },
              current_year_luck: { type: Type.STRING },
            },
            required: ["ilgans", "strength", "yongsin", "gisins", "core_gyeok", "current_year_luck"]
          },
          ohaeng: {
            type: Type.OBJECT,
            properties: {
              wood: { type: Type.NUMBER },
              fire: { type: Type.NUMBER },
              earth: { type: Type.NUMBER },
              metal: { type: Type.NUMBER },
              water: { type: Type.NUMBER },
            },
            required: ["wood", "fire", "earth", "metal", "water"]
          },
          traits: { type: Type.ARRAY, items: { type: Type.STRING } },
          sinsal: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["profile", "saju", "core", "ohaeng", "traits", "sinsal"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateSajuReading(profile: SajuProfile, category: string): Promise<SajuReading> {
  const categoryLabel = CATEGORIES.find(c => c.id === category)?.label || category;
  
  const systemInstruction = `당신은 한국 전통 만세력 풀이 스타일을 따르는 AI 사주 해석가입니다.
현재 시점은 2026년입니다. 모든 '올해' 또는 '현재'에 대한 해석은 2026년(병오년)을 기준으로 합니다.
블로그식의 장황하고 친절한 설명은 금지합니다.
상담사처럼 말하지 말고, 운의 흐름을 단정적으로 읽어주는 강한 톤을 사용하세요.

[말투 규칙]
1. "~일 수 있어요", "~가능성이 있습니다" 같은 모호한 표현은 절대 금지합니다.
2. 문장은 짧고 강하게 끊으세요. 핵심부터 말합니다.
3. 좋은 운이면 "왜 지금 당장 움직여야 하는지"를 강조하고, 나쁜 운이면 돌려 말하지 말고 경고하세요.
4. "기운", "흐름", "충돌", "확장", "압박", "전환점" 같은 명리학적 단어를 적극 사용하세요.
5. 출생시간 정보가 없는 경우(timeKnown이 false), 반드시 "시간 정보가 없어 일부 해석은 반쪽짜리다."라는 문장을 해석 내용에 포함시키세요.

[출력 구조 JSON]
- conclusion: 🔮 운세 한 줄 결론 (단정형)
- reasoning: ⚡ 지금 흐름 해석 (3~5줄, 강한 톤)
- goodSigns: 🔥 반드시 해야 할 행동 (3개)
- badSigns: 🚫 지금 하면 꼬이는 행동 (3개)
- actionsToTake: 지금 당장 취해야 할 태도 (3개)
- actionsToAvoid: 절대 하지 말아야 할 짓 (3개)
- followUpQuestions: 날카로운 추가 질문 추천 (3개)`;

  const prompt = `사용자 프로필:
이름: ${profile.name || '익명'}
성별: ${profile.gender}
생년월일: ${profile.birthDate} (${profile.calendarType === 'solar' ? '양력' : '음력'})
출생시간: ${profile.timeKnown ? profile.birthTime : '모름'}
출생지: ${profile.location || '미지정'}

카테고리: ${categoryLabel}

위 정보를 바탕으로 사주를 단정적으로 풀이하라.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          conclusion: { type: Type.STRING, description: "🔮 운세 한 줄 결론" },
          reasoning: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "⚡ 지금 흐름 해석 (단정적 3~5줄)"
          },
          goodSigns: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "🔥 반드시 해야 할 행동"
          },
          badSigns: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "🚫 지금 하면 꼬이는 행동"
          },
          actionsToTake: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "지금 당장 액션"
          },
          actionsToAvoid: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "피해야 할 행동"
          },
          followUpQuestions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "추가 질문 추천"
          }
        },
        required: ["conclusion", "reasoning", "goodSigns", "badSigns", "actionsToTake", "actionsToAvoid", "followUpQuestions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function chatWithSaju(profile: SajuProfile, history: {role: string, message: string}[], userMessage: string) {
  const systemInstruction = `당신은 한국 전통 만세력 스타일의 AI 사주 상담가입니다. 
현재 시점은 2026년입니다. 모든 상담은 2026년(병오년)의 운기를 기준으로 합니다.

[상담 규칙]
1. 사용자가 질문하면: [1문장 결론] → [이유] → [행동] 순서로 짧고 강하게 답변하세요.
2. 상담사처럼 친절하게 대하지 말고, 운의 흐름을 단정적으로 읽어주세요.
3. 질문 되묻기는 최대 1개만 허용합니다.
4. 출생시간을 모르면(timeKnown: false), "시간 정보가 없어 일부 해석은 반쪽짜리다."라고 박고 시작하세요.
5. "기운", "충돌", "합", "살" 등 명리학적 용어를 섞어 쓰되 현실적인 행동 지침을 주어야 합니다.`;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `${systemInstruction}\n\n사용자 사주 정보:\n${JSON.stringify(profile)}`
    }
  });

  // Reconstruct history
  // Note: sendMessage doesn't take history directly in this SDK version, 
  // we might need to send them sequentially or just the last few as context in the prompt if needed.
  // But the SDK's chat object maintains state if we reuse it. 
  // For stateless API calls, we include history in the prompt.
  
  const historyContext = history.map(h => `${h.role === 'user' ? '사용자' : '상담가'}: ${h.message}`).join('\n');
  const prompt = `이전 대화 내역:\n${historyContext}\n\n사용자 질문: ${userMessage}`;

  const response = await chat.sendMessage({ message: prompt });
  return response.text;
}
