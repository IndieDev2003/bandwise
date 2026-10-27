"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@radix-ui/react-toast";

function ToastComponent({
  toast,
  className,
}: {
  toast: { id: string; title: string; description?: string; action?: React.ReactNode };
  className?: string;
}) {
  const { dismiss } = useToast();

  return (
    <Toast
      className={cn(
        "group toast group-[.destructive]:bg-destructive group-[.destructive]:text-destructive-foreground",
        className
      )}
      onOpenChange={(open) => {
        if (!open) dismiss(toast.id);
      }}
    >
      <div className="flex flex-col gap-1">
        {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
        {toast.description && (
          <ToastDescription>{toast.description}</ToastDescription>
        )}
      </div>
      {toast.action}
      <ToastClose />
    </Toast>
  );
}

function ToastContainer() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} />
      ))}
      <ToastViewport className="[&>div]:mt-2 [&>div]:w-[340px]" />
    </ToastProvider>
  );
}

export { ToastContainer, useToast };
