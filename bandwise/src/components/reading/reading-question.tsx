"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, HelpCircle } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { ReadingQuestion as ReadingQuestionType } from "@/types";

export interface ReadingQuestionProps {
  question: ReadingQuestionType;
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  isSubmitted?: boolean;
  timeRemaining?: number;
}

export function ReadingQuestion({
  question,
  value,
  onChange,
  isSubmitted = false,
  timeRemaining,
}: ReadingQuestionProps) {
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
                    "flex items-center space-x-2 p-3 rounded-md border",
                    showFeedback && isCorrectOption && "bg-green-50 border-green-200",
                    showFeedback && !isCorrectOption && isSelected && "bg-red-50 border-red-200"
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

      case "true-false":
        return (
          <RadioGroup
            value={Array.isArray(selectedValue) ? "" : (selectedValue || "")}
            onValueChange={(val) => handleChange(val)}
            disabled={isSubmitted}
          >
            {["true", "false", "not given"].map((option, index) => {
              const displayText = option.charAt(0).toUpperCase() + option.slice(1);
              const isSelected = !Array.isArray(selectedValue) && selectedValue === option;
              const isCorrectOption = option === question.correct_answer.toString().toLowerCase();
              const showFeedback = isSubmitted && (isSelected || isCorrectOption);
              
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center space-x-2 p-3 rounded-md border",
                    showFeedback && isCorrectOption && "bg-green-50 border-green-200",
                    showFeedback && !isCorrectOption && isSelected && "bg-red-50 border-red-200"
                  )}
                >
                  <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`} className="flex-1 cursor-pointer">
                    {displayText}
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

      case "summary-completion":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Complete the summary using words from the passage
            </p>
            <Input
              value={Array.isArray(selectedValue) ? selectedValue.join(", ") : (selectedValue || "")}
              onChange={(e) => handleChange(e.target.value)}
              disabled={isSubmitted}
              placeholder="Enter your answer"
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
                    "flex items-center space-x-2 p-3 rounded-md border cursor-pointer",
                    showFeedback && isCorrectOption && "bg-green-50 border-green-200",
                    showFeedback && !isCorrectOption && isSelected && "bg-red-50 border-red-200",
                    !isSubmitted && "hover:bg-muted"
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
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => {}}
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
            <HelpCircle className="h-4 w-4 mr-2 inline" />
            Question type not supported
          </div>
        );
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Question {question.id}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{question.marks} marks</p>
          </div>
          {timeRemaining !== undefined && (
            <div className="text-sm font-medium text-warning">
              {formatTime(timeRemaining)}
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
