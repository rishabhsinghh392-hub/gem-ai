# Gem AI — live AI study chatbot

This project keeps the original Gem HTML design and connects it to OpenAI's Responses API through a small Node.js server. The API key stays on the server and is never placed in browser code.

## Requirements
- Node.js 20+
- An OpenAI API key with API billing/credits enabled

## Run locally
1. Extract this folder.
2. Open a terminal in the folder and run `npm install`.
3. Copy `.env.example` to `.env`.
4. Put your secret key in `.env` as `OPENAI_API_KEY=...` (do not share or commit this file).
5. Run `npm start`.
6. Open `http://localhost:3000`.

## Deploy
Deploy this Node app to a Node-compatible host (for example Render, Railway, or a VPS). Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` as server-side environment variables in the hosting dashboard. Do not put the key in `public/index.html` or any browser-side JavaScript. Then share the deployed HTTPS URL.

## Notes
- The app keeps the last 20 messages in the current browser session for follow-up context; it does not currently save accounts or chat history to a database.
- Add authentication, rate limits, abuse protection, usage caps, and a privacy notice before opening it to the public. API usage may incur charges.
- `GET /api/health` reports whether the server has a key configured; it does not expose the key.
