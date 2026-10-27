"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Clock, Volume2 } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { ListeningQuestion as ListeningQuestionType } from "@/types";

export interface ListeningQuestionProps {
  question: ListeningQuestionType;
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  isSubmitted?: boolean;
  currentAudioTime?: number;
  questionTimestamp?: number;
  isPlaying?: boolean;
}

export function ListeningQuestion({
  question,
  value,
  onChange,
  isSubmitted = false,
  currentAudioTime,
  questionTimestamp,
  isPlaying,
}: ListeningQuestionProps) {
  const [selectedValue, setSelectedValue] = useState<string | string[] | undefined>(value);

  React.useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const handleChange = (newValue: string | string[]) => {
    setSelectedValue(newValue);
    onChange(newValue);
  };

  const isCorrect = React.useMemo(() => {
    if (!isSubmitted || !selectedValue) return null;
    
    if (Array.isArray(question.correct_answer)) {
      if (Array.isArray(selectedValue)) {
        return JSON.stringify(selectedValue.sort()) === JSON.stringify(question.correct_answer.sort());
      }
      return false;
    }
    
    return selectedValue === question.correct_answer;
  }, [isSubmitted, selectedValue, question.correct_answer]);

  // Check if this question should be highlighted based on audio timestamp
  const isActive = React.useMemo(() => {
    if (questionTimestamp === undefined || currentAudioTime === undefined) return false;
    return Math.abs(currentAudioTime - questionTimestamp) < 2; // 2 second window
  }, [questionTimestamp, currentAudioTime]);

  const renderQuestionContent = () => {
    switch (question.type) {
      case "mcq":
        return (
          <RadioGroup
            value={Array.isArray(selectedValue) ? "" : (selectedValue || "")}
            onValueChange={(val) => handleChange(val)}
            disabled={isSubmitted}
          >
            {question.options?.map((option, index) => {
              const isSelected = !Array.isArray(selectedValue) && selectedValue === option;
              const isCorrectOption = option === question.correct_answer;
              const showFeedback = isSubmitted && (isSelected || isCorrectOption);
              
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center space-x-2 p-3 rounded-md border transition-all",
                    showFeedback && isCorrectOption && "bg-green-50 border-green-200",
                    showFeedback && !isCorrectOption && isSelected && "bg-red-50 border-red-200",
                    isActive && !isSubmitted && "bg-brand/5 border-brand/20"
                  )}
                >
                  <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                  {showFeedback && isCorrectOption && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  {showFeedback && !isCorrectOption && isSelected && (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                </div>
              );
            })}
          </RadioGroup>
        );

      case "form-completion":
      case "table-completion":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {question.type === "form-completion" ? "Complete the form" : "Complete the table"}
            </p>
            <Input
              value={Array.isArray(selectedValue) ? selectedValue.join(", ") : (selectedValue || "")}
              onChange={(e) => handleChange(e.target.value)}
              disabled={isSubmitted}
              placeholder="Enter your answer"
              className={cn(
                isActive && !isSubmitted && "border-brand bg-brand/5"
              )}
            />
            {isSubmitted && selectedValue && (
              <div className={cn(
                "p-3 rounded-md text-sm",
                isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              )}>
                {isCorrect ? (
                  <Check className="h-4 w-4 inline mr-2" />
                ) : (
                  <X className="h-4 w-4 inline mr-2" />
                )}
                {isCorrect ? "Correct!" : `Correct answer: ${question.correct_answer}`}
              </div>
            )}
          </div>
        );

      case "matching":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Match the items
            </p>
            {question.options?.map((option, index) => {
              const isSelected = Array.isArray(selectedValue) && selectedValue.includes(option);
              const isCorrectOption = Array.isArray(question.correct_answer) && question.correct_answer.includes(option);
              const showFeedback = isSubmitted && (isSelected || isCorrectOption);
              
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center space-x-2 p-3 rounded-md border cursor-pointer transition-all",
                    showFeedback && isCorrectOption && "bg-green-50 border-green-200",
                    showFeedback && !isCorrectOption && isSelected && "bg-red-50 border-red-200",
                    !isSubmitted && "hover:bg-muted",
                    isActive && !isSubmitted && "bg-brand/5 border-brand/20"
                  )}
                  onClick={() => {
                    if (!isSubmitted) {
                      const newValue = Array.isArray(selectedValue) ? selectedValue : [];
                      if (newValue.includes(option)) {
                        handleChange(newValue.filter((v) => v !== option));
                      } else {
                        handleChange([...newValue, option]);
                      }
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="h-4 w-4 rounded-sm border-primary text-primary focus:ring-primary"
                    disabled={isSubmitted}
                  />
                  <Label className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                  {showFeedback && isCorrectOption && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  {showFeedback && !isCorrectOption && isSelected && (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                </div>
              );
            })}
          </div>
        );

      default:
        return (
          <div className="p-4 bg-muted/50 rounded-md">
            Question type: {question.type}
          </div>
        );
    }
  };

  return (
    <Card className={cn(
      "h-full",
      isActive && !isSubmitted && "border-brand shadow-brand/25"
    )}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Question {question.id}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{question.marks} marks</p>
          </div>
          {questionTimestamp !== undefined && currentAudioTime !== undefined && (
            <div className="flex items-center gap-2">
              {isPlaying && isActive && (
                <Volume2 className="h-4 w-4 text-brand animate-pulse" />
              )}
              {Math.abs(currentAudioTime - questionTimestamp) < 15 && (
                <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded-full">
                  {formatTime(Math.abs(currentAudioTime - questionTimestamp))}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="font-medium mb-4">{question.question}</h3>
        {renderQuestionContent()}
      </CardContent>
    </Card>
  );
}
