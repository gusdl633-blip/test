import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, systemInstruction, history } = req.body ?? {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Invalid request",
        detail: "prompt is required",
      });
    }

    const contents = [
      ...(Array.isArray(history)
        ? history.map((item: any) => ({
            role: item.role === "user" ? "user" : "model",
            parts: [{ text: item.text || "" }],
          }))
        : []),
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    let lastError: any = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction: systemInstruction || "",
          },
        });

        return res.status(200).json({
          text: response.text ?? "",
        });
      } catch (error: any) {
        lastError = error;

        const message = error?.message || "";
        const isRetryable =
          message.includes("503") ||
          message.includes("UNAVAILABLE") ||
          message.includes("high demand");

        if (!isRetryable || attempt === 2) {
          break;
        }

        await sleep(1500 * (attempt + 1));
      }
    }

    console.error("Gemini request failed:", lastError);

    return res.status(500).json({
      error: "Gemini request failed",
      detail: lastError?.message ?? "Unknown error",
    });
  } catch (error: any) {
    console.error("Gemini request failed:", error);

    return res.status(500).json({
      error: "Gemini request failed",
      detail: error?.message ?? "Unknown error",
    });
  }
}
