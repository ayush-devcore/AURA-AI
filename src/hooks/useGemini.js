import { useState, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * useGemini Hook — Engine B (Cloud / On-Demand)
 * - Calls the server-side Gemini model only on explicit action
 * - Uses compressed 640x480 JPEG 0.6 payload (~40KB) for ultra-low latency (<350ms network turnaround)
 * - Handles currency verification & scene safety analysis for visually impaired users
 */
export function useGemini() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState('');
  const [analysisError, setAnalysisError] = useState(null);

  // Stored custom API key fallback
  const [customApiKey, setCustomApiKeyState] = useState(() => {
    try {
      return (
        localStorage.getItem('AURA_GEMINI_KEY') ||
        import.meta.env.VITE_GEMINI_API_KEY ||
        (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GEMINI_API_KEY) ||
        ''
      );
    } catch {
      return '';
    }
  });

  const abortControllerRef = useRef(null);

  const setCustomApiKey = useCallback((key) => {
    const trimmed = (key || '').trim();
    setCustomApiKeyState(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem('AURA_GEMINI_KEY', trimmed);
      } else {
        localStorage.removeItem('AURA_GEMINI_KEY');
      }
    } catch {}
  }, []);

  /**
   * Main Analysis Function
   * @param {Object} snapshot - { blob, base64 } from useCamera
   * @param {Object} options - { mode: 'describe'|'currency'|'read', question: string, language: string }
   */
  const analyzeFrame = useCallback(
    async (snapshot, options = {}) => {
      const { mode = 'describe', question = '', language = 'en-US' } = options;

      if (!snapshot?.blob && !snapshot?.base64) {
        throw new Error('No frame captured for analysis.');
      }

      setIsAnalyzing(true);
      setAnalysisError(null);

      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const formData = new FormData();
        if (snapshot.blob) {
          formData.append('image', snapshot.blob, 'snapshot.jpg');
        } else {
          formData.append('base64', snapshot.base64);
        }
        formData.append('mode', mode);
        formData.append('language', language);
        if (question) formData.append('question', question);

        const headers = {};
        if (customApiKey) {
          headers['x-gemini-api-key'] = customApiKey;
        }

        // Send to /api/analyze (proxied to port 3000 in dev)
        const response = await fetch(`${API_BASE}/api/analyze`, {
          method: 'POST',
          headers,
          body: formData,
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || `Server responded with error status ${response.status}`);
        }

        const answer =
          data.answer ||
          (language.startsWith('hi')
            ? 'क्षमा करें, मुझे कुछ स्पष्ट दिखाई नहीं दिया।'
            : 'I could not see anything clearly in front of you.');

        setLastResult(answer);
        return answer;
      } catch (err) {
        if (err.name === 'AbortError') {
          return null;
        }
        console.error('Gemini analysis failed:', err);
        const errMsg =
          err.message ||
          (language.startsWith('hi')
            ? 'विश्लेषण में त्रुटि हुई। कृपया पुनः प्रयास करें।'
            : 'Could not complete visual analysis.');
        setAnalysisError(errMsg);
        throw err;
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          setIsAnalyzing(false);
        }
      }
    },
    [customApiKey]
  );

  const abortAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
  }, []);

  return {
    analyzeFrame,
    abortAnalysis,
    isAnalyzing,
    lastResult,
    analysisError,
    customApiKey,
    setCustomApiKey,
  };
}
