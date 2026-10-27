"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getBandDescriptor } from "@/lib/utils";

export interface AIFeedbackProps {
  feedback: {
    overall_band: number;
    task_response: {
      score: number;
      feedback: string;
      suggestions: string[];
    };
    coherence_cohesion: {
      score: number;
      feedback: string;
      suggestions: string[];
    };
    lexical_resource: {
      score: number;
      feedback: string;
      suggestions: string[];
    };
    grammatical_range_accuracy: {
      score: number;
      feedback: string;
      suggestions: string[];
    };
  };
}

export function AIFeedback({ feedback }: AIFeedbackProps) {
  const criteria = [
    {
      name: "Task Response",
      key: "task_response",
      color: "bg-brand",
    },
    {
      name: "Coherence & Cohesion",
      key: "coherence_cohesion",
      color: "bg-success",
    },
    {
      name: "Lexical Resource",
      key: "lexical_resource",
      color: "bg-warning",
    },
    {
      name: "Grammatical Range & Accuracy",
      key: "grammatical_range_accuracy",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Overall Band Score</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="relative inline-block">
            <div className="h-24 w-24 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl font-bold text-brand">{feedback.overall_band.toFixed(1)}</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {getBandDescriptor(feedback.overall_band)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Criteria Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {criteria.map((criterion) => {
              const data = feedback[criterion.key as keyof typeof feedback] as {
                score: number;
                feedback: string;
                suggestions: string[];
              };
              
              return (
                <div key={criterion.key} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{criterion.name}</h3>
                    <Badge variant="brand" className={criterion.color}>
                      Band {data.score.toFixed(1)}
                    </Badge>
                  </div>
                  <Progress value={data.score * 10} max={90} />
                  <p className="text-sm text-muted-foreground mt-2">{data.feedback}</p>
                  {data.suggestions.length > 0 && (
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li className="font-medium">Suggestions:</li>
                      {data.suggestions.map((suggestion, index) => (
                        <li key={index} className="list-disc list-inside">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>How to Improve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Strengths:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {criteria
                  .filter((c) => {
                    const data = feedback[c.key as keyof typeof feedback] as { score: number };
                    return data.score >= 6.5;
                  })
                  .map((c) => (
                    <li key={c.key} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      {c.name}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Areas to Improve:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {criteria
                  .filter((c) => {
                    const data = feedback[c.key as keyof typeof feedback] as { score: number };
                    return data.score < 6.5;
                  })
                  .map((c) => (
                    <li key={c.key} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-warning" />
                      {c.name}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
