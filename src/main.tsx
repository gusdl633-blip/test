import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { GEMINI_GENERATE_CONTENT_URL, GEMINI_MODEL_ID, RUNTIME_FETCHES_API_SAJU } from "./lib/gemini";

if (import.meta.env.DEV) {
  console.info("[SAJU][debug] startup model:", GEMINI_MODEL_ID);
  console.info("[SAJU][debug] startup Gemini URL (no key):", GEMINI_GENERATE_CONTENT_URL);
  console.info("[SAJU][debug] startup runtime fetch /api/saju in app:", RUNTIME_FETCHES_API_SAJU);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
