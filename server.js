import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return done(new Error('Please send a JPEG, PNG, or WebP image.'));
    }
    done(null, true);
  },
});

const port = Number(process.env.PORT || 3000);
const dirname = path.dirname(fileURLToPath(import.meta.url));

const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
const openRouterKey = (process.env.OPENROUTER_API_KEY || '').trim();
const openRouterModel = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-super-vl:free';
const rawOpenAIKey = (process.env.OPENAI_API_KEY || '').trim();
const isOpenAI = rawOpenAIKey.startsWith('sk-');
const openai = isOpenAI ? new OpenAI({ apiKey: rawOpenAIKey, timeout: 12000, maxRetries: 0 }) : null;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    configured: Boolean(openRouterKey || geminiKey || openai),
    providers: {
      openrouter: Boolean(openRouterKey),
      gemini: Boolean(geminiKey),
      openai: Boolean(openai),
    },
    activeProvider: openRouterKey ? 'openrouter' : geminiKey ? (openai ? 'gemini+openai' : 'gemini') : (openai ? 'openai' : 'none'),
    model: openRouterKey ? openRouterModel : (process.env.GEMINI_MODEL || 'gemini-3.8-flash'),
  });
});

/* ---- Hindi Detection (Devanagari or Roman Hinglish) ---- */
function isHindiText(text) {
  if (!text) return false;
  if (/[\u0900-\u097F]/.test(text)) return true;
  return /\b(ki|kya|hai|hain|samne|saamne|aage|dikhao|dikh|batao|bataiye|dekh|dekho|yeh|ye|woh|wo|kahan|kidhar|mera|meri|mere|kaun|kitna|kitne|kaise|padh|padho|madad|namaste|shukriya|dhanyawad|ruko|bas|chup|phir|dobara|bata|likha|note|rupaye|paisa|paise|dawa|dawai|darwaza|kursi|table)\b/i.test(text);
}

/* ---- System Prompt with High-Speed Concise Multilingual Rules ---- */
function buildPrompt(question, mode, userLang) {
  const isHindi = userLang?.startsWith('hi') || isHindiText(question);
  const isCurrencyMode = mode === 'currency' || /\b(note|currency|money|paisa|paise|rupaye|banknote|denomination|fake|real|genuine)\b/i.test(question || '');

  let taskInstruction = '';
  if (isCurrencyMode) {
    if (isHindi) {
      taskInstruction =
        'आप दृष्टिबाधित उपयोगकर्ता के सहायक हैं। नोट दिखे तो उसका मूल्य और मुद्रा बताएं। केवल तस्वीर देखकर असली होने की पुष्टि न करें; सुरक्षा चिह्न साफ न हों तो कहें कि सत्यापन संभव नहीं है। फिर तुरंत सामने की बाधा या खतरा बताएं। अधिकतम 3 सरल वाक्य।';
    } else {
      taskInstruction =
        'You are a visual assistant for a blind or low-vision user. If a banknote is visible, state its denomination and currency. Do not claim to authenticate it from a photo; say if visible security details look suspicious or cannot be verified. Then mention immediate obstacles or hazards. Use at most 3 short sentences.';
    }
  } else if (mode === 'read') {
    if (isHindi) {
      taskInstruction =
        'कार्य: आप दृष्टिबाधित उपयोगकर्ता की आँखें हैं। सामने दिख रहे किसी भी लेख, दवा के नाम, एक्सपायरी डेट, बोर्ड या नोट को पढ़कर सुनाएं। उत्तर 2 से 3 सरल वाक्यों में दें।';
    } else {
      taskInstruction =
        'TASK: You are the eyes for a blind or low-vision user. Read aloud all clearly visible text, brand names, medicine labels, expiry dates, signs, or currency notes/coins verbatim. Keep it direct and under 3 simple sentences.';
    }
  } else if (question) {
    if (isHindi) {
      taskInstruction =
        `कार्य: दृष्टिबाधित उपयोगकर्ता के इस सवाल का सटीक उत्तर दें: "${question}"। जो सामने साफ दिख रहा है केवल वही बताएं। दिशा (सीधे आगे, बाएं, दाएं) बताएं। उत्तर 2 सरल वाक्यों में दें।`;
    } else {
      taskInstruction =
        `TASK: Answer the blind user's specific question: "${question}". Use only what is clearly visible. State spatial positions (e.g. directly in front, to your left, to your right, on the table/floor). If currency or medicine is asked, state exact details. Keep answer direct and under 3 simple sentences.`;
    }
  } else {
    if (isHindi) {
      taskInstruction =
        'कार्य: दृष्टिबाधित व्यक्ति के लिए, सीधे सामने क्या है उसका स्पष्ट और सजीव वर्णन करें। तुरंत आने वाली रुकावटों (कुर्सी, दरवाजा, सीढ़ी, व्यक्ति) को प्राथमिकता दें। उत्तर 2 से 3 सरल वाक्यों में दें।';
    } else {
      taskInstruction =
        'You are a visual assistant for a blind or low-vision user. Describe the scene, prioritizing nearby obstacles and hazards. Be direct, state left/center/right only when clear, and use at most 3 short sentences.';
    }
  }

  let languageDirective = '';
  if (isHindi) {
    languageDirective =
      'MANDATORY LANGUAGE RULE (HINDI):\n' +
      'The user communicates in Hindi.\n' +
      'Reply ENTIRELY in natural, fluent Hindi using Devanagari script (हिन्दी).\n' +
      'Keep it strictly under 3 simple sentences. Do not use complex jargon.';
  } else {
    languageDirective =
      'CRITICAL MULTILINGUAL INSTRUCTION:\n' +
      'If the question is in any language other than English, respond in that exact same language.\n' +
      'Strictly under 3 simple sentences. Direct and practical for a blind user.';
  }

  return `${taskInstruction}\n\n${languageDirective}`;
}

/* ---- High-Speed Gemini Caller with Fast-First Fallbacks ---- */
async function callGeminiVision(base64Data, mimeType, prompt, customKey) {
  const activeKey = (customKey || geminiKey || '').trim();
  if (!activeKey) {
    throw new Error('Gemini API key is missing. Please configure it in .env or provide your key in the app.');
  }

  // Active high-speed vision models (fastest lite-first)
  // A single supported Flash model prevents a chain of failed model requests
  // from turning one scan into a multi-minute wait.
  const models = [process.env.GEMINI_MODEL || 'gemini-3.8-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);
      let response;
      let data;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': activeKey },
          signal: controller.signal,
          body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType || 'image/jpeg', data: base64Data } },
            ],
          }],
          generationConfig: { maxOutputTokens: 180, temperature: 0.2 },
          }),
        });
        data = await response.json();
      } finally {
        clearTimeout(timeoutId);
      }
      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim();
      }

      const errMsg = data.error?.message || `Model ${model} returned status ${response.status}`;
      lastError = new Error(errMsg);
      console.warn(`Model ${model} issue:`, errMsg);
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} error or timeout:`, err.message);
    }
  }

  throw lastError || new Error('AI vision service unavailable.');
}

/* ---- OpenRouter Vision (OpenAI-compatible chat completions API) ---- */
async function callOpenRouterModel(base64Data, mimeType, prompt, model) {
  if (!openRouterKey) throw new Error('OpenRouter API key is not configured.');
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'AURA AI',
    },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${base64Data}` } },
      ] }],
      max_tokens: 160,
      temperature: 0.2,
      // This is a short assistive response. Avoid spending the entire output
      // budget on hidden reasoning on reasoning-capable vision models.
      reasoning: { enabled: false },
      stream: false,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error?.message || `OpenRouter returned status ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    error.provider = data.error?.metadata?.provider_name || data.error?.provider_name || 'unknown';
    error.providerCode = data.error?.code || data.error?.metadata?.status || response.status;
    throw error;
  }
  const choice = data.choices?.[0];
  const message = choice?.message;
  // OpenAI-compatible APIs may return either a string or typed content blocks.
  const answer = typeof message?.content === 'string'
    ? message.content
    : Array.isArray(message?.content)
      ? message.content
          .filter((part) => part?.type === 'text' && typeof part.text === 'string')
          .map((part) => part.text)
          .join('\n')
      : '';
  if (answer.trim()) return answer.trim();

  // Do not log provider message contents or request/image data. These fields
  // are enough to diagnose an empty completion without exposing user data.
  const finishReason = choice?.finish_reason || 'unknown';
  const diagnostic = [
    `finish_reason=${finishReason}`,
    `reasoning=${Boolean(message?.reasoning || message?.reasoning_details?.length)}`,
    `refusal=${Boolean(message?.refusal)}`,
    `completion_tokens=${data.usage?.completion_tokens ?? 'unknown'}`,
    `response_id=${data.id || 'unknown'}`,
  ].join(', ');
  console.warn(`[AURA AI] OpenRouter returned no visible text (${diagnostic}).`);
  const error = new Error(`OpenRouter returned no visible answer (finish reason: ${finishReason}).`);
  error.status = 502;
  throw error;
}

/* Retry transient upstream failures through OpenRouter's image-capable free router. */
async function callOpenRouterVision(base64Data, mimeType, prompt) {
  try {
    return await callOpenRouterModel(base64Data, mimeType, prompt, openRouterModel);
  } catch (primaryError) {
    const shouldRetry =
      openRouterModel !== 'openrouter/free' &&
      (!primaryError.status || primaryError.status >= 500);
    if (!shouldRetry) throw primaryError;

    console.warn(
      `[AURA AI] OpenRouter model ${openRouterModel} failed (provider=${primaryError.provider || 'unknown'}, code=${primaryError.providerCode || primaryError.status || 'network'}); retrying via openrouter/free.`
    );
    try {
      return await callOpenRouterModel(base64Data, mimeType, prompt, 'openrouter/free');
    } catch (fallbackError) {
      console.warn(
        `[AURA AI] OpenRouter free-router fallback failed (provider=${fallbackError.provider || 'unknown'}, code=${fallbackError.providerCode || fallbackError.status || 'network'}): ${fallbackError.message}`
      );
      // Preserve the primary error because it identifies the configured model
      // failure; report the fallback failure as context without request data.
      const error = new Error(`${primaryError.message}; free-router fallback: ${fallbackError.message}`);
      error.status = fallbackError.status || primaryError.status || 502;
      throw error;
    }
  }
}

/* ---- Unified Vision & Analysis Handler ---- */
async function handleVisionRequest(req, res, next) {
  try {
    const customKey = req.headers['x-gemini-api-key'] || req.headers['x-api-key'] || req.body?.apiKey;
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (req.file) {
      base64Data = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype || 'image/jpeg';
    } else if (req.body?.image) {
      const raw = req.body.image;
      if (raw.startsWith('data:')) {
        const match = raw.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        } else {
          base64Data = raw.split(',')[1] || raw;
        }
      } else {
        base64Data = raw;
      }
    } else if (req.body?.base64) {
      base64Data = req.body.base64;
    }

    if (!base64Data) {
      return res.status(400).json({ error: 'No image was provided. Please capture or send a frame.' });
    }

    const question = typeof req.body.question === 'string' ? req.body.question.trim().slice(0, 500) : '';
    const mode = req.body.mode || (req.path.includes('currency') ? 'currency' : 'describe');
    const userLang = req.body.language || 'en';
    const prompt = buildPrompt(question, mode, userLang);

    // Prefer OpenRouter when configured, then keep the existing Gemini/OpenAI fallback.
    let answer = null;
    let primaryErr = null;

    const isCustomOpenAI = typeof customKey === 'string' && customKey.trim().startsWith('sk-');
    const activeOpenAI = isCustomOpenAI
      ? new OpenAI({ apiKey: customKey.trim(), timeout: 12000, maxRetries: 0 })
      : openai;

    if (openRouterKey) {
      try {
        answer = await callOpenRouterVision(base64Data, mimeType, prompt);
      } catch (openRouterErr) {
        primaryErr = openRouterErr;
        console.warn('[AURA AI] OpenRouter notice:', openRouterErr.message);
      }
    }

    // 1. Google Gemini fallback (skip when the request explicitly carries an OpenAI key)
    if (!answer && !isCustomOpenAI && (customKey || geminiKey)) {
      try {
        answer = await callGeminiVision(base64Data, mimeType, prompt, customKey);
      } catch (geminiErr) {
        primaryErr = geminiErr;
        if (!primaryErr) primaryErr = geminiErr;
        console.warn('[AURA AI] Gemini vision notice:', geminiErr.message);
      }
    }

    // 2. OpenAI Cloud Engine (seamless fallback or primary if OpenAI key specified)
    if (!answer && activeOpenAI) {
      try {
        const imageUri = `data:${mimeType};base64,${base64Data}`;
        const configuredModel = process.env.OPENAI_VISION_MODEL || '';
        const model = /^gpt-[a-z0-9.-]+$/i.test(configuredModel) ? configuredModel : 'gpt-4o-mini';
        const result = await activeOpenAI.chat.completions.create({
          model,
          max_tokens: 160,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUri, detail: 'low' } },
            ],
          }],
        });

        answer = result.choices?.[0]?.message?.content?.trim();
      } catch (openAiErr) {
        console.error('[AURA AI] OpenAI vision error:', openAiErr.message);
        if (!primaryErr) primaryErr = openAiErr;
      }
    }

    if (answer) {
      return res.json({ answer, success: true });
    }

    throw primaryErr || new Error('No description returned. Please check API keys.');
  } catch (error) {
    next(error);
  }
}

import https from 'node:https';

/* ---- Reliable Multi-language TTS Endpoint ---- */
app.get('/api/tts', (req, res) => {
  const text = (req.query.text || '').trim();
  const rawLang = (req.query.lang || 'en').toLowerCase();
  const lang = rawLang.startsWith('hi') ? 'hi' : 'en';

  if (!text) {
    return res.status(400).send('Text parameter required.');
  }

  // Google Translate TTS accepts chunks up to ~200 characters cleanly
  const querySlice = text.slice(0, 280);
  const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(querySlice)}`;

  https.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (ttsRes) => {
    if (ttsRes.statusCode === 200) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      ttsRes.pipe(res);
    } else {
      res.status(ttsRes.statusCode || 500).json({ error: 'TTS upstream failed' });
    }
  }).on('error', (err) => {
    console.error('TTS proxy error:', err.message);
    res.status(500).json({ error: err.message });
  });
});

/* ---- Mount both /api/analyze and /api/vision ---- */
app.post('/api/analyze', upload.single('image'), handleVisionRequest);
app.post('/api/vision', upload.single('image'), handleVisionRequest);

/* ---- Error Handler ---- */
app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    return res.status(413).json({
      error: error.code === 'LIMIT_FILE_SIZE' ? 'Image too large.' : 'Single image only.',
    });
  }

  const status = error.status || error.statusCode;
  if (status === 401) {
    return res.status(503).json({ error: 'AI key rejected. Check GEMINI_API_KEY in .env.' });
  }
  if (status === 429) {
    return res.status(503).json({ error: 'Service busy. Please wait a moment.' });
  }

  console.error('Vision request failed:', error.message);
  res.status(status >= 500 && status <= 599 ? status : 500).json({ error: error.message || 'Could not analyze image.' });
});

import fs from 'node:fs';

const distPath = path.join(dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(port, () => {
  const activeProviders = [openRouterKey && 'OpenRouter', geminiKey && 'Google Gemini', openai && 'OpenAI (gpt-4o-mini)'].filter(Boolean);
  console.log(`AURA AI backend listening on http://localhost:${port}`);
  if (openRouterKey) console.log(`OpenRouter model: ${openRouterModel}`);
  else console.log(`Gemini model: ${process.env.GEMINI_MODEL || 'gemini-3.8-flash'}`);
  console.log(`AI active providers: ${activeProviders.join(' + ') || 'None'}`);
});
