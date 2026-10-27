"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { ReadingPassage } from "./reading-passage";
import { ReadingQuestion } from "./reading-question";
import { ReadingTimer } from "./reading-timer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, BarChart3 } from "lucide-react";
import { calculateBandScore } from "@/lib/utils";
import { Test, UserAttempt, ReadingQuestion as ReadingQuestionType } from "@/types";

export interface ReadingTestProps {
  test: Test;
  onSubmit?: (attempt: Omit<UserAttempt, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function ReadingTest({ test, onSubmit }: ReadingTestProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(test.estimated_time * 60);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const content = test.content_json;
  const passages = content.passages || [];
  const currentPassage = passages[0]; // For simplicity, using first passage
  
  const allQuestions: ReadingQuestionType[] = [];
  passages.forEach((passage: any) => {
    if (passage.questions) {
      allQuestions.push(...passage.questions);
    }
  });

  const currentQuestion = allQuestions[currentQuestionIndex];

  const handleAnswerChange = useCallback((questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuestionIndex, allQuestions.length]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleTimeUp = useCallback(() => {
    setShowSubmitDialog(true);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setTimeRemaining(time);
  }, []);

  const calculateScore = useCallback(() => {
    let score = 0;
    let maxScore = 0;

    allQuestions.forEach((question) => {
      const userAnswer = answers[question.id];
      maxScore += question.marks;

      if (userAnswer) {
        if (Array.isArray(question.correct_answer)) {
          if (Array.isArray(userAnswer)) {
            const correct = JSON.stringify(userAnswer.sort()) === JSON.stringify(question.correct_answer.sort());
            if (correct) score += question.marks;
          }
        } else {
          if (userAnswer === question.correct_answer) {
            score += question.marks;
          }
        }
      }
    });

    return {
      rawScore: score,
      maxScore,
      percentage: (score / maxScore) * 100,
      bandScore: calculateBandScore((score / maxScore) * 40, 'reading'),
    };
  }, [answers, allQuestions]);

  const handleSubmit = useCallback(() => {
    const { rawScore, maxScore, percentage, bandScore } = calculateScore();
    
    const attemptData: Omit<UserAttempt, 'id' | 'created_at' | 'updated_at'> = {
      user_id: '', // Will be set by the parent component
      test_id: test.id,
      section: 'reading',
      answers_json: answers,
      band_score: bandScore,
      ai_feedback_json: null,
      status: 'submitted',
      time_taken: test.estimated_time * 60 - timeRemaining,
    };

    onSubmit?.(attemptData);
    setIsSubmitted(true);
    setShowResults(true);
  }, [test.id, answers, timeRemaining, calculateScore, onSubmit]);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = allQuestions.length;

  if (showResults) {
    const { rawScore, maxScore, percentage, bandScore } = calculateScore();
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Test Completed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-brand/10 flex items-center justify-center">
                  <span className="text-4xl font-bold text-brand">{bandScore.toFixed(1)}</span>
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <span className="text-sm font-medium">Band Score</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{rawScore}</p>
                  <p className="text-sm text-muted-foreground">Correct Answers</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <BarChart3 className="h-8 w-8 text-brand mx-auto mb-2" />
                  <p className="text-2xl font-bold">{percentage.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{totalQuestions - answeredCount}</p>
                  <p className="text-sm text-muted-foreground">Unanswered</p>
                </CardContent>
              </Card>
            </div>

            <Button onClick={() => window.location.href = '/practice'} className="w-full max-w-md mx-auto">
              Back to Practice
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timer */}
      <ReadingTimer
        initialTime={test.estimated_time * 60}
        onTimeUp={handleTimeUp}
        onTimeUpdate={handleTimeUpdate}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Passage */}
        <div className="lg:col-span-1">
          <ReadingPassage passage={currentPassage} activeQuestionId={currentQuestion?.id} />
        </div>

        {/* Questions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ReadingQuestion
                  question={currentQuestion}
                  value={answers[currentQuestion?.id]}
                  onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  isSubmitted={isSubmitted}
                  timeRemaining={timeRemaining}
                />

                {/* Navigation */}
                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  
                  {currentQuestionIndex < totalQuestions - 1 ? (
                    <Button onClick={handleNext} disabled={!answers[currentQuestion?.id]}>
                      Next
                    </Button>
                  ) : (
                    <Button onClick={() => setShowSubmitDialog(true)} disabled={!answers[currentQuestion?.id]}>
                      Submit Test
                    </Button>
                  )}
                </div>

                {/* Question Navigator */}
                <div className="flex flex-wrap gap-2 pt-4">
                  {allQuestions.map((q, index) => {
                    const isAnswered = !!answers[q.id];
                    const isCurrent = index === currentQuestionIndex;
                    
                    return (
                      <Button
                        key={q.id}
                        variant={isCurrent ? "default" : isAnswered ? "outline" : "ghost"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentQuestionIndex(index)}
                      >
                        {index + 1}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {totalQuestions} questions. 
              You cannot go back once submitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Test</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
