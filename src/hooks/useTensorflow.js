import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Complete MS-COCO 80-Class dictionary with natural bilingual voice warnings
 * Supports Humans, Vehicles, Traffic Hazards, Animals, Everyday Objects & Furniture
 */
export const OBSTACLE_VOCAB = {
  // Humans & Moving Hazards
  person: { en: 'person', hi: 'इंसान', type: 'human' },
  bicycle: { en: 'bicycle', hi: 'साइकिल', type: 'vehicle' },
  car: { en: 'car', hi: 'गाड़ी', type: 'vehicle' },
  motorcycle: { en: 'motorcycle', hi: 'मोटरसाइकिल', type: 'vehicle' },
  airplane: { en: 'airplane', hi: 'हवाई जहाज़', type: 'vehicle' },
  bus: { en: 'bus', hi: 'बस', type: 'vehicle' },
  train: { en: 'train', hi: 'ट्रेन', type: 'vehicle' },
  truck: { en: 'truck', hi: 'ट्रक', type: 'vehicle' },
  boat: { en: 'boat', hi: 'नाव', type: 'vehicle' },

  // Street & Outdoor Hazards
  'traffic light': { en: 'traffic light', hi: 'ट्रैफ़िक लाइट', type: 'hazard' },
  'fire hydrant': { en: 'fire hydrant', hi: 'फ़ायर हाइड्रेंट', type: 'hazard' },
  'stop sign': { en: 'stop sign', hi: 'स्टॉप साइन', type: 'hazard' },
  'parking meter': { en: 'parking meter', hi: 'पार्किंग मीटर', type: 'hazard' },
  bench: { en: 'bench', hi: 'बेंच', type: 'furniture' },

  // Animals
  bird: { en: 'bird', hi: 'पक्षी', type: 'animal' },
  cat: { en: 'cat', hi: 'बिल्ली', type: 'animal' },
  dog: { en: 'dog', hi: 'कुत्ता', type: 'animal' },
  horse: { en: 'horse', hi: 'घोड़ा', type: 'animal' },
  sheep: { en: 'sheep', hi: 'भेड़', type: 'animal' },
  cow: { en: 'cow', hi: 'गाय', type: 'animal' },
  elephant: { en: 'elephant', hi: 'हाथी', type: 'animal' },
  bear: { en: 'bear', hi: 'भालू', type: 'animal' },
  zebra: { en: 'zebra', hi: 'ज़ेब्रा', type: 'animal' },
  giraffe: { en: 'giraffe', hi: 'जिराफ़', type: 'animal' },

  // Street / Personal Accessories
  backpack: { en: 'bag', hi: 'बैग', type: 'object' },
  umbrella: { en: 'umbrella', hi: 'छाता', type: 'object' },
  handbag: { en: 'purse', hi: 'पर्स', type: 'object' },
  tie: { en: 'tie', hi: 'टाई', type: 'object' },
  suitcase: { en: 'suitcase', hi: 'सूटकेस', type: 'object' },
  frisbee: { en: 'frisbee', hi: 'फ़्रिस्बी', type: 'object' },
  skis: { en: 'skis', hi: 'स्की', type: 'object' },
  snowboard: { en: 'snowboard', hi: 'स्नोबोर्ड', type: 'object' },
  'sports ball': { en: 'ball', hi: 'गेंद', type: 'object' },
  kite: { en: 'kite', hi: 'पतंग', type: 'object' },
  'baseball bat': { en: 'bat', hi: 'बैट', type: 'object' },
  'baseball glove': { en: 'glove', hi: 'दस्ताना', type: 'object' },
  skateboard: { en: 'skateboard', hi: 'स्केटबोर्ड', type: 'vehicle' },
  surfboard: { en: 'surfboard', hi: 'सर्फ़बोर्ड', type: 'object' },
  'tennis racket': { en: 'racket', hi: 'रैकेट', type: 'object' },

  // Kitchen & Everyday Objects
  bottle: { en: 'bottle', hi: 'बोतल', type: 'object' },
  'wine glass': { en: 'glass', hi: 'ग्लास', type: 'object' },
  cup: { en: 'cup', hi: 'कप', type: 'object' },
  fork: { en: 'fork', hi: 'काँटा', type: 'object' },
  knife: { en: 'knife', hi: 'चाकू', type: 'hazard' },
  spoon: { en: 'spoon', hi: 'चम्मच', type: 'object' },
  bowl: { en: 'bowl', hi: 'कटोरी', type: 'object' },
  banana: { en: 'banana', hi: 'केला', type: 'food' },
  apple: { en: 'apple', hi: 'सेब', type: 'food' },
  sandwich: { en: 'sandwich', hi: 'सैंडविच', type: 'food' },
  orange: { en: 'orange', hi: 'संतरा', type: 'food' },
  broccoli: { en: 'vegetable', hi: 'सब्ज़ी', type: 'food' },
  carrot: { en: 'carrot', hi: 'गाजर', type: 'food' },
  'hot dog': { en: 'food', hi: 'खाना', type: 'food' },
  pizza: { en: 'pizza', hi: 'पिज़्ज़ा', type: 'food' },
  donut: { en: 'donut', hi: 'डोनट', type: 'food' },
  cake: { en: 'cake', hi: 'केक', type: 'food' },

  // Furniture & Indoors
  chair: { en: 'chair', hi: 'कुर्सी', type: 'furniture' },
  couch: { en: 'sofa', hi: 'सोफ़ा', type: 'furniture' },
  'potted plant': { en: 'plant', hi: 'गमला', type: 'object' },
  bed: { en: 'bed', hi: 'पलंग', type: 'furniture' },
  'dining table': { en: 'table', hi: 'मेज़', type: 'furniture' },
  toilet: { en: 'toilet', hi: 'टॉयलेट', type: 'furniture' },
  door: { en: 'door', hi: 'दरवाज़ा', type: 'hazard' },
  stairs: { en: 'stairs', hi: 'सीढ़ियाँ', type: 'hazard' },

  // Electronics
  tv: { en: 'screen', hi: 'स्क्रीन', type: 'electronics' },
  laptop: { en: 'laptop', hi: 'लैपटॉप', type: 'electronics' },
  mouse: { en: 'mouse', hi: 'माउस', type: 'electronics' },
  remote: { en: 'remote', hi: 'रिमोट', type: 'electronics' },
  keyboard: { en: 'keyboard', hi: 'कीबोर्ड', type: 'electronics' },
  'cell phone': { en: 'phone', hi: 'फ़ोन', type: 'electronics' },

  // Appliances
  microwave: { en: 'microwave', hi: 'माइक्रोवेव', type: 'appliance' },
  oven: { en: 'oven', hi: 'ओवन', type: 'appliance' },
  toaster: { en: 'toaster', hi: 'टोस्टर', type: 'appliance' },
  sink: { en: 'sink', hi: 'सिंक', type: 'furniture' },
  refrigerator: { en: 'fridge', hi: 'फ़्रिज', type: 'appliance' },

  // Miscellanous
  book: { en: 'book', hi: 'किताब', type: 'object' },
  clock: { en: 'clock', hi: 'घड़ी', type: 'object' },
  vase: { en: 'vase', hi: 'फूलदान', type: 'object' },
  scissors: { en: 'scissors', hi: 'कैंची', type: 'hazard' },
  'teddy bear': { en: 'toy', hi: 'खिलौना', type: 'object' },
  'hair drier': { en: 'hair dryer', hi: 'हेयर ड्रायर', type: 'object' },
  toothbrush: { en: 'toothbrush', hi: 'टूथब्रश', type: 'object' },
  obstacle: { en: 'obstacle', hi: 'रुकावट', type: 'hazard' },
};

// COCO-SSD recognizes common objects, not every real-world hazard. Keep the
// alert path focused on objects a user could collide with or should notice.
const OBSTACLE_CLASSES = new Set([
  'person', 'bicycle', 'car', 'motorcycle', 'bus', 'train', 'truck',
  'bench', 'backpack', 'umbrella', 'handbag', 'suitcase', 'skateboard',
  'dog', 'cat', 'horse', 'cow', 'chair', 'couch', 'bed', 'dining table',
  'toilet', 'potted plant', 'bottle', 'knife', 'scissors',
]);

/**
 * Formats high-clarity natural spoken obstacle warning
 * Prioritizes pedestrians, cars, vehicles, and direct path hazards
 */
export function formatObstacleWarning(obstacle, isHindi) {
  if (!obstacle) return '';
  const vocab = OBSTACLE_VOCAB[obstacle.class] || { en: obstacle.class, hi: obstacle.class, type: 'object' };
  const name = isHindi ? vocab.hi : vocab.en;
  const isUrgent = obstacle.distanceLabel === 'urgent';
  const isHuman = obstacle.class === 'person';
  const isVehicle = ['car', 'bus', 'truck', 'motorcycle', 'bicycle'].includes(obstacle.class);

  if (isHindi) {
    let posStr = 'ठीक सामने';
    if (obstacle.position === 'left') posStr = 'बाईं तरफ';
    else if (obstacle.position === 'right') posStr = 'दाहिनी तरफ';

    if (isUrgent) {
      if (isVehicle) return `सावधान! ${posStr} ${name} है!`;
      if (isHuman) return `सावधान! ${posStr} इंसान है!`;
      return `सावधान! ${posStr} ${name} है!`;
    }
    if (isVehicle) return `आगे ${posStr} ${name} है।`;
    if (isHuman) return `आगे ${posStr} इंसान है।`;
    return `आगे ${posStr} ${name} है।`;
  }

  let posStr = 'directly ahead';
  if (obstacle.position === 'left') posStr = 'on your left';
  else if (obstacle.position === 'right') posStr = 'on your right';

  if (isUrgent) {
    if (isVehicle) return `Caution! ${name.charAt(0).toUpperCase() + name.slice(1)} ${posStr}!`;
    if (isHuman) return `Caution! Person ${posStr}!`;
    return `Caution! ${name.charAt(0).toUpperCase() + name.slice(1)} ${posStr}!`;
  }
  if (isVehicle) return `${name.charAt(0).toUpperCase() + name.slice(1)} detected ${posStr}.`;
  if (isHuman) return `Person ahead ${posStr}.`;
  return `${name.charAt(0).toUpperCase() + name.slice(1)} ahead ${posStr}.`;
}

/**
 * useTensorflow Hook — Engine A (Local / Zero Latency)
 * High-Sensitivity Real-Time Obstacle Detection + Sonar Proximity Beeps
 */
export function useTensorflow(videoRef, isCameraActive, options = {}) {
  const { onObstacleAlert, isSpeaking = false } = options;

  const modelRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const lastBeepTimeRef = useRef(0);
  const lastVibrateTimeRef = useRef(0);
  const isDetectingRef = useRef(false);
  const smoothedClosenessRef = useRef(0);
  const lastThreatRef = useRef(null);
  const lastThreatSeenAtRef = useRef(0);

  // Throttling state for spoken warnings
  const lastSpokenObstacleRef = useRef({
    class: '',
    distanceLabel: '',
    position: '',
    timestamp: 0,
  });

  const onObstacleAlertRef = useRef(onObstacleAlert);
  useEffect(() => {
    onObstacleAlertRef.current = onObstacleAlert;
  }, [onObstacleAlert]);

  const isSpeakingRef = useRef(isSpeaking);
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  // Alert mode is OFF by default. Only enabled when user says "Alert On"
  const [isDetectionActive, setIsDetectionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);

  const isMutedRef = useRef(isMuted);
  const isDetectionActiveRef = useRef(isDetectionActive);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isDetectionActiveRef.current = isDetectionActive;
  }, [isDetectionActive]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  /* ---- Audio Context with Robust Unlock and Resume ---- */
  const getAudioContext = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  /* ---- Direct Web Audio Tone Synthesizer ---- */
  const playDirectTone = useCallback((freqStart, freqEnd, duration = 0.14, volume = 0.28) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freqStart, now);
      if (freqEnd && freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);
      }

      gain.gain.setValueAtTime(volume, now);
      gain.gain.linearRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (err) {
      console.warn('[AURA Tone] error:', err);
    }
  }, [getAudioContext]);

  /* ---- Audible, Distance-Intensity Sonar Proximity Beep Generator ---- */
  const playProximityBeep = useCallback((frequency = 580, duration = 0.08, volume = 0.22) => {
    if (isMutedRef.current || isPausedRef.current || !isDetectionActiveRef.current) {
      return;
    }

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Duck volume if AI is currently speaking so voice remains clear, but NEVER mute beeps
      const effectiveVol = isSpeakingRef.current ? Math.min(volume * 0.40, 0.10) : volume;

      // Rich triangle wave harmonics audible on all phone and laptop speakers
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(effectiveVol, now);
      gain.gain.linearRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (err) {
      console.warn('[AURA Audio] Proximity beep error:', err);
    }
  }, [getAudioContext]);

  /* ---- Haptic Feedback ---- */
  const triggerHaptic = useCallback((pattern = [100, 50, 100]) => {
    if (isMutedRef.current || isPausedRef.current || isSpeakingRef.current || !isDetectionActiveRef.current) return;
    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }, []);

  /* ---- Load TensorFlow COCO-SSD ---- */
  useEffect(() => {
    let isMounted = true;

    async function initTensorflow() {
      try {
        setIsModelLoading(true);
        setModelError(null);

        // Keep the large detector out of the first page download. Load it when
        // the app starts its local vision engine.
        const [tf, cocoSsd] = await Promise.all([
          import('@tensorflow/tfjs'),
          import('@tensorflow-models/coco-ssd'),
        ]);

        try {
          await tf.setBackend('webgl').catch(async () => {
            console.warn('WebGL backend unavailable, using CPU.');
            await tf.setBackend('cpu');
          });
        } catch {
          await tf.setBackend('cpu').catch(() => {});
        }

        await tf.ready();
        console.log(`[AURA AI] TensorFlow.js backend: ${tf.getBackend()}`);

        // The full MobileNet V2 backbone improves recognition over the lite
        // model, at the cost of a larger download and slower inference.
        const model = await cocoSsd.load({ base: 'mobilenet_v2' });
        if (isMounted) {
          modelRef.current = model;
          setIsModelReady(true);
          setIsModelLoading(false);
          console.log('[AURA AI] COCO-SSD obstacle engine ready.');
        }
      } catch (err) {
        console.error('[AURA AI] TensorFlow init error:', err);
        if (isMounted) {
          setModelError('Could not initialize obstacle radar.');
          setIsModelLoading(false);
        }
      }
    }

    initTensorflow();

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  /* ---- Real-Time Detection Loop ---- */
  useEffect(() => {
    if (!isCameraActive || !isModelReady || !modelRef.current || !videoRef.current) {
      return;
    }

    let isRunning = true;
    let lastFrameTime = 0;
    // COCO-SSD inference is not guaranteed to finish at camera frame rate;
    // process the newest frame as soon as the previous inference completes.
    const targetInterval = 1000 / 30;

    async function detectFrame(timestamp) {
      if (!isRunning) return;

      // When alerts are off or paused, idle loop
      if (!isDetectionActiveRef.current || isPausedRef.current) {
        animFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      const video = videoRef.current;
      if (
        video &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        !isDetectingRef.current &&
        timestamp - lastFrameTime >= targetInterval
      ) {
        lastFrameTime = timestamp;
        isDetectingRef.current = true;

        try {
          // A slightly higher confidence threshold reduces false alarms. Keep
          // enough candidates so a busy frame does not hide a nearby object.
          const predictions = await modelRef.current.detect(video, 20, 0.25);
          const frameWidth = video.videoWidth || 640;
          const frameHeight = video.videoHeight || 480;
          const frameArea = frameWidth * frameHeight;

          let highestThreat = null;
          let maxThreatScore = 0;

          const obstacles = (predictions || []).filter(
            (prediction) => OBSTACLE_CLASSES.has(prediction.class)
          );
          if (obstacles.length > 0) {
            setDetectedCount(obstacles.length);

            for (const pred of obstacles) {
              const [x, y, w, h] = pred.bbox;
              const boxArea = w * h;
              const areaRatio = boxArea / frameArea;
              const heightRatio = h / frameHeight;
              const widthRatio = w / frameWidth;

              const boxCenterX = x + w / 2;
              const centerDistanceRatio = Math.abs(boxCenterX - frameWidth / 2) / (frameWidth / 2);

              let position = 'center';
              if (boxCenterX < frameWidth * 0.35) {
                position = 'left';
              } else if (boxCenterX > frameWidth * 0.65) {
                position = 'right';
              }

              const isPerson = pred.class === 'person';
              const isVehicle = ['car', 'bus', 'truck', 'motorcycle', 'bicycle'].includes(pred.class);
              const isAnimal = ['dog', 'cat', 'horse', 'cow'].includes(pred.class);

              // Aspect-ratio and geometry-aware distance classification
              let distanceLabel = 'far';
              if (isVehicle) {
                if (areaRatio > 0.08 || widthRatio > 0.38) distanceLabel = 'urgent';
                else if (areaRatio > 0.02 || widthRatio > 0.18) distanceLabel = 'close';
                else if (areaRatio > 0.003 || widthRatio > 0.08) distanceLabel = 'medium';
              } else if (isPerson) {
                if (areaRatio > 0.07 || heightRatio > 0.42) distanceLabel = 'urgent';
                else if (areaRatio > 0.018 || heightRatio > 0.22) distanceLabel = 'close';
                else if (areaRatio > 0.003 || heightRatio > 0.10) distanceLabel = 'medium';
              } else {
                if (areaRatio > 0.12) distanceLabel = 'urgent';
                else if (areaRatio > 0.025) distanceLabel = 'close';
                else if (areaRatio > 0.004) distanceLabel = 'medium';
              }

              // Threat prioritization: vehicles and pedestrians receive significant weight multipliers
              let typeMultiplier = 1.0;
              if (isVehicle) typeMultiplier = 2.5;
              else if (isPerson) typeMultiplier = 2.0;
              else if (isAnimal) typeMultiplier = 1.6;

              const positionMultiplier = 1.4 - centerDistanceRatio * 0.6;
              const sizeMetric = isPerson
                ? Math.max(areaRatio, heightRatio * 0.25)
                : isVehicle
                ? Math.max(areaRatio, widthRatio * 0.25)
                : areaRatio;

              const threatScore = sizeMetric * positionMultiplier * typeMultiplier;

              const obstacle = {
                class: pred.class,
                score: Math.round(pred.score * 100),
                areaRatio,
                heightRatio,
                widthRatio,
                position,
                distanceLabel,
                isPerson,
                isVehicle,
              };

              if (threatScore > maxThreatScore) {
                maxThreatScore = threatScore;
                highestThreat = obstacle;
              }
            }
          } else {
            setDetectedCount(0);
          }

          const now = Date.now();
          // Hold a just-seen object briefly when one inference frame misses it.
          // This prevents the sonar from cutting in and out on borderline boxes.
          let beepThreat = highestThreat;
          if (highestThreat) {
            lastThreatRef.current = highestThreat;
            lastThreatSeenAtRef.current = now;
          } else if (lastThreatRef.current && now - lastThreatSeenAtRef.current < 260) {
            beepThreat = lastThreatRef.current;
          } else {
            lastThreatRef.current = null;
            smoothedClosenessRef.current = 0;
          }

          // 1. Dynamic Sonar Proximity Beeps according to distance of closer object
          // Runs continuously whenever detection is active — no delay!
          if (beepThreat && !isMutedRef.current && !isPausedRef.current && isDetectionActiveRef.current) {
            let rawCloseness = (beepThreat.areaRatio - 0.004) / 0.16;
            if (beepThreat.isPerson) {
              rawCloseness = Math.max(rawCloseness, (beepThreat.heightRatio - 0.18) / 0.45);
            } else if (beepThreat.isVehicle) {
              rawCloseness = Math.max(rawCloseness, (beepThreat.widthRatio - 0.18) / 0.45);
            }
            const targetCloseness = Math.min(1, Math.max(0, rawCloseness));
            // Rise quickly for safety; ease down more gradually so small box
            // fluctuations do not make the beep intensity pulse erratically.
            const smoothing = targetCloseness > smoothedClosenessRef.current ? 0.72 : 0.32;
            smoothedClosenessRef.current +=
              (targetCloseness - smoothedClosenessRef.current) * smoothing;
            const closeness = smoothedClosenessRef.current;

            // Perceived loudness rises with apparent object size. Keep a safe
            // ceiling; device/browser volume controls the actual output level.
            const beepVolume = 0.07 + closeness * 0.48;

            // Slow distant pings accelerate sharply for a large, near object.
            const beepIntervalMs = Math.round(1100 - closeness * 930);

            // Pitch (Frequency): Scales from 380Hz (deep calm pulse) up to 1060Hz (sharp piercing alarm)
            const beepFrequency = Math.round(380 + closeness * 680);

            // Duration: Far pulses are slightly smoother (85ms); close pings are crisp & punchy (48ms)
            const beepDuration = Math.max(0.045, 0.085 - closeness * 0.037);

            if (now - lastBeepTimeRef.current >= beepIntervalMs) {
              lastBeepTimeRef.current = now;
              playProximityBeep(beepFrequency, beepDuration, beepVolume);
            }

            // Haptic buzz for dangerously close obstacles
            if (closeness > 0.55 && now - lastVibrateTimeRef.current > 600) {
              lastVibrateTimeRef.current = now;
              triggerHaptic([140, 50, 140]);
            }
          }

          // 2. Intelligent Spoken Obstacle Alert: Announces object every 5-10 sec to prevent accidents
          if (
            highestThreat &&
            !isSpeakingRef.current &&
            isDetectionActiveRef.current
          ) {
            const { class: obsClass, distanceLabel, position } = highestThreat;
            const timeSinceLast = now - lastSpokenObstacleRef.current.timestamp;
            const isSameObstacle =
              lastSpokenObstacleRef.current.class === obsClass &&
              lastSpokenObstacleRef.current.position === position;

            let shouldSpeak = false;

            // Immediate announcement if a NEW obstacle appears or changes position
            if (!isSameObstacle) {
              if (now - lastSpokenObstacleRef.current.timestamp >= 2500) {
                shouldSpeak = true;
              }
            } else if (distanceLabel === 'urgent') {
              // Critical hazard: repeats every 5 seconds
              if (timeSinceLast >= 5000) {
                shouldSpeak = true;
              }
            } else if (distanceLabel === 'close') {
              // Approaching obstacle: repeats every 6.5 seconds
              if (timeSinceLast >= 6500) {
                shouldSpeak = true;
              }
            } else {
              // Medium or visible obstacle ahead: repeats every 8.5 seconds
              if (timeSinceLast >= 8500) {
                shouldSpeak = true;
              }
            }

            if (shouldSpeak) {
              const didSpeak = onObstacleAlertRef.current?.(highestThreat);
              if (didSpeak) {
                lastSpokenObstacleRef.current = { class: obsClass, distanceLabel, position, timestamp: now };
              }
            }
          }
        } catch (detectErr) {
          console.warn('[AURA AI Detection]', detectErr.message);
        } finally {
          isDetectingRef.current = false;
        }
      }

      animFrameRef.current = requestAnimationFrame(detectFrame);
    }

    animFrameRef.current = requestAnimationFrame(detectFrame);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isCameraActive, isModelReady, videoRef, playProximityBeep, triggerHaptic]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (!next) {
        playProximityBeep(650, 0.08);
      }
      return next;
    });
  }, [playProximityBeep]);

  /* Start detection immediately with instant audio confirmation */
  const startDetection = useCallback(() => {
    setIsDetectionActive(true);
    isDetectionActiveRef.current = true;
    lastSpokenObstacleRef.current.timestamp = Date.now(); // Grace period so initial beeps are heard immediately
    playDirectTone(520, 880, 0.14, 0.30);
  }, [playDirectTone]);

  const stopDetection = useCallback(() => {
    setIsDetectionActive(false);
    isDetectionActiveRef.current = false;
    playDirectTone(580, 320, 0.14, 0.30);
  }, [playDirectTone]);

  return {
    isModelLoading,
    isModelReady,
    modelError,
    isMuted,
    setIsMuted,
    toggleMute,
    isDetectionActive,
    detectedCount,
    startDetection,
    stopDetection,
    isPaused,
    setIsPaused,
    playTone: playProximityBeep,
    triggerHaptic,
    unlockAudio: getAudioContext,
  };
}
