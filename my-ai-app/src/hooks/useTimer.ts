/**
 * Reusable timer hook for intervention components
 * This pattern will translate directly to SwiftUI Timer management
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseTimerOptions {
  initialSeconds?: number;
  onComplete?: () => void;
  interval?: number; // milliseconds (default: 1000)
}

export function useTimer(options: UseTimerOptions = {}) {
  const { initialSeconds = 0, onComplete, interval = 1000 } = options;
  
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const start = useCallback((duration: number) => {
    setTimeRemaining(duration);
    setIsRunning(true);
    setIsPaused(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, interval);
    
    timerRef.current = timer;
  }, [interval]);

  const pause = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPaused(true);
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (timeRemaining > 0 && !isRunning) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsRunning(false);
            onCompleteRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, interval);
      
      timerRef.current = timer;
      setIsPaused(false);
      setIsRunning(true);
    }
  }, [timeRemaining, isRunning, interval]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(0);
  }, []);

  const reset = useCallback((duration: number) => {
    stop();
    setTimeRemaining(duration);
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    timeRemaining,
    isPaused,
    isRunning,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}

/**
 * Format seconds as MM:SS
 * This will translate directly to Swift String formatting
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

