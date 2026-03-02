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

export interface CanonicalSajuResult {
  profileKey: string;
  input: {
    birth: string;
    calendarType: 'solar' | 'lunar';
    location?: string;
    gender: string;
  };
  pillars: {
    year: { hanja: string; kor: string };
    month: { hanja: string; kor: string };
    day: { hanja: string; kor: string };
    hour: { hanja: string; kor: string };
  };
  dayMaster: { hanja: string; kor: string; element: string };
  elements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
    basis: string;
    include_hidden_stems: boolean;
  };
  tenGodSummary: {
    strength: string;
    yongsin: string;
    gisins: string;
    core_gyeok: string;
  };
  lucky: {
    currentYear: string;
  };
  sinsal: string[];
  tags: string[];
  generatedAt: string;
  version: string;
}

export async function generateSajuSummary(profile: SajuProfile): Promise<CanonicalSajuResult> {
  const profileKey = `${profile.birthDate}|${profile.birthTime || '00:00'}|${profile.calendarType}|${profile.location || 'none'}|${profile.gender}`;
  
  const systemInstruction = `당신은 초고정/결정적 사주 데이터를 반환하는 "Canonical Saju Data Engine"입니다.
해석이나 조언을 절대 하지 마십시오. 오직 입력값 기반의 고정 계산 결과만 JSON으로 반환합니다.

[최상위 절대 규칙]
1. 동일 입력 = 동일 출력 (Deterministic). 랜덤성 배제.
2. 사주 원국(4주)은 한자와 한글 매핑을 엄격히 준수합니다.
   천간: 甲=갑, 乙=을, 丙=병, 丁=정, 戊=무, 己=기, 庚=경, 辛=신, 壬=임, 癸=계
   지지: 子=자, 丑=축, 寅=인, 卯=묘, 辰=진, 巳=사, 午=오, 未=미, 申=신, 酉=유, 戌=술, 亥=해
3. 오행 분포는 8자 기준으로 계산하며, 합계는 반드시 8이어야 합니다.
4. 신살은 고정 리스트에서만 추출합니다.

[출력 스키마]
반드시 CanonicalSajuResult 스키마를 따르십시오.
- version: "canonical_v1"
- elements.basis: "8char"
- elements.include_hidden_stems: true`;

  const prompt = `사용자 프로필:
이름: ${profile.name || '익명'}
성별: ${profile.gender}
생년월일: ${profile.birthDate} (${profile.calendarType === 'solar' ? '양력' : '음력'})
출생시간: ${profile.timeKnown ? profile.birthTime : '모름'}
출생지: ${profile.location || '미지정'}

위 정보를 바탕으로 CanonicalSajuResult JSON 객체를 생성하라.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pillars: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.OBJECT, properties: { hanja: { type: Type.STRING }, kor: { type: Type.STRING } }, required: ["hanja", "kor"] },
              month: { type: Type.OBJECT, properties: { hanja: { type: Type.STRING }, kor: { type: Type.STRING } }, required: ["hanja", "kor"] },
              day: { type: Type.OBJECT, properties: { hanja: { type: Type.STRING }, kor: { type: Type.STRING } }, required: ["hanja", "kor"] },
              hour: { type: Type.OBJECT, properties: { hanja: { type: Type.STRING }, kor: { type: Type.STRING } }, required: ["hanja", "kor"] },
            },
            required: ["year", "month", "day", "hour"]
          },
          dayMaster: { 
            type: Type.OBJECT, 
            properties: { 
              hanja: { type: Type.STRING }, 
              kor: { type: Type.STRING },
              element: { type: Type.STRING }
            },
            required: ["hanja", "kor", "element"]
          },
          elements: {
            type: Type.OBJECT,
            properties: {
              wood: { type: Type.NUMBER },
              fire: { type: Type.NUMBER },
              earth: { type: Type.NUMBER },
              metal: { type: Type.NUMBER },
              water: { type: Type.NUMBER },
              basis: { type: Type.STRING },
              include_hidden_stems: { type: Type.BOOLEAN },
            },
            required: ["wood", "fire", "earth", "metal", "water", "basis", "include_hidden_stems"]
          },
          tenGodSummary: {
            type: Type.OBJECT,
            properties: {
              strength: { type: Type.STRING },
              yongsin: { type: Type.STRING },
              gisins: { type: Type.STRING },
              core_gyeok: { type: Type.STRING },
            },
            required: ["strength", "yongsin", "gisins", "core_gyeok"]
          },
          lucky: {
            type: Type.OBJECT,
            properties: {
              currentYear: { type: Type.STRING },
            },
            required: ["currentYear"]
          },
          sinsal: { type: Type.ARRAY, items: { type: Type.STRING } },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["pillars", "dayMaster", "elements", "tenGodSummary", "lucky", "sinsal", "tags"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  return {
    ...result,
    profileKey,
    input: {
      birth: `${profile.birthDate} ${profile.birthTime || ''}`,
      calendarType: profile.calendarType,
      location: profile.location,
      gender: profile.gender
    },
    generatedAt: new Date().toISOString(),
    version: "canonical_v1"
  };
}

export async function generateSajuReading(profile: SajuProfile, category: string): Promise<SajuReading> {
  const categoryLabel = CATEGORIES.find(c => c.id === category)?.label || category;
  
  const systemInstruction = `당신은 전통 무당이지만 현대적인 감각을 가진 30대 ENTP 여성 사주 해석가입니다.
현재 시점은 2026년(병오년)입니다.

[성격 및 톤]
- 직설적, 논리적, 돌려 말하지 않음.
- 과한 위로 금지. 가끔 피식 웃는 듯한 건조하고 생동감 있는 말투.
- 상투적 문구("좋은 기운", "행운") 절대 금지.
- 교과서식 설명, 뻔한 멘트, 무속 미신식 겁주기, 확률적 말장난 금지.

[해석 방식]
1. 본질을 찌른다.
2. 성격 구조를 구조적으로 설명한다.
3. 장점/위험요소를 동시에 말한다.
4. 현실 조언은 전략처럼 말한다.
5. 감정 과잉 없이 건조하게 툭 던진다.

[출력 구조 JSON]
- conclusion: [1] 핵심 진단 한 줄 (도발적이고 날카로운 본질 관통)
- reasoning: [2] 구조 설명 및 [3] 지금 시점의 흐름 (2~3문장 단위로 끊어서, 총 3~5개 항목)
- goodSigns: 지금 당신에게 유리하게 작용하는 흐름 (3개)
- badSigns: 지금 당신을 발목 잡는 위험 요소 (3개)
- actionsToTake: [4] 전략적 조언 (실질적인 행동 지침, 3개)
- actionsToAvoid: 지금 절대 하지 말아야 할 짓 (3개)
- followUpQuestions: [5] 상대가 스스로 생각하게 만드는 날카로운 질문 (3개)

* 출생시간을 모르면(timeKnown: false), "시간 정보가 없어 일부 해석은 반쪽짜리다."라는 문장을 reasoning 첫 번째 항목에 넣으세요.`;

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
  const systemInstruction = `당신은 전통 무당이지만 현대적인 감각을 가진 30대 ENTP 여성 사주 상담가입니다.
현재 시점은 2026년(병오년)입니다.

[상담 규칙]
1. 직설적이고 논리적이며, 사용자의 말 속 숨은 패턴을 집어내 본질을 찌르세요.
2. 과한 위로 대신 건조하고 날카로운 통찰을 툭 던지듯 말합니다.
3. ENTP 특유의 도발적인 유머를 섞되, 말 길게 늘이지 말고 2~3문장 단위로 끊으세요.
4. 상담자가 아니라 인생의 전략가처럼 행동하세요.
5. 출생시간을 모르면(timeKnown: false), "시간 정보가 없어 일부 해석은 반쪽짜리다."라고 박고 시작하세요.
6. 답변마다 반드시 최소 1개의 날카로운 통찰 포인트를 포함하세요.
7. 자연스러운 한국어 문장으로만 답변하세요. JSON 출력 금지.

사용자 사주 정보:
${JSON.stringify(profile)}`;

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
