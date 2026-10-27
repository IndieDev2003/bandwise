"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface TimerHook {
  timeRemaining: number;
  isRunning: boolean;
  isComplete: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (newInitialTime?: number) => void;
  restart: () => void;
}

export interface UseTimerProps {
  initialTime: number; // in seconds
  onComplete?: () => void;
  onTimeUpdate?: (time: number) => void;
  autoStart?: boolean;
}

export function useTimer({
  initialTime,
  onComplete,
  onTimeUpdate,
  autoStart = true,
}: UseTimerProps): TimerHook {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        onTimeUpdate?.(newTime);
        
        if (newTime <= 0) {
          setIsRunning(false);
          setIsComplete(true);
          onComplete?.();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeRemaining, onComplete, onTimeUpdate]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsComplete(false);
    startTimeRef.current = Date.now();
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const reset = useCallback((newInitialTime?: number) => {
    setTimeRemaining(newInitialTime !== undefined ? newInitialTime : initialTime);
    setIsRunning(false);
    setIsComplete(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    startTimeRef.current = null;
  }, [initialTime]);

  const restart = useCallback(() => {
    reset();
    start();
  }, [reset, start]);

  return {
    timeRemaining,
    isRunning,
    isComplete,
    start,
    pause,
    resume,
    reset,
    restart,
  };
}
