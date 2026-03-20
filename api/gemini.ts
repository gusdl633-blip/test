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

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed", details: "Use POST" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    res.status(500).json({
      error: "Server misconfiguration",
      details: "GEMINI_API_KEY is not set",
    });
    return;
  }

  let body: GeminiProxyBody = {};
  const rawBody = req.body;
  if (typeof rawBody === "string") {
    try {
      body = JSON.parse(rawBody) as GeminiProxyBody;
    } catch {
      res.status(400).json({ error: "Invalid JSON body", details: "Could not parse request body" });
      return;
    }
  } else if (rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)) {
    body = rawBody as GeminiProxyBody;
  }

  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  const systemInstruction = typeof body.systemInstruction === "string" ? body.systemInstruction : undefined;
  const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : "gemini-2.5-flash";
  const temperature = typeof body.temperature === "number" && Number.isFinite(body.temperature) ? body.temperature : 0.7;
  const maxOutputTokens =
    typeof body.maxOutputTokens === "number" && Number.isFinite(body.maxOutputTokens) ? body.maxOutputTokens : 2048;

  const fullPrompt = mergePrompt(prompt, systemInstruction);

  const upstreamUrl = `${UPSTREAM}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature, maxOutputTokens },
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

  res.status(200).json({ text: outText, raw });
}
