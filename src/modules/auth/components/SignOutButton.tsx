"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/modules/auth/actions/sign-out";
import { cn } from "@/lib/utils";

type Variant = "button" | "link";

export function SignOutButton({
  variant = "button",
  className,
  label = "Sign out",
  showIcon = true,
}: {
  variant?: Variant;
  className?: string;
  label?: string;
  showIcon?: boolean;
}) {
  return (
    <form action={signOutAction} className="inline">
      {variant === "link" ? (
        <button
          type="submit"
          className={cn(
            "flex w-full items-center gap-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline",
            className,
          )}
        >
          {showIcon ? <LogOut className="h-4 w-4" /> : null}
          {label}
        </button>
      ) : (
        <Button type="submit" variant="ghost" size="sm" className={className}>
          {showIcon ? <LogOut className="mr-1 h-4 w-4" /> : null}
          {label}
        </Button>
      )}
    </form>
  );
}
