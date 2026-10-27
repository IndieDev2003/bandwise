"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface MediaRecorderHook {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
}

export interface UseMediaRecorderProps {
  mimeType?: string;
  maxDuration?: number; // in seconds
  onRecordingStart?: () => void;
  onRecordingStop?: (blob: Blob, duration: number) => void;
  onRecordingError?: (error: Error) => void;
}

export function useMediaRecorder({
  mimeType = "audio/wav",
  maxDuration,
  onRecordingStart,
  onRecordingStop,
  onRecordingError,
}: UseMediaRecorderProps): MediaRecorderHook {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (mediaRecorderRef.current) {
        const tracks = mediaRecorderRef.current.stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [audioUrl]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);
        setIsPaused(false);
        
        onRecordingStop?.(audioBlob, recordingTime);
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        onRecordingError?.(event.error);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      onRecordingStart?.();

      // Start timer
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const elapsed = (Date.now() - (startTimeRef.current || 0)) / 1000;
          
          if (maxDuration && elapsed >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          
          return Math.floor(elapsed);
        });
      }, 1000);

    } catch (error) {
      console.error("Error starting recording:", error);
      onRecordingError?.(error as Error);
    }
  }, [mimeType, maxDuration, onRecordingStart, onRecordingStop, onRecordingError, recordingTime]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      const tracks = mediaRecorderRef.current.stream.getTracks();
      tracks.forEach((track) => track.stop());
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      startTimeRef.current = null;
    }
  }, [isRecording]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      startTimeRef.current = Date.now() - (recordingTime * 1000);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const elapsed = (Date.now() - (startTimeRef.current || 0)) / 1000;
          
          if (maxDuration && elapsed >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          
          return Math.floor(elapsed);
        });
      }, 1000);
    }
  }, [isRecording, isPaused, recordingTime, maxDuration, stopRecording]);

  // Clear recording
  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  }, [audioUrl]);

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
  };
}
