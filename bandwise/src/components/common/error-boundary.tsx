"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export class ErrorBoundary extends React.Component<{ fallback?: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-danger" />
            </div>
            <h1 className="text-3xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()}>
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

    return this.props.children;
  }
}

export function withErrorBoundary(Component: React.ComponentType, fallback?: React.ReactNode) {
  return function WrappedComponent(props: any) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
