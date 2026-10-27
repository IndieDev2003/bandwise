"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pause, Play, Clock } from "lucide-react";
import { formatTime } from "@/lib/utils";

export interface ReadingTimerProps {
  initialTime: number; // in seconds
  onTimeUp?: () => void;
  onTimeUpdate?: (timeRemaining: number) => void;
}

export function ReadingTimer({ initialTime, onTimeUp, onTimeUpdate }: ReadingTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  const totalTime = initialTime;

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            onTimeUp?.();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [isRunning, timeRemaining, onTimeUp]);

  useEffect(() => {
    if (!hasStarted && timeRemaining < initialTime) {
      setHasStarted(true);
    }
  }, [timeRemaining, initialTime, hasStarted]);

  useEffect(() => {
    onTimeUpdate?.(timeRemaining);
  }, [timeRemaining, onTimeUpdate]);

  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setTimeRemaining(initialTime);
    setIsRunning(true);
  }, [initialTime]);

  const progress = (timeRemaining / totalTime) * 100;

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="text-2xl font-bold">{formatTime(timeRemaining)}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTimer}
                disabled={timeRemaining <= 0}
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetTimer}
                disabled={timeRemaining === initialTime}
              >
                Reset
              </Button>
            </div>
          </div>
          <Progress value={timeRemaining} max={totalTime} />
          <p className="text-xs text-muted-foreground text-center">
            {Math.floor(progress)}% remaining
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
