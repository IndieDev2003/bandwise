"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { AudioRecorder } from "./audio-recorder";
import { SpeakingQuestion } from "./speaking-question";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, CheckCircle, Clock } from "lucide-react";
import { Test, UserAttempt, SpeakingTask, SpeakingQuestion as SpeakingQuestionType } from "@/types";
import { supabase } from "@/lib/supabase";

export interface SpeakingTestProps {
  test: Test;
  onSubmit?: (attempt: Omit<UserAttempt, 'id' | 'created_at' | 'updated_at'>) => void;
  userId: string;
  userSubscription: 'free' | 'pro';
}

export function SpeakingTest({ test, onSubmit, userId, userSubscription }: SpeakingTestProps) {
  const [currentPart, setCurrentPart] = useState<1 | 2 | 3>(1);
  const [recordings, setRecordings] = useState<Record<string, { blob: Blob; duration: number; url: string }>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const content = test.content_json;
  const parts: SpeakingTask[] = content.parts || [];
  const currentPartData = parts.find((p) => p.part === currentPart);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob, duration: number) => {
    const partData = parts.find((p) => p.part === currentPart);
    if (partData) {
      const audioUrl = URL.createObjectURL(audioBlob);
      setRecordings((prev) => ({
        ...prev,
        [`part${currentPart}`]: {
          blob: audioBlob,
          duration,
          url: audioUrl,
        },
      }));
      setIsRecording(false);
    }
  }, [currentPart, parts]);

  const handleRecordingStart = useCallback(() => {
    setIsRecording(true);
  }, []);

  const handlePartChange = useCallback((part: 1 | 2 | 3) => {
    setCurrentPart(part);
  }, []);

  const uploadRecording = useCallback(async (part: 1 | 2 | 3, blob: Blob) => {
    try {
      const fileName = `speaking-${userId}-${Date.now()}-part${part}.wav`;
      const { data, error } = await supabase.storage
        .from('audio-recordings')
        .upload(fileName, blob, {
          contentType: 'audio/wav',
        });

      if (error) {
        throw error;
      }

      return data.path;
    } catch (err) {
      console.error("Error uploading recording:", err);
      throw err;
    }
  }, [userId]);

  // Mock AI evaluation function
  const evaluateWithAI = useCallback(async (part: 1 | 2 | 3, audioUrl: string) => {
    setIsEvaluating(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock AI feedback
    const mockFeedback = {
      overall_band: 6.5 + Math.random() * 2,
      pronunciation: {
        score: 6.0 + Math.random() * 2,
        feedback: `Your pronunciation is ${Math.random() > 0.5 ? 'clear' : 'generally understandable'}. Most words are pronounced correctly.`,
        suggestions: [
          "Practice difficult sounds",
          "Work on word stress patterns",
          "Improve intonation"
        ]
      },
      fluency: {
        score: 6.0 + Math.random() * 2,
        feedback: `Your speech shows ${Math.random() > 0.5 ? 'good' : 'adequate'} fluency. You maintain a reasonable speech rate.`,
        suggestions: [
          "Speak more naturally without pauses",
          "Practice speaking at a consistent pace",
          "Use fillers less frequently"
        ]
      },
      lexical_resource: {
        score: 6.0 + Math.random() * 2,
        feedback: `You use a ${Math.random() > 0.5 ? 'good' : 'sufficient'} range of vocabulary. There are some attempts at using less common words.`,
        suggestions: [
          "Use more varied vocabulary",
          "Learn and use idiomatic expressions",
          "Avoid repetition"
        ]
      },
      transcript: `This is a mock transcript of the user's response. In a real implementation, this would be generated using speech-to-text technology. The transcript would contain the actual words spoken by the user during the recording.`
    };

    setAiFeedback((prev: any) => ({
      ...prev,
      [`part${part}`]: mockFeedback
    }));

    setIsEvaluating(false);
    return mockFeedback;
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitted(true);
    setShowResults(true);
    setIsUploading(true);

    try {
      // Upload all recordings
      const audioUrls: Record<string, string> = {};
      const totalParts = Object.keys(recordings).length;
      
      for (const [partKey, recording] of Object.entries(recordings)) {
        const part = parseInt(partKey.replace('part', '')) as 1 | 2 | 3;
        const progress = (Object.keys(audioUrls).length / totalParts) * 100;
        setUploadProgress(progress);
        
        audioUrls[partKey] = await uploadRecording(part, recording.blob);
      }

      // Calculate band scores
      const partScores = Object.values(recordings).map(() => 6.5 + Math.random() * 2);
      const overallBand = partScores.reduce((a, b) => a + b, 0) / partScores.length;

      // If user is pro, evaluate with AI
      if (userSubscription === 'pro') {
        for (const [partKey, recording] of Object.entries(recordings)) {
          const part = parseInt(partKey.replace('part', '')) as 1 | 2 | 3;
          await evaluateWithAI(part, recording.url);
        }
      }

      // Prepare attempt data
      const attemptData: Omit<UserAttempt, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        test_id: test.id,
        section: 'speaking',
        answers_json: {
          audioUrls,
          recordings: Object.fromEntries(
            Object.entries(recordings).map(([key, value]) => [key, {
              duration: value.duration,
            }])
          ),
        },
        band_score: parseFloat(overallBand.toFixed(1)),
        ai_feedback_json: aiFeedback,
        status: 'submitted',
        time_taken: Object.values(recordings).reduce((acc, r) => acc + r.duration, 0),
      };

      onSubmit?.(attemptData);
    } catch (err) {
      console.error("Error submitting speaking test:", err);
    } finally {
      setIsUploading(false);
    }
  }, [
    test.id,
    userId,
    recordings,
    uploadRecording,
    userSubscription,
    evaluateWithAI,
    aiFeedback,
    onSubmit
  ]);

  const completedParts = Object.keys(recordings).map((key) => parseInt(key.replace('part', '')) as 1 | 2 | 3);
  const allParts = [1, 2, 3];
  const isPartCompleted = (part: 1 | 2 | 3) => completedParts.includes(part);

  if (showResults) {
    const partScores = Object.values(recordings).map(() => 6.5 + Math.random() * 2);
    const overallBand = partScores.reduce((a, b) => a + b, 0) / partScores.length;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Speaking Test Completed!</CardTitle>
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

            <div className="grid grid-cols-3 gap-4">
              {allParts.map((part) => (
                <Card key={part}>
                  <CardContent className="pt-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Part {part}
                    </p>
                    <p className="text-2xl font-bold text-brand">
                      {partScores[part - 1]?.toFixed(1) || "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {recordings[`part${part}`]?.duration || 0}s
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {userSubscription === 'pro' && aiFeedback && (
              <Tabs defaultValue="part1" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  {allParts.map((part) => (
                    <TabsTrigger key={part} value={`part${part}`}>
                      Part {part}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {allParts.map((part) => (
                  <TabsContent key={part} value={`part${part}`}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Part {part} Feedback</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {aiFeedback[`part${part}`] && (
                          <>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Pronunciation</p>
                                <p className="text-2xl font-bold text-brand">
                                  {aiFeedback[`part${part}`].pronunciation.score.toFixed(1)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Fluency</p>
                                <p className="text-2xl font-bold text-brand">
                                  {aiFeedback[`part${part}`].fluency.score.toFixed(1)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Lexical Resource</p>
                                <p className="text-2xl font-bold text-brand">
                                  {aiFeedback[`part${part}`].lexical_resource.score.toFixed(1)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="p-4 bg-muted/50 rounded-lg">
                              <h4 className="font-medium mb-2">Transcript:</h4>
                              <p className="text-sm whitespace-pre-wrap">{aiFeedback[`part${part}`].transcript}</p>
                            </div>
                            
                            <div className="space-y-4">
                              <h4 className="font-medium">Detailed Feedback:</h4>
                              <div className="space-y-3">
                                <div>
                                  <h5 className="font-medium text-brand">Pronunciation</h5>
                                  <p className="text-sm text-muted-foreground">{aiFeedback[`part${part}`].pronunciation.feedback}</p>
                                </div>
                                <div>
                                  <h5 className="font-medium text-brand">Fluency</h5>
                                  <p className="text-sm text-muted-foreground">{aiFeedback[`part${part}`].fluency.feedback}</p>
                                </div>
                                <div>
                                  <h5 className="font-medium text-brand">Lexical Resource</h5>
                                  <p className="text-sm text-muted-foreground">{aiFeedback[`part${part}`].lexical_resource.feedback}</p>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
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
                    Get detailed AI evaluation for your speaking with band scores and actionable feedback
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
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="text-xl font-bold">
                {parts.reduce((acc, p) => acc + (p.suggested_time || 0), 0)} min total
              </span>
            </div>
            <div className="flex gap-2">
              {allParts.map((part) => (
                <Button
                  key={part}
                  variant={currentPart === part ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePartChange(part)}
                  disabled={!isPartCompleted(part) && part !== currentPart}
                >
                  Part {part}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Part */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Part Information */}
        <div>
          {currentPartData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  Part {currentPart}: {currentPartData.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{currentPartData.instructions}</p>
                
                {currentPart === 2 && currentPartData.cue_card && (
                  <div className="p-4 bg-brand/5 border brand/10 rounded-lg mb-4">
                    <h4 className="font-medium mb-2">Cue Card</h4>
                    <p className="font-medium mb-2">{currentPartData.cue_card.topic}</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {currentPartData.cue_card.points.map((point, index) => (
                        <li key={index} className="list-disc list-inside">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-medium">Questions:</h4>
                  {currentPartData.questions?.map((q: SpeakingQuestionType, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">{index + 1}. {q.question}</p>
                      {q.follow_up && (
                        <p className="text-sm text-muted-foreground italic">
                          Follow-up: {q.follow_up}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-warning/5 border warning/10 rounded-lg">
                  <p className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Suggested time: {currentPartData.suggested_time} minutes
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recorder */}
        <div>
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            onRecordingStart={handleRecordingStart}
            disabled={isSubmitted || isRecording}
            maxDuration={currentPartData?.suggested_time ? currentPartData.suggested_time * 60 : 120}
          />

          {/* Navigation */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => handlePartChange((currentPart > 1 ? currentPart - 1 : 1) as 1 | 2 | 3)}
                  disabled={currentPart === 1}
                >
                  Previous Part
                </Button>
                
                {currentPart < 3 ? (
                  <Button
                    onClick={() => handlePartChange((currentPart + 1) as 1 | 2 | 3)}
                    disabled={!isPartCompleted(currentPart)}
                  >
                    Next Part
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowSubmitDialog(true)}
                    disabled={!isPartCompleted(currentPart)}
                  >
                    Submit Test
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Question Navigator */}
      <div className="grid md:grid-cols-3 gap-4">
        {parts.map((partData) => (
          <SpeakingQuestion
            key={partData.id}
            question={{
              id: `Part ${partData.part}`,
              question: partData.title || `Part ${partData.part}`,
              follow_up: partData.questions?.[0]?.follow_up,
            }}
            part={partData.part}
            isCurrent={partData.part === currentPart}
            isCompleted={isPartCompleted(partData.part)}
            onClick={() => handlePartChange(partData.part)}
          />
        ))}
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
            <AlertDialogDescription>
              You have completed {completedParts.length} out of {allParts.length} parts. 
              {completedParts.length < allParts.length && (
                <span className="text-warning"> Some parts are incomplete.</span>
              )}
              You cannot go back once submitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Test</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading Recordings...
                </>
              ) : isEvaluating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating with AI...
                </>
              ) : (
                "Submit"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Progress */}
      {isUploading && uploadProgress > 0 && uploadProgress < 100 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Uploading recordings...</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-brand transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{Math.floor(uploadProgress)}%</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
