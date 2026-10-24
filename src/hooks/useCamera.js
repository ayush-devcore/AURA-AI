import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * useCamera Hook
 * Dual-Engine Camera Pipeline
 * - Maintains active rear-camera stream for Engine A (real-time 30 FPS COCO-SSD)
 * - Offscreen downscaling canvas (640x480, JPEG 0.6, <50KB) for Engine B (Gemini Cloud)
 */
export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const err = 'Camera API is not supported on this device/browser.';
      setCameraError(err);
      return false;
    }

    try {
      setCameraError(null);
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      // Try environment (rear) camera first with 640x480 ideal resolution
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch (rearErr) {
        // Fallback to any available video stream (e.g. desktop webcam)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }

      setIsCameraActive(true);
      return true;
    } catch (err) {
      console.error('Camera initialization failed:', err);
      let errorMsg = 'Could not access camera. Please allow camera permissions.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera hardware found on this device.';
      }
      setCameraError(errorMsg);
      setIsCameraActive(false);
      return false;
    }
  }, []);

  /**
   * Captures an offscreen frame downscaled to 640x480 with JPEG 0.6 quality.
   * Keeps payload size under 50KB for fast API turnaround.
   */
  const captureSnapshot = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      throw new Error('Camera is not ready. Please wait a moment.');
    }

    const targetWidth = 640;
    const targetHeight = 480;

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = targetWidth;
    offscreenCanvas.height = targetHeight;
    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not prepare a camera snapshot.');

    // Maintain aspect ratio or center-crop
    const videoWidth = video.videoWidth || targetWidth;
    const videoHeight = video.videoHeight || targetHeight;
    const sourceRatio = videoWidth / videoHeight;
    const targetRatio = targetWidth / targetHeight;
    let sx = 0;
    let sy = 0;
    let sourceWidth = videoWidth;
    let sourceHeight = videoHeight;
    if (sourceRatio > targetRatio) {
      sourceWidth = videoHeight * targetRatio;
      sx = (videoWidth - sourceWidth) / 2;
    } else {
      sourceHeight = videoWidth / targetRatio;
      sy = (videoHeight - sourceHeight) / 2;
    }
    ctx.drawImage(video, sx, sy, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

    // Generate JPEG with quality 0.6
    const blob = await new Promise((resolve) => {
      offscreenCanvas.toBlob(resolve, 'image/jpeg', 0.6);
    });

    if (!blob) {
      throw new Error('Failed to capture frame from camera.');
    }

    // The API accepts the JPEG blob directly. Avoid a second full encode and
    // base64 allocation on the main thread for every scan.
    return { blob, sizeBytes: blob.size };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isCameraActive,
    cameraError,
    startCamera,
    stopCamera,
    captureSnapshot,
  };
}
