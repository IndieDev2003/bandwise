"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { AudioPlayer } from "./audio-player";
import { ListeningQuestion } from "./listening-question";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, BarChart3, Clock } from "lucide-react";
import { calculateBandScore } from "@/lib/utils";
import { Test, UserAttempt, ListeningQuestion as ListeningQuestionType, ListeningSection } from "@/types";

export interface ListeningTestProps {
  test: Test;
  onSubmit?: (attempt: Omit<UserAttempt, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function ListeningTest({ test, onSubmit }: ListeningTestProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const content = test.content_json;
  const sections: ListeningSection[] = content.sections || [];
  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];

  const handleAnswerChange = useCallback((questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }, []);

  const handleAudioTimeUpdate = useCallback((time: number) => {
    setAudioTime(time);
  }, []);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    // Auto-move to next section if available
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
    }
  }, [currentSectionIndex, sections.length]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < (currentSection?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
    }
  }, [currentQuestionIndex, currentSectionIndex, currentSection?.questions?.length, sections.length]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
      setCurrentQuestionIndex((prev) => Math.min(prev, (sections[prev - 1]?.questions?.length || 0) - 1));
    }
  }, [currentQuestionIndex, currentSectionIndex, sections]);

  const handlePlayPause = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const calculateScore = useCallback(() => {
    let score = 0;
    let maxScore = 0;

    sections.forEach((section) => {
      section.questions.forEach((question) => {
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
    });

    return {
      rawScore: score,
      maxScore,
      percentage: (score / maxScore) * 100,
      bandScore: calculateBandScore((score / maxScore) * 40, 'listening'),
    };
  }, [answers, sections]);

  const handleSubmit = useCallback(() => {
    const { rawScore, maxScore, percentage, bandScore } = calculateScore();
    
    const attemptData: Omit<UserAttempt, 'id' | 'created_at' | 'updated_at'> = {
      user_id: '',
      test_id: test.id,
      section: 'listening',
      answers_json: answers,
      band_score: bandScore,
      ai_feedback_json: null,
      status: 'submitted',
      time_taken: Math.floor(audioTime),
    };

    onSubmit?.(attemptData);
    setIsSubmitted(true);
    setShowResults(true);
  }, [test.id, answers, audioTime, calculateScore, onSubmit]);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = sections.reduce((acc, section) => acc + (section.questions?.length || 0), 0);

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
      {/* Audio Player */}
      <AudioPlayer
        src={content.audio_url || "/audio/listening-test.mp3"}
        duration={content.duration}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={handleAudioEnded}
        onSeek={(time) => setAudioTime(time)}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Section Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {currentSection?.title || `Section ${currentSectionIndex + 1}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{currentSection?.instructions}</p>
            </CardContent>
          </Card>
        </div>

        {/* Questions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentQuestion && (
                  <ListeningQuestion
                    question={currentQuestion}
                    value={answers[currentQuestion.id]}
                    onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    isSubmitted={isSubmitted}
                    currentAudioTime={audioTime}
                    questionTimestamp={currentQuestion.timestamp}
                    isPlaying={isPlaying}
                  />
                )}

                {/* Navigation */}
                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {currentSection?.questions?.length || 0}
                  </span>
                  
                  {currentSectionIndex < sections.length - 1 || 
                   currentQuestionIndex < (currentSection?.questions?.length || 0) - 1 ? (
                    <Button onClick={handleNext}>
                      Next
                    </Button>
                  ) : (
                    <Button onClick={() => setShowSubmitDialog(true)}>
                      Submit Test
                    </Button>
                  )}
                </div>

                {/* Question Navigator */}
                <div className="flex flex-wrap gap-2 pt-4">
                  {sections.flatMap((section, sectionIdx) =>
                    section.questions?.map((q, questionIdx) => {
                      const globalIndex = sections
                        .slice(0, sectionIdx)
                        .reduce((acc, s) => acc + (s.questions?.length || 0), 0) + questionIdx;
                      const isAnswered = !!answers[q.id];
                      const isCurrent = sectionIdx === currentSectionIndex && questionIdx === currentQuestionIndex;
                      
                      return (
                        <Button
                          key={q.id}
                          variant={isCurrent ? "default" : isAnswered ? "outline" : "ghost"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => {
                            setCurrentSectionIndex(sectionIdx);
                            setCurrentQuestionIndex(questionIdx);
                          }}
                        >
                          {globalIndex + 1}
                        </Button>
                      );
                    })
                  )}
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
