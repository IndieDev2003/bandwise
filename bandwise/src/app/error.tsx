"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-danger" />
        </div>
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => reset()}>
            Try Again
          </Button>
          <Button asChild variant="outline">
            <a href="/">
              Go to Home
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
