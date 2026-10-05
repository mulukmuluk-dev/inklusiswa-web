"use client";
import { useState, useEffect } from 'react';

export function useFPSMonitor(threshold = 30) {
  const [fps, setFps] = useState(60);
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      const timeDiff = currentTime - lastTime;

      // Update FPS setiap 1 detik
      if (timeDiff >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / timeDiff);
        setFps(currentFps);
        
        if (currentFps < threshold) {
          setIsLowPerformance(true);
        } else if (currentFps > threshold + 10) {
          // Berikan jeda (hysteresis) agar tidak berkedip jika nilai FPS di perbatasan
          setIsLowPerformance(false);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(animationFrameId);
  }, [threshold]);

  return { fps, isLowPerformance };
}
