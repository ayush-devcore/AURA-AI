# AURA AI — Your Eyes, Your Freedom

AURA keeps its original voice-first workflow: rear camera, optional local COCO-SSD obstacle radar, on-demand cloud scene/currency/text analysis, English and Hindi commands, spoken answers, and keyboard controls.

## Run on Windows

Requires Node.js 20 or newer. Copy `.env.example` to `.env`, then set a valid `OPENROUTER_API_KEY`. Keys stay on the backend; do not add a `VITE_` prefix. OpenRouter is preferred when configured, using `nvidia/nemotron-3.5-super-vl:free` by default. You can select the paid `nvidia/nemotron-3.5-super-vl` model to avoid the free daily request cap; Gemini and OpenAI remain as fallbacks.

Start two PowerShell terminals in the project directory:

```powershell
npm start
```

```powershell
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`) and allow camera and microphone permissions. The interface starts the rear camera automatically. Say “Hey Aura” to ask a question, “Check money” for currency, “What’s ahead?” for a scene description, “Read this” for visible text, or “Alert on” to enable local obstacle alerts. “Mute” and “Unmute” control proximity beeps.

Keyboard shortcuts: Space starts listening, C checks currency, A describes the scene, M toggles obstacle beeps, and S or Escape stops speech/analysis.

The backend health endpoint is `http://localhost:3000/api/health`. Run `npm run build` to create the production frontend; `npm start` serves `dist` when it exists.

## Response time and safety

Cloud vision runs only after an explicit command. Snapshots are downscaled to 640 × 480 and sent as JPEG, without sending live video. Voice commands execute only on final recognition results, preventing interim transcripts from spending multiple requests. Answers use the browser’s local speech engine, removing the separate network TTS request. OpenRouter free models are limited to 50 requests/day and 20/minute on a free account. The free NVIDIA endpoint may log uploads and use them to improve services; avoid scanning sensitive people or documents with that free model. Paid inference is low cost but not free. Actual latency still depends on network and provider load.

COCO-SSD radar is a general object detector, not a certified mobility aid. Currency images can indicate denomination and visible anomalies but cannot establish authenticity. Keep using your cane, guide dog, or other mobility aids.
