"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Mic, HelpCircle } from "lucide-react";

export interface SpeakingQuestionProps {
  question: {
    id: string;
    question: string;
    follow_up?: string;
  };
  part: 1 | 2 | 3;
  isCurrent: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

export function SpeakingQuestion({ question, part, isCurrent, isCompleted, onClick }: SpeakingQuestionProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isCurrent && "border-brand shadow-brand/25",
        isCompleted && "border-success/20 bg-success/5"
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant={isCurrent ? "brand" : isCompleted ? "success" : "secondary"}>
              Part {part}
            </Badge>
            <CardTitle className="text-lg">{question.id}</CardTitle>
          </div>
          {isCompleted && (
            <Badge variant="success" className="gap-1">
              <Mic className="h-3 w-3" />
              Completed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="font-medium mb-2">{question.question}</p>
        {question.follow_up && (
          <p className="text-sm text-muted-foreground italic">
            Follow-up: {question.follow_up}
          </p>
        )}
        {isCurrent && (
          <div className="mt-4 p-3 bg-brand/5 border brand/10 rounded-lg">
            <p className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Click to start recording your response
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function for cn
function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
