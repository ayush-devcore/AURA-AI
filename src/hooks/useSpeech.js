import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Wake words supported across English and Hindi variations
 */
export const WAKE_WORD_REGEX = /\b(hey|hi|ok|okay|hello|हे|हाय|सुनो)?\s*(aura|ora|aurora|aora|oura|ayra|arora|order|error|horror|era|ara|ऑरा|ओरा|औरा|आरा)\b/i;

/**
 * Stop/Cancel words for immediate interruption
 */
export const STOP_WORDS_REGEX = /\b(stop|cancel|quiet|silence|hush|shut up|ruk|ruko|bas|chup|shant|band karo|रुको|रुक|शांत|चुप|बंद करो|बस)\b/i;

/**
 * Hindi script or Roman Hinglish detection
 */
export const isHindiText = (text) => {
  if (!text) return false;
  if (/[\u0900-\u097F]/.test(text)) return true;
  return /\b(ki|kya|hai|hain|samne|saamne|aage|dikhao|dikh|batao|bataiye|dekh|dekho|yeh|ye|woh|wo|kahan|kidhar|mera|meri|mere|kaun|kitna|kitne|kaise|padh|padho|madad|namaste|shukriya|dhanyawad|ruko|bas|chup|phir|dobara|bata|likha|note|rupaye|paisa|paise|dawa|dawai|darwaza|kursi|table|chalu|band)\b/i.test(text);
};

export const detectLanguage = (text) => {
  if (!text) return 'en-US';
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
  if (/[àâéèêëïîôùûüÿçœæ]/i.test(text)) return 'fr-FR';
  if (/[äöüß]/i.test(text)) return 'de-DE';
  if (/[áéíóúñ¿¡]/i.test(text)) return 'es-ES';
  return 'en-US';
};

/**
 * Classifies Voice Intent from raw transcribed text.
 * Supports both Wake-Word prefixed ("Hey Aura check money") AND direct phrases ("check money", "money", "ahead", "alert on")
 */
export function classifyVoiceIntent(rawText) {
  if (!rawText) return null;
  const lower = rawText.toLowerCase().trim();

  // Strip leading wake words ("hey aura", "aura", "hey order", etc.)
  const stripped = lower
    .replace(/^(hey|hi|hello|ok|okay|हे|हाय|सुनो)?\s*(aura|ora|aurora|aora|oura|ayra|arora|order|error|horror|era|ara|ऑरा|ओरा|औरा|आरा)\b[,.\s]*/i, '')
    .trim();

  const isHindi = isHindiText(rawText);
  const targetText = stripped || lower;

  // 1. STOP DETECTION / ALERT OFF COMMAND
  if (
    /\b(stop\s+.*?(detection|detecting|alerts?)|(detection|alerts?)\s+.*?stop|turn\s+off\s+.*?(detection|alerts?)|turn\s+.*?(detection|alerts?)\s+off|disable\s+.*?(detection|alerts?)|cancel\s+.*?(detection|alerts?)|pause\s+.*?(detection|alerts?)|halt\s+.*?(detection|alerts?)|alerts?\s+off|alerts?\s+mode\s+off|stop\s+camera(\s+detection)?|camera\s+alert\s+off|stop\s+object\s+detection|object\s+detection\s+off|roko\s+detection|detection\s+band|alert\s+band)\b/i.test(targetText) ||
    /(अलर्ट बंद|अलर्ट रोको|डिटेक्शन बंद|डिटेक्शन रोको|पहचान बंद|डिटेक्शन रोकें|कैमरा अलर्ट बंद|अलर्ट मोड बंद|डिटेक्शन बंद करो|अलर्ट बंद करो)/u.test(targetText)
  ) {
    return { type: 'stop_detection', query: rawText, isHindi };
  }

  // 2. START DETECTION / ALERT ON COMMAND ("alert on to start camera detection alert then only")
  if (
    /\b(alert on|alerts on|turn on alerts?|turn alert on|start alerts?|start alert|alert start|alerts start|alert mode|alert mode on|start alert mode|enable alerts?|start detection|resume detection|turn on detection|turn detection on|enable detection|begin detection|detection start|detection on|detection resume|camera alert|camera alert on|camera detection|start camera detection|object detection|start object detection|object detection on|obstacle detection|start obstacle detection|detection chalu|alert chalu)\b/i.test(targetText) ||
    /(अलर्ट चालू|अलर्ट शुरू|डिटेक्शन चालू|डिटेक्शन शुरू|पहचान चालू|डिटेक्शन आरंभ|कैमरा अलर्ट चालू|कैमरा अलर्ट|अलर्ट मोड चालू|अलर्ट मोड|ऑब्जेक्ट डिटेक्शन चालू|ऑब्जेक्ट डिटेक्शन)/u.test(targetText)
  ) {
    return { type: 'start_detection', query: rawText, isHindi };
  }

  // 3. STOP / SILENCE SPEECH
  if (STOP_WORDS_REGEX.test(targetText)) {
    return { type: 'stop', query: rawText, isHindi };
  }

  // 4. MUTE / UNMUTE OBSTACLE BEEPS
  if (/\b(unmute|beeps? on|sound on|audio on|aawaz chalu|aawaz on)\b/i.test(targetText)) {
    return { type: 'unmute', query: rawText, isHindi };
  }
  if (/\b(mute|beeps? off|sound off|audio off|silent|aawaz band|chup raho)\b/i.test(targetText)) {
    return { type: 'mute', query: rawText, isHindi };
  }

  // 5. CURRENCY / NOTE CHECKING ("money", "check money", "check note", etc.)
  if (
    /\b(money|note|currency|banknote|cash|rupee|rupees|rupaye|paisa|paise|denomination|bill)\b/i.test(targetText) ||
    /\b(check note|check money|check currency|what note|how much money|kitne ka note|note check|note batao|note dekho|paisa batao|rupaye kitne)\b/i.test(targetText) ||
    /(नोट|रुपये|रुपया|पैसे|पैसा|सिक्के|सिक्का|मुद्रा)/u.test(targetText)
  ) {
    return { type: 'currency', query: rawText, isHindi };
  }

  // 6. READ / OCR TEXT
  if (
    /\b(read|reading|text|written|kya likha|likha kya|padh|padho|padhke|board|label|sign|menu)\b/i.test(targetText) ||
    /(पढ़|पढ़ो|पढ़कर|लिखा|बोर्ड)/u.test(targetText)
  ) {
    return { type: 'read', query: rawText, isHindi };
  }

  // 7. WHAT'S AHEAD / SCENE DESCRIPTION ("ahead", "what's ahead", "in front", etc.)
  if (
    /\b(ahead|what'?s ahead|what is ahead|in front|describe|what do you see|look ahead|scan|around me|surroundings|obstacle)\b/i.test(targetText) ||
    /\b(samne|saamne|aage|dikh|dikhao|dekho|kya hai|kya dikh)\b/i.test(targetText) ||
    /(सामने|आगे|रास्ता|दिख|दिखाओ|देखो|क्या है)/u.test(targetText)
  ) {
    return { type: 'describe', query: rawText, isHindi };
  }

  // 8. GENERAL USER QUESTION ("option to listen to user and reply according to that")
  if (targetText && targetText.length > 2) {
    return { type: 'question', query: targetText, raw: rawText, isHindi };
  }

  return null;
}

/**
 * Splits text into natural sentence chunks for smooth single-voice audio playback
 */
function splitIntoSentences(text) {
  if (!text) return [];
  const parts = text.match(/[^.!?।\n]+[.!?।\n]+/g) || [text];
  const chunks = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.length <= 220) {
      chunks.push(trimmed);
    } else {
      const sub = trimmed.split(/[,،]+/).map((s) => s.trim()).filter(Boolean);
      chunks.push(...sub);
    }
  }
  return chunks.length > 0 ? chunks : [text];
}

/**
 * useSpeech Hook
 * 100% Single Consistent AI Voice + High-Accuracy Hands-Free & Push-To-Talk Listening
 */
export function useSpeech(callbacks = {}) {
  const {
    onCommand,
    onWake,
    onBargeIn,
    onToggleMute,
    onStopDetection,
    onStartDetection,
  } = callbacks;

  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);
  const wakeDebounceTimerRef = useRef(null);
  const activeWindowTimerRef = useRef(null);

  // Use the browser speech engine locally. This removes a remote TTS round trip
  // from every spoken response and keeps output independent of server load.
  const speechTimerRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingQueueRef = useRef(false);

  // Stable references for callbacks
  const onCommandRef = useRef(onCommand);
  const onWakeRef = useRef(onWake);
  const onBargeInRef = useRef(onBargeIn);
  const onToggleMuteRef = useRef(onToggleMute);
  const onStopDetectionRef = useRef(onStopDetection);
  const onStartDetectionRef = useRef(onStartDetection);

  useEffect(() => {
    onCommandRef.current = onCommand;
    onWakeRef.current = onWake;
    onBargeInRef.current = onBargeIn;
    onToggleMuteRef.current = onToggleMute;
    onStopDetectionRef.current = onStopDetection;
    onStartDetectionRef.current = onStartDetection;
  });

  const isSpeakingRef = useRef(false);
  const isRecognitionActiveRef = useRef(false);
  const isStartingRef = useRef(false);
  const recognitionBlockedRef = useRef(false);
  const isAuraAwakeRef = useRef(false);
  const isListeningPromptRef = useRef(false);
  const activeLangRef = useRef('en-US');
  const lastExecutedCmdRef = useRef({ type: '', text: '', time: 0 });
  const lastSpokenPhraseRef = useRef('');

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micNotice, setMicNotice] = useState('');
  const [activeLang, setActiveLang] = useState('en-US');

  useEffect(() => {
    activeLangRef.current = activeLang;
  }, [activeLang]);

  /* ================================================================
     1. SINGLE LOCAL SPEECH QUEUE
     ================================================================ */
  const stopSpeaking = useCallback(() => {
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    try { window.speechSynthesis?.cancel(); } catch {}
    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;
    isSpeakingRef.current = false;
    lastSpokenPhraseRef.current = '';
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text, options = {}) => {
      const { onFinish, isUrgent = false, priority = 'normal' } = options;
      if (!text) {
        onFinish?.();
        return;
      }

      // Routine alerts never stack over speech. Urgent hazards and direct
      // user-requested answers can interrupt the current message.
      if (isSpeakingRef.current && !isUrgent && priority !== 'high') return;
      stopSpeaking();

      isSpeakingRef.current = true;
      setIsSpeaking(true);
      lastSpokenPhraseRef.current = text.toLowerCase().trim();

      const detectedLang = detectLanguage(text);
      const targetLang = detectedLang === 'en-US' ? activeLangRef.current : detectedLang;
      const chunks = splitIntoSentences(text);
      audioQueueRef.current = [...chunks];
      isPlayingQueueRef.current = true;

      if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        isSpeakingRef.current = false;
        isPlayingQueueRef.current = false;
        setIsSpeaking(false);
        setMicNotice('Speech output is unavailable in this browser.');
        onFinish?.();
        return;
      }

      const finish = () => {
        if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
        speechTimerRef.current = null;
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        isPlayingQueueRef.current = false;
        onFinish?.();
      };

      const playNextChunk = () => {
        if (!isPlayingQueueRef.current) {
          return;
        }

        if (audioQueueRef.current.length === 0) {
          finish();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(audioQueueRef.current.shift());
        utterance.lang = targetLang;
        utterance.rate = 0.98;
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === targetLang.toLowerCase()) ||
          voices.find((voice) => voice.lang.toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase())) || null;
        utterance.onstart = () => { isSpeakingRef.current = true; setIsSpeaking(true); };
        utterance.onend = playNextChunk;
        utterance.onerror = (event) => {
          if (event.error === 'canceled' || event.error === 'interrupted') return;
          playNextChunk();
        };
        speechTimerRef.current = setTimeout(() => {
          window.speechSynthesis.cancel();
          finish();
        }, Math.max(15000, text.split(/\s+/).length * 700 + 7000));
        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          playNextChunk();
        }
      };

      playNextChunk();
    },
    [stopSpeaking]
  );

  /* ================================================================
     2. CONTINUOUS SPEECH RECOGNITION (Hands-Free + Direct Commands)
     ================================================================ */
  const startContinuousRecognition = useCallback(() => {
    if (recognitionBlockedRef.current) return;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setMicNotice('Speech recognition unavailable. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isRecognitionActiveRef.current || isStartingRef.current) {
      return;
    }

    isStartingRef.current = true;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      }
    } catch {}

    const recognition = new SR();
    recognition.lang = activeLangRef.current.startsWith('hi') ? 'hi-IN' : 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 3;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      isStartingRef.current = false;
      isRecognitionActiveRef.current = true;
      setIsListening(true);
      setMicNotice('');
    };

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const rawTranscript = event.results[i][0].transcript.trim();
        const isFinal = event.results[i].isFinal;
        const lower = rawTranscript.toLowerCase();

        // Echo Cancellation: If mic hears the exact confirmation phrase Aura is speaking, ignore it
        if (isSpeakingRef.current && lastSpokenPhraseRef.current && lower.includes(lastSpokenPhraseRef.current)) {
          return;
        }

        // Auto-detect Hindi language spoken by user
        if (isHindiText(rawTranscript)) {
          activeLangRef.current = 'hi-IN';
          setActiveLang('hi-IN');
        }

        const hasWakeWord = WAKE_WORD_REGEX.test(lower);
        const hasStopWord = STOP_WORDS_REGEX.test(lower);

        // BARGE-IN INTERRUPTION: If Aura is currently speaking, user speech stops it immediately
        if ((hasWakeWord || hasStopWord) && isSpeakingRef.current) {
          console.log('[AURA AI] Barge-in interrupted AI speech.');
          stopSpeaking();
          onBargeInRef.current?.();
        }

        const intent = classifyVoiceIntent(rawTranscript);

        // If a direct command or wake word matched:
        if (intent) {
          // Interim speech results are revised multiple times by Chrome and
          // must not each consume a cloud request.
          if (!isFinal && !['stop', 'stop_detection'].includes(intent.type)) continue;
          const isDirectAction = [
            'stop_detection',
            'start_detection',
            'currency',
            'describe',
            'read',
            'stop',
            'mute',
            'unmute',
          ].includes(intent.type);

          // Execute immediately if:
          // - It's a direct known action (e.g. "stop detection", "alert on", "check money", "ahead")
          // - OR wake word was detected
          // - OR user manually clicked listen button
          if (isDirectAction || hasWakeWord || isAuraAwakeRef.current || isListeningPromptRef.current) {
            const now = Date.now();
            // Prevent duplicate rapid re-triggering of the same command on interim & final results
            if (
              lastExecutedCmdRef.current.type === intent.type &&
              now - lastExecutedCmdRef.current.time < 2500
            ) {
              return;
            }
            lastExecutedCmdRef.current = { type: intent.type, text: rawTranscript, time: now };

            if (wakeDebounceTimerRef.current) clearTimeout(wakeDebounceTimerRef.current);
            if (activeWindowTimerRef.current) clearTimeout(activeWindowTimerRef.current);
            isAuraAwakeRef.current = false;
            isListeningPromptRef.current = false;

            if (intent.type === 'stop_detection') {
              onStopDetectionRef.current?.();
              return;
            }
            if (intent.type === 'start_detection') {
              onStartDetectionRef.current?.();
              return;
            }
            if (intent.type === 'stop') {
              stopSpeaking();
              onBargeInRef.current?.();
              return;
            }
            if (intent.type === 'mute' || intent.type === 'unmute') {
              onToggleMuteRef.current?.(intent.type);
              return;
            }

            // Visual AI commands: currency, describe, read, or specific user question
            onCommandRef.current?.(intent);
            return;
          }
        }

        // If user said "Hey Aura" alone, open listening window
        if (hasWakeWord) {
          if (wakeDebounceTimerRef.current) clearTimeout(wakeDebounceTimerRef.current);

          wakeDebounceTimerRef.current = setTimeout(() => {
            isAuraAwakeRef.current = true;
            if (activeWindowTimerRef.current) clearTimeout(activeWindowTimerRef.current);
            activeWindowTimerRef.current = setTimeout(() => {
              isAuraAwakeRef.current = false;
            }, 8000);

            onWakeRef.current?.();
          }, isFinal ? 80 : 400);
          return;
        }
      }
    };

    recognition.onerror = (event) => {
      isStartingRef.current = false;
      isRecognitionActiveRef.current = false;
      setIsListening(false);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        recognitionBlockedRef.current = true;
        setMicNotice('Microphone blocked. Please click the lock/settings icon in the address bar and set Microphone to Allow.');
        return;
      }
      // Note: onend is guaranteed to fire and will handle single-point clean restart
    };

    recognition.onend = () => {
      isStartingRef.current = false;
      isRecognitionActiveRef.current = false;
      setIsListening(false);

      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (recognitionBlockedRef.current) return;
      restartTimerRef.current = setTimeout(() => {
        startContinuousRecognition();
      }, 700);
    };

    try {
      recognition.start();
    } catch {
      isStartingRef.current = false;
      isRecognitionActiveRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (recognitionBlockedRef.current) return;
      restartTimerRef.current = setTimeout(() => {
        startContinuousRecognition();
      }, 1000);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    const nextLang = activeLangRef.current === 'hi-IN' ? 'en-US' : 'hi-IN';
    activeLangRef.current = nextLang;
    setActiveLang(nextLang);
    const msg = nextLang === 'hi-IN' ? 'हिन्दी भाषा सक्रिय।' : 'English language activated.';
    speak(msg);
  }, [speak]);

  const unlockMic = useCallback(async () => {
    recognitionBlockedRef.current = false;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (err) {
      console.warn('Microphone permission request error:', err);
    }
    startContinuousRecognition();
  }, [startContinuousRecognition]);

  // Direct "Listen to User" trigger
  const triggerListenNow = useCallback(() => {
    recognitionBlockedRef.current = false;
    isListeningPromptRef.current = true;
    if (activeWindowTimerRef.current) clearTimeout(activeWindowTimerRef.current);
    activeWindowTimerRef.current = setTimeout(() => {
      isListeningPromptRef.current = false;
    }, 10000);
    startContinuousRecognition();
  }, [startContinuousRecognition]);

  useEffect(() => {
    startContinuousRecognition();
    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (wakeDebounceTimerRef.current) clearTimeout(wakeDebounceTimerRef.current);
      if (activeWindowTimerRef.current) clearTimeout(activeWindowTimerRef.current);
      stopSpeaking();
      try {
        recognitionRef.current?.abort();
      } catch {}
      isRecognitionActiveRef.current = false;
    };
  }, [startContinuousRecognition, stopSpeaking]);

  return {
    isSpeaking,
    isListening,
    micNotice,
    activeLang,
    speak,
    stopSpeaking,
    toggleLanguage,
    unlockMic,
    triggerListenNow,
  };
}
