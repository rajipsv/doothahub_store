"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

const ToastContext = React.createContext<{
  toast: (t: Omit<ToastItem, "id">) => void;
}>({
  toast: () => {},
});

export function useToast() {
  return React.useContext(ToastContext);
}

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const toast = React.useCallback((t: Omit<ToastItem, "id">) => {
    setItems((prev) => [
      ...prev,
      { ...t, id: Math.random().toString(36).slice(2) },
    ]);
  }, []);

  const remove = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitives.Provider swipeDirection="right">
        {children}
        {items.map((item) => (
          <ToastPrimitives.Root
            key={item.id}
            duration={4000}
            onOpenChange={(open) => !open && remove(item.id)}
            className={cn(
              "data-[state=open]:animate-in data-[state=closed]:animate-out group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-6 shadow-lg",
              item.variant === "destructive"
                ? "destructive border-destructive bg-destructive text-destructive-foreground"
                : "border bg-background text-foreground",
            )}
          >
            <div className="grid gap-1">
              {item.title ? (
                <ToastPrimitives.Title className="text-sm font-semibold">
                  {item.title}
                </ToastPrimitives.Title>
              ) : null}
              {item.description ? (
                <ToastPrimitives.Description className="text-sm opacity-90">
                  {item.description}
                </ToastPrimitives.Description>
              ) : null}
            </div>
          </ToastPrimitives.Root>
        ))}
        <ToastPrimitives.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-auto sm:right-0 sm:top-0 sm:flex-col md:max-w-[420px]" />
      </ToastPrimitives.Provider>
    </ToastContext.Provider>
  );
}
