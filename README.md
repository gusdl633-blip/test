<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/3f420cf9-f945-4374-bb38-5f2288b93f05

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set **`GEMINI_API_KEY`** (server-only) in Vercel project env, or in **`.env.local`** for local serverless:
   - The browser calls **`/api/gemini`** only; do not use `VITE_GEMINI_API_KEY`.
3. Run locally (API + app):
   - **`vercel dev`** (recommended — serves Vite + `/api/gemini`), or
   - Terminal A: **`vercel dev`** on port 3000 · Terminal B: **`npm run dev`** (Vite proxies `/api/gemini` → `http://127.0.0.1:3000`)
