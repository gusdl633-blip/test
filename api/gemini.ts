import type { VercelRequest, VercelResponse } from "@vercel/node";

const UPSTREAM = "https://generativelanguage.googleapis.com/v1/models";

type GeminiProxyBody = {
  prompt?: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

function mergePrompt(prompt: string, systemInstruction?: string): string {
  const trimmed = typeof systemInstruction === "string" ? systemInstruction.trim() : "";
  if (!trimmed) return prompt;
  return `[시스템 규칙]\n${trimmed}\n\n[사용자 데이터]\n${prompt}`;
}

function bodyTypeOf(value: unknown): string {
  if (typeof value === "string") return "string";
  if (Buffer.isBuffer(value)) return "buffer";
  if (value instanceof Uint8Array) return "uint8array";
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  if (typeof value === "object") return "object";
  return typeof value;
}

function safePreview(value: unknown, maxLen = 120): string {
  try {
    if (typeof value === "string") return value.slice(0, maxLen);
    if (Buffer.isBuffer(value)) return value.toString("utf8").slice(0, maxLen);
    if (value instanceof Uint8Array) return Buffer.from(value).toString("utf8").slice(0, maxLen);
    if (value === null) return "null";
    if (typeof value === "object") return JSON.stringify(value).slice(0, maxLen);
    return typeof value === "undefined" ? "" : String(value).slice(0, maxLen);
  } catch {
    return "";
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed", details: "Use POST" });
    return;
  }

  const isDev = process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "development";

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    res.status(500).json({
      error: "Server misconfiguration",
      details: "GEMINI_API_KEY is not set",
    });
    return;
  }

  // Robust request-body parsing: accept JSON object OR JSON string OR Buffer/Uint8Array.
  const rawBody: unknown = req.body;
  let parsedBody: any = {};
  const bodyType = bodyTypeOf(rawBody);
  const rawPreview120 = safePreview(rawBody, 120);

  if (typeof rawBody === "string") {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      res.status(400).json({
        error: "Invalid JSON body",
        details: {
          bodyType,
          preview: rawPreview120,
        },
      });
      return;
    }
  } else if (Buffer.isBuffer(rawBody)) {
    try {
      parsedBody = JSON.parse(rawBody.toString("utf8"));
    } catch {
      res.status(400).json({
        error: "Invalid JSON body",
        details: {
          bodyType,
          preview: safePreview(rawBody, 120),
        },
      });
      return;
    }
  } else if (rawBody instanceof Uint8Array) {
    try {
      parsedBody = JSON.parse(Buffer.from(rawBody).toString("utf8"));
    } catch {
      res.status(400).json({
        error: "Invalid JSON body",
        details: {
          bodyType,
          preview: safePreview(rawBody, 120),
        },
      });
      return;
    }
  } else if (rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)) {
    parsedBody = rawBody;
  }

  const promptRaw = (parsedBody ?? {})?.prompt;
  const promptType = bodyTypeOf(promptRaw);

  const {
    prompt = "",
    systemInstruction = "",
    model = "gemini-2.5-flash",
    temperature = 0.7,
    maxOutputTokens = 2048,
  } = (parsedBody ?? {}) as Partial<GeminiProxyBody>;

  const promptStr = typeof prompt === "string" ? prompt : "";
  const systemInstructionStr = typeof systemInstruction === "string" ? systemInstruction : "";
  const modelStr = typeof model === "string" && model.trim() ? model.trim() : "gemini-2.5-flash";
  const temperatureNum = typeof temperature === "number" && Number.isFinite(temperature) ? temperature : 0.7;
  const maxOutputTokensNum =
    typeof maxOutputTokens === "number" && Number.isFinite(maxOutputTokens) ? maxOutputTokens : 2048;

  if (isDev) {
    console.info("[SAJU][api/gemini][debug] typeof req.body:", typeof rawBody);
    console.info("[SAJU][api/gemini][debug] prompt type:", promptType);
    console.info("[SAJU][api/gemini][debug] prompt preview:", promptStr.slice(0, 120));
    console.info("[SAJU][api/gemini][debug] selected model:", modelStr);
  }

  if (!promptStr.trim()) {
    res.status(400).json({
      error: "Missing prompt",
      details: {
        bodyType,
        promptType,
        preview: rawPreview120,
      },
    });
    return;
  }

  const fullPrompt = mergePrompt(promptStr, systemInstructionStr);

  const upstreamUrl = `${UPSTREAM}/${encodeURIComponent(modelStr)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const generationConfig = {
    temperature: temperatureNum,
    maxOutputTokens: maxOutputTokensNum,
    responseMimeType: "application/json" as const,
  };

  // Temporary: remove after verifying JSON mode in production
  console.log(
    "[DEBUG][api/gemini] upstream generationConfig.responseMimeType:",
    generationConfig.responseMimeType ?? "(missing)"
  );

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig,
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(502).json({ error: "Upstream request failed", details: msg });
    return;
  }

  const rawText = await upstreamRes.text();
  let raw: unknown = rawText;
  try {
    raw = JSON.parse(rawText) as unknown;
  } catch {
    raw = { parseError: true, body: rawText.slice(0, 500) };
  }

  if (!upstreamRes.ok) {
    const errMsg =
      typeof raw === "object" && raw !== null && "error" in raw
        ? String((raw as { error?: { message?: string } }).error?.message || upstreamRes.statusText)
        : rawText.slice(0, 300);
    res.status(upstreamRes.status >= 400 && upstreamRes.status < 600 ? upstreamRes.status : 502).json({
      error: "Gemini API error",
      details: errMsg,
    });
    return;
  }

  const data = raw as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const outText = typeof text === "string" ? text : "";

  // Temporary: remove after verifying JSON mode in production
  console.log("[DEBUG][api/gemini] upstream model text (first 200 chars):", outText.slice(0, 200));

  res.status(200).json({ text: outText, raw });
}
