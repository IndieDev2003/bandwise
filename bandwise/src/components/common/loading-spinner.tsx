"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="xl" text="Loading..." />
    </div>
  );
}

export function SkeletonLoader({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  );
}

// Test card skeleton
export function TestCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex gap-4">
        <SkeletonLoader className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-4 w-3/4" />
          <SkeletonLoader className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonLoader className="h-3 w-full" />
        <SkeletonLoader className="h-3 w-2/3" />
      </div>
      <SkeletonLoader className="h-10 w-1/4" />
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns }: { columns: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="p-4">
          <SkeletonLoader className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
