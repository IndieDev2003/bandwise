"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { WritingEditor } from "./writing-editor";
import { WritingTimer } from "./writing-timer";
import { AIFeedback } from "./ai-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, CheckCircle } from "lucide-react";
import { Test, UserAttempt, WritingTask } from "@/types";

export interface WritingTestProps {
  test: Test;
  onSubmit?: (attempt: Omit<UserAttempt, 'id' | 'created_at' | 'updated_at'>) => void;
  userSubscription: 'free' | 'pro';
}

export function WritingTest({ test, onSubmit, userSubscription }: WritingTestProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(test.estimated_time * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("task1");

  const content = test.content_json;
  const tasks: WritingTask[] = content.tasks || [];
  const currentTask = tasks[currentTaskIndex];

  // Handle task switching
  useEffect(() => {
    setActiveTab(currentTaskIndex === 0 ? "task1" : "task2");
  }, [currentTaskIndex]);

  const handleResponseChange = useCallback((taskId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [taskId]: value,
    }));
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setTimeRemaining(time);
  }, []);

  const handleTimeUp = useCallback(() => {
    setShowSubmitDialog(true);
  }, []);

  const calculateWordCounts = useCallback(() => {
    return tasks.map((task) => {
      const response = responses[task.id] || "";
      return response.trim() === "" ? 0 : response.trim().split(/\s+/).length;
    });
  }, [responses, tasks]);

  const handleNextTask = useCallback(() => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex((prev) => prev + 1);
    }
  }, [currentTaskIndex, tasks.length]);

  const handlePreviousTask = useCallback(() => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex((prev) => prev - 1);
    }
  }, [currentTaskIndex]);

  // Mock AI evaluation function
  const evaluateWithAI = useCallback(async (taskId: string, response: string) => {
    setIsEvaluating(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock AI feedback
    const mockFeedback = {
      overall_band: 6.5 + Math.random() * 2,
      task_response: {
        score: 6.0 + Math.random() * 2,
        feedback: `Your response addresses the task ${Math.random() > 0.5 ? 'effectively' : 'partially'}. You have provided relevant content and maintained a clear position throughout.`,
        suggestions: [
          "Include more specific examples to support your points",
          "Vary your sentence structures for better flow",
          "Ensure all parts of the prompt are fully addressed"
        ]
      },
      coherence_cohesion: {
        score: 6.0 + Math.random() * 2,
        feedback: `Your writing shows ${Math.random() > 0.5 ? 'good' : 'adequate'} organization. Ideas are presented in a logical sequence with some use of cohesive devices.`,
        suggestions: [
          "Use more linking words to connect ideas",
          "Improve paragraph transitions",
          "Maintain consistent tense usage"
        ]
      },
      lexical_resource: {
        score: 6.0 + Math.random() * 2,
        feedback: `You demonstrate a ${Math.random() > 0.5 ? 'good' : 'sufficient'} range of vocabulary. There are some attempts at using less common words.`,
        suggestions: [
          "Use more sophisticated vocabulary",
          "Avoid repetition of words",
          "Learn and use idiomatic expressions"
        ]
      },
      grammatical_range_accuracy: {
        score: 6.0 + Math.random() * 2,
        feedback: `Your grammatical structures are ${Math.random() > 0.5 ? 'mostly accurate' : 'adequate'}. There are some errors but they do not significantly affect communication.`,
        suggestions: [
          "Review subject-verb agreement",
          "Practice complex sentence structures",
          "Proofread for grammatical errors"
        ]
      }
    };

    setAiFeedback((prev: any) => ({
      ...prev,
      [taskId]: mockFeedback
    }));

    setIsEvaluating(false);
    return mockFeedback;
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitted(true);
    setShowResults(true);

    // Calculate band scores for each task
    const wordCounts = calculateWordCounts();
    const taskScores = tasks.map((task, index) => {
      const wordCount = wordCounts[index];
      // Simple scoring based on word count and completion
      let score = 0;
      if (wordCount >= task.min_words) {
        score = 5 + (Math.min(wordCount, task.max_words) - task.min_words) / (task.max_words - task.min_words) * 4;
      } else {
        score = (wordCount / task.min_words) * 5;
      }
      return Math.min(score, 9);
    });

    const overallBand = taskScores.reduce((a, b) => a + b, 0) / taskScores.length;

    // If user is pro, evaluate with AI
    if (userSubscription === 'pro') {
      await Promise.all(
        tasks.map(async (task) => {
          const response = responses[task.id] || "";
          if (response.trim()) {
            await evaluateWithAI(task.id, response);
          }
        })
      );
    }

    // Prepare attempt data
    const attemptData: Omit<UserAttempt, 'id' | 'created_at' | 'updated_at'> = {
      user_id: '',
      test_id: test.id,
      section: 'writing',
      answers_json: {
        responses,
        wordCounts: calculateWordCounts(),
      },
      band_score: parseFloat(overallBand.toFixed(1)),
      ai_feedback_json: aiFeedback,
      status: 'submitted',
      time_taken: test.estimated_time * 60 - timeRemaining,
    };

    onSubmit?.(attemptData);
  }, [
    test.id,
    responses,
    timeRemaining,
    calculateWordCounts,
    tasks,
    userSubscription,
    evaluateWithAI,
    aiFeedback,
    onSubmit
  ]);

  const wordCounts = calculateWordCounts();
  const totalWordCount = wordCounts.reduce((a, b) => a + b, 0);
  const currentWordCount = wordCounts[currentTaskIndex] || 0;

  if (showResults) {
    const wordCounts = calculateWordCounts();
    const taskScores = tasks.map((task, index) => {
      const wordCount = wordCounts[index];
      let score = 0;
      if (wordCount >= task.min_words) {
        score = 5 + (Math.min(wordCount, task.max_words) - task.min_words) / (task.max_words - task.min_words) * 4;
      } else {
        score = (wordCount / task.min_words) * 5;
      }
      return Math.min(score, 9);
    });
    
    const overallBand = taskScores.reduce((a, b) => a + b, 0) / taskScores.length;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Writing Test Completed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-brand/10 flex items-center justify-center">
                  <span className="text-4xl font-bold text-brand">{overallBand.toFixed(1)}</span>
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <span className="text-sm font-medium">Overall Band Score</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {tasks.map((task, index) => (
                <Card key={task.id}>
                  <CardContent className="pt-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Task {index + 1}
                    </p>
                    <p className="text-2xl font-bold text-brand">
                      {taskScores[index].toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {wordCounts[index]} words
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {userSubscription === 'pro' && aiFeedback && (
              <Tabs defaultValue={activeTab} className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  {tasks.map((task, index) => (
                    <TabsTrigger key={task.id} value={`task${index + 1}`}>
                      Task {index + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {tasks.map((task, index) => (
                  <TabsContent key={task.id} value={`task${index + 1}`}>
                    <AIFeedback feedback={aiFeedback[task.id]} />
                  </TabsContent>
                ))}
              </Tabs>
            )}

            {userSubscription === 'free' && (
              <Card className="mt-6 border-brand/20 bg-brand/5">
                <CardContent className="text-center py-6">
                  <Sparkles className="h-8 w-8 text-brand mx-auto mb-3" />
                  <p className="text-brand font-medium mb-2">
                    Upgrade to Pro to unlock AI feedback!
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get detailed AI evaluation for your writing with band scores and actionable feedback
                  </p>
                  <Button asChild variant="brand">
                    <a href="/pricing">
                      Upgrade Now
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

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
      <WritingTimer
        initialTime={test.estimated_time * 60}
        onTimeUp={handleTimeUp}
        onTimeUpdate={handleTimeUpdate}
        isActive={!isSubmitted}
      />

      {/* Task Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setCurrentTaskIndex(value === "task1" ? 0 : 1);
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {tasks.map((task, index) => (
            <TabsTrigger key={task.id} value={`task${index + 1}`}>
              Task {index + 1}: {task.task_type === 'task1' ? 'Report/Letter' : 'Essay'}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tasks.map((task, index) => (
          <TabsContent key={task.id} value={`task${index + 1}`} className="mt-0">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Editor */}
              <div className="lg:col-span-2">
                <WritingEditor
                  task={task}
                  value={responses[task.id] || ""}
                  onChange={(value) => handleResponseChange(task.id, value)}
                  timeRemaining={timeRemaining}
                  onTimeUp={handleTimeUp}
                />
              </div>

              {/* Task Info and Navigation */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Task Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Suggested Time</p>
                      <p className="font-medium">{task.suggested_time} minutes</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Word Count</p>
                      <p className="font-medium">{currentWordCount} words</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Requirements</p>
                      <p className="font-medium">{task.min_words}-{task.max_words} words</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Navigation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handlePreviousTask}
                      disabled={currentTaskIndex === 0}
                    >
                      Previous Task
                    </Button>
                    
                    {currentTaskIndex < tasks.length - 1 ? (
                      <Button
                        className="w-full"
                        onClick={handleNextTask}
                        disabled={currentWordCount < tasks[currentTaskIndex].min_words}
                      >
                        Next Task
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => setShowSubmitDialog(true)}
                        disabled={!responses[task.id] || currentWordCount < task.min_words}
                      >
                        Submit Test
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {isEvaluating && (
                  <Card>
                    <CardContent className="text-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Evaluating your response with AI...
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
            <AlertDialogDescription>
              You have written {totalWordCount} words across both tasks. 
              {tasks.some((task, index) => (wordCounts[index] || 0) < task.min_words) && (
                <span className="text-warning"> Some tasks are below the minimum word count.</span>
              )}
              You cannot go back once submitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Writing</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              {isEvaluating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
