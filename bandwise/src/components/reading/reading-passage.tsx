"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ReadingPassageProps {
  passage: {
    id: string;
    title: string;
    content: string;
  };
  activeQuestionId?: string;
}

export function ReadingPassage({ passage, activeQuestionId }: ReadingPassageProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl">{passage.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100%-80px)]">
          <div className="prose max-w-none text-sm leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: passage.content.replace(/\n/g, '<br />') }} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
