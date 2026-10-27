"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, StopCircle, Play, Pause, Trash2, Loader2 } from "lucide-react";
import { formatTime } from "@/lib/utils";

export interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  disabled?: boolean;
  maxDuration?: number; // in seconds
}

export function AudioRecorder({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
  maxDuration = 120,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setIsLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        setDuration(recordingTime);
        onRecordingStop?.();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      onRecordingStart?.();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);

      setIsLoading(false);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setIsLoading(false);
      alert("Could not access microphone. Please check your permissions.");
    }
  }, [onRecordingStart, onRecordingStop, maxDuration, recordingTime]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      const tracks = mediaRecorderRef.current.stream.getTracks();
      tracks.forEach((track) => track.stop());
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleRecordingComplete = useCallback(() => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration);
    }
  }, [audioBlob, duration, onRecordingComplete]);

  const playRecording = useCallback(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
      setPlaybackTime(0);

      playbackTimerRef.current = setInterval(() => {
        setPlaybackTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= duration) {
            setIsPlaying(false);
            if (playbackTimerRef.current) {
              clearInterval(playbackTimerRef.current);
              playbackTimerRef.current = null;
            }
            return duration;
          }
          return newTime;
        });
      }, 1000);
    }
  }, [audioUrl, duration]);

  const pauseRecording = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }
  }, []);

  const deleteRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
      setDuration(0);
      setRecordingTime(0);
      setPlaybackTime(0);
    }
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Audio Recorder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Status */}
        <div className="flex items-center justify-center gap-4">
          {isRecording ? (
            <>
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center animate-pulse-recording">
                  <Mic className="h-8 w-8 text-danger" />
                </div>
                <div className="absolute -inset-2 rounded-full border-2 border-danger animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Recording...</p>
                <p className="text-2xl font-bold text-danger">{formatTime(recordingTime)}</p>
              </div>
            </>
          ) : audioUrl ? (
            <>
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                  {isPlaying ? (
                    <Pause className="h-8 w-8 text-success" />
                  ) : (
                    <Play className="h-8 w-8 text-success" />
                  )}
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Ready to play</p>
                <p className="text-2xl font-bold">{formatTime(duration)}</p>
              </div>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Mic className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Click to start recording</p>
                <p className="text-2xl font-bold text-muted-foreground">00:00</p>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {isRecording ? (
            <Button
              variant="destructive"
              size="lg"
              onClick={stopRecording}
              className="h-12 w-12 rounded-full"
            >
              <StopCircle className="h-6 w-6" />
            </Button>
          ) : audioUrl ? (
            <>
              {!isPlaying ? (
                <Button
                  variant="success"
                  size="lg"
                  onClick={playRecording}
                  className="h-12 w-12 rounded-full"
                >
                  <Play className="h-6 w-6" />
                </Button>
              ) : (
                <Button
                  variant="success"
                  size="lg"
                  onClick={pauseRecording}
                  className="h-12 w-12 rounded-full"
                >
                  <Pause className="h-6 w-6" />
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={deleteRecording}
                className="h-12 w-12 rounded-full"
              >
                <Trash2 className="h-6 w-6" />
              </Button>
              <Button
                variant="brand"
                size="lg"
                onClick={handleRecordingComplete}
                className="h-12 w-12 rounded-full"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle className="h-6 w-6" />}
              </Button>
            </>
          ) : (
            <Button
              variant="brand"
              size="lg"
              onClick={startRecording}
              className="h-12 w-12 rounded-full"
              disabled={disabled || isLoading}
            >
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Mic className="h-6 w-6" />}
            </Button>
          )}
        </div>

        {/* Progress */}
        {isRecording && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>00:00</span>
              <span>{formatTime(maxDuration)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-danger transition-all duration-100"
                style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
              />
            </div>
            <Badge variant="warning" className="w-full text-center py-1">
              Max duration: {formatTime(maxDuration)}
            </Badge>
          </div>
        )}

        {/* Playback Progress */}
        {audioUrl && isPlaying && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(playbackTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-success transition-all duration-100"
                style={{ width: `${(playbackTime / duration) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Hidden audio element for playback */}
        <audio
          ref={audioRef}
          src={audioUrl || ""}
          onEnded={handleAudioEnded}
          hidden
        />
      </CardContent>
    </Card>
  );
}
