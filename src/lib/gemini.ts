/**
 * Gemini via Vercel API only (`/api/gemini`). No API key in the browser.
 */

const DEFAULT_MODEL = "gemini-2.5-flash";

export type SajuData = {
  name?: string;
  ilgan: string;
  elements: Record<string, number> | { wood: number; fire: number; earth: number; metal: number; water: number };
  pillar?: { year: string; month: string; day: string; hour: string };
  birthDate?: string;
  birthTime?: string;
  gender?: string;
  strengthSummary?: string;
  mbti?: string;
  zodiac_korean?: string;
  enneagram?: string;
};

export type ChatHistoryItem = { role: string; text: string };

const FALLBACK_MESSAGE = "현재 응답을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.";

const ELEMENT_LABELS: Record<string, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

function formatElements(
  elements: Record<string, number> | { wood: number; fire: number; earth: number; metal: number; water: number }
): string {
  const order = ["wood", "fire", "earth", "metal", "water"];
  const parts = order.map((key) => {
    const label = ELEMENT_LABELS[key] ?? key;
    const value = elements[key] ?? 0;
    return `${label} ${value}`;
  });
  return parts.join(", ");
}

function formatPillar(pillar: { year: string; month: string; day: string; hour: string }): string {
  return `년주 ${pillar.year}, 월주 ${pillar.month}, 일주 ${pillar.day}, 시주 ${pillar.hour}`;
}

function formatHistory(history: ChatHistoryItem[]): string {
  const recent = history.slice(-6);
  if (recent.length === 0) return "(이전 대화 없음)";
  return recent.map((h) => `${h.role}: ${h.text}`).join("\n");
}

function normalizeResponse(text: string, fallback: string): string {
  if (typeof text !== "string") return fallback;
  let t = text.trim();
  t = t.replace(/\n{3,}/g, "\n\n");
  const boilerplate = /^(다음은|아래는|응답:|답변:)\s*/i;
  t = t.replace(boilerplate, "").trim();
  return t.length > 0 ? t : fallback;
}

type GeminiApiOk = { text?: string; raw?: unknown };
type GeminiApiErr = { error?: string; details?: string };

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      systemInstruction,
      model: DEFAULT_MODEL,
      temperature: 0.7,
      maxOutputTokens: 2048,
    }),
  });

  const rawText = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(rawText) as unknown;
  } catch {
    throw new Error(`/api/gemini: invalid JSON (${res.status}): ${rawText.slice(0, 200)}`);
  }

  if (!res.ok) {
    const err = json as GeminiApiErr;
    const msg = [err?.error, err?.details].filter(Boolean).join(": ") || rawText.slice(0, 300);
    throw new Error(msg || `Gemini proxy error: ${res.status}`);
  }

  const ok = json as GeminiApiOk;
  const text = ok.text;
  return typeof text === "string" ? text.trim() : "";
}

const SUMMARY_SYSTEM =
  "너는 사주 해석 상담가다. 입력된 사주 정보만 바탕으로 해석한다. 일반론, 뻔한 자기계발 문구, 반복 표현을 피한다. 성향, 감정 패턴, 인간관계, 일의 방식, 삶의 흐름을 구체적으로 설명한다. 한국어로 자연스럽게 작성한다.";

const CHAT_SYSTEM =
  "너는 사주 상담 챗봇이다. 반드시 사용자의 사주 정보와 최근 대화 맥락에 근거해서만 답한다. 같은 표현과 같은 결론을 반복하지 않는다. 추상적인 위로보다 구체적인 해석을 우선한다. 답변은 자연스러운 한국어 상담체로 작성한다. 필요하면 조심스럽게 가능성과 경향으로 표현한다.";

export async function generateSajuSummary(sajuData: SajuData): Promise<string> {
  const fn = "generateSajuSummary";
  try {
    const elementsStr = formatElements(sajuData.elements);
    const pillarStr = sajuData.pillar ? formatPillar(sajuData.pillar) : "";

    const lines: string[] = [
      `이름: ${sajuData.name ?? "—"}`,
      `일간: ${sajuData.ilgan}`,
      `오행 분포: ${elementsStr}`,
    ];
    if (pillarStr) lines.push(`사주 4주: ${pillarStr}`);
    if (sajuData.strengthSummary) lines.push(`강약/특징: ${sajuData.strengthSummary}`);
    if (sajuData.birthDate) lines.push(`생년월일: ${sajuData.birthDate}`);
    if (sajuData.birthTime) lines.push(`출생시간: ${sajuData.birthTime}`);
    if (sajuData.mbti) lines.push(`MBTI: ${sajuData.mbti}`);
    if (sajuData.zodiac_korean) lines.push(`별자리: ${sajuData.zodiac_korean}`);
    if (sajuData.enneagram) lines.push(`에니어그램: ${sajuData.enneagram}`);

    const prompt = `
사용자의 사주 정보:
${lines.join("\n")}

아래 항목을 사주에 근거해서만 구체적으로 설명해줘. 일반적인 운세 말은 쓰지 마라.
- 기본 성향
- 감정 반응 패턴
- 관계 방식
- 일/커리어 성향
- 삶의 흐름
`;

    const text = await callGemini(prompt, SUMMARY_SYSTEM);
    return normalizeResponse(text, "사주를 바탕으로 한 성향 요약을 생성했습니다. 궁금한 점이 있으면 질문해 주세요.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[${fn}] failed:`, msg);
    return FALLBACK_MESSAGE;
  }
}

export async function generateSajuChatReply(
  sajuData: SajuData,
  userMessage: string,
  history: ChatHistoryItem[]
): Promise<string> {
  const fn = "generateSajuChatReply";
  try {
    const elementsStr = formatElements(sajuData.elements);
    const pillarStr = sajuData.pillar ? formatPillar(sajuData.pillar) : "";
    const historyStr = formatHistory(history);

    const lines: string[] = [
      `이름: ${sajuData.name ?? "—"}`,
      `일간: ${sajuData.ilgan}`,
      `오행: ${elementsStr}`,
    ];
    if (pillarStr) lines.push(`사주 4주: ${pillarStr}`);
    if (sajuData.strengthSummary) lines.push(`강약/특징: ${sajuData.strengthSummary}`);
    if (sajuData.birthDate || sajuData.birthTime) {
      lines.push(`생년월일/시간: ${sajuData.birthDate ?? ""} ${sajuData.birthTime ?? ""}`.trim());
    }
    if (sajuData.mbti) lines.push(`MBTI: ${sajuData.mbti}`);
    if (sajuData.zodiac_korean) lines.push(`별자리: ${sajuData.zodiac_korean}`);
    if (sajuData.enneagram) lines.push(`에니어그램: ${sajuData.enneagram}`);

    const prompt = `
사주 핵심 정보:
${lines.join("\n")}

최근 대화:
${historyStr}

현재 사용자 질문:
${userMessage}

위 사주(일간·오행·패턴)에 근거해 질문에 직접 해석해줘. 같은 문장·같은 결론을 반복하지 말고, 필요하면 현재 경향이나 조심할 점을 구체적으로 적어줘.
`;

    const text = await callGemini(prompt, CHAT_SYSTEM);
    return normalizeResponse(text, "답변을 생성하지 못했습니다. 질문을 다시 구체적으로 적어 주세요.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[${fn}] failed:`, msg);
    return FALLBACK_MESSAGE;
  }
}

export async function generateSajuCategoryReading(params: {
  systemInstruction: string;
  prompt: string;
}): Promise<string> {
  const fn = "generateSajuCategoryReading";
  try {
    const text = await callGemini(params.prompt, params.systemInstruction);
    return normalizeResponse(text, "");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[${fn}] failed:`, msg);
    return "";
  }
}

export type GeminiMessage = { role: "user" | "model"; text: string };
