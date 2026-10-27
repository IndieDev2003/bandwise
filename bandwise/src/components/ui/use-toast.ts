"use client";

import * as React from "react";
import { ToastActionElement, ToastProps } from "@radix-ui/react-toast";

type ToasterToast = ToastProps & {
  id: string;
  title: string;
  description?: string;
  action?: ToastActionElement;
};

const toastTimeout = 4000;
const toastLimit = 1;

let toastCount = 0;

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([]);

  const toast = React.useCallback(
    ({
      title,
      description,
      action,
      ...props
    }: Omit<ToasterToast, "id">) => {
      const id = generateId();

      setToasts((toasts) => [
        ...toasts,
        {
          id,
          title,
          description,
          action,
          ...props,
        },
      ]);

      return id;
    },
    []
  );

  const dismiss = React.useCallback((toastId?: string) => {
    if (toastId) {
      setToasts((toasts) => toasts.filter((t) => t.id !== toastId));
    } else {
      setToasts([]);
    }
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
}
