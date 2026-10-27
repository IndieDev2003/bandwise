"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, Type, AlertCircle } from "lucide-react";
import { formatTime } from "@/lib/utils";

export interface WritingEditorProps {
  task: {
    id: string;
    task_type: 'task1' | 'task2';
    prompt: string;
    instructions: string;
    min_words: number;
    max_words: number;
    suggested_time: number;
  };
  value: string;
  onChange: (value: string) => void;
  timeRemaining: number;
  onTimeUp?: () => void;
}

export function WritingEditor({
  task,
  value,
  onChange,
  timeRemaining,
  onTimeUp,
}: WritingEditorProps) {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Calculate word count
  useEffect(() => {
    const words = value.trim() === '' ? 0 : value.trim().split(/\s+/).length;
    setWordCount(words);
    setCharCount(value.length);
  }, [value]);

  // Check if word count is within limits
  const isWithinMin = wordCount >= task.min_words;
  const isWithinMax = wordCount <= task.max_words;
  const isOverMax = wordCount > task.max_words;

  // Progress calculation
  const minProgress = Math.min((wordCount / task.min_words) * 100, 100);
  const maxProgress = Math.min((wordCount / task.max_words) * 100, 100);

  // Time up effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      onTimeUp?.();
    }
  }, [timeRemaining, onTimeUp]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">
              Task {task.task_type === 'task1' ? '1' : '2'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {task.task_type === 'task1' ? 'Academic/General' : 'Essay'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-warning">
              {formatTime(timeRemaining)}
            </div>
            <div className="text-xs text-muted-foreground">
              {task.suggested_time} min suggested
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium mb-2">Prompt:</h3>
          <p className="text-sm whitespace-pre-wrap">{task.prompt}</p>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-brand/5 border brand/10 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Instructions:
          </h3>
          <p className="text-sm whitespace-pre-wrap">{task.instructions}</p>
        </div>

        {/* Editor */}
        <div className="space-y-2">
          <Label htmlFor={`editor-${task.id}`} className="font-medium">
            Your Response
          </Label>
          <Textarea
            id={`editor-${task.id}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Write your ${task.task_type === 'task1' ? 'report/letter' : 'essay'} here...`}
            className="min-h-[300px] resize-none"
          />
        </div>

        {/* Word Count Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span className="text-sm font-medium">Word Count</span>
            </div>
            <span className={`text-sm font-medium ${isOverMax ? 'text-danger' : isWithinMin ? 'text-success' : 'text-warning'}`}>
              {wordCount} / {task.min_words}-{task.max_words} words
            </span>
          </div>
          
          <Progress value={isWithinMin ? maxProgress : minProgress} max={100} />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Minimum: {task.min_words} words</span>
            <span>Maximum: {task.max_words} words</span>
          </div>

          {!isWithinMin && !isOverMax && (
            <div className="p-3 bg-warning/10 text-warning rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              You need at least {task.min_words - wordCount} more words to meet the minimum requirement.
            </div>
          )}

          {isOverMax && (
            <div className="p-3 bg-danger/10 text-danger rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Your response exceeds the maximum word limit by {wordCount - task.max_words} words.
            </div>
          )}

          {isWithinMin && isWithinMax && (
            <div className="p-3 bg-success/10 text-success rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Your word count is within the recommended range.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
