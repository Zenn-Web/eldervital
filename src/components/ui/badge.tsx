import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "ok" | "warn" | "alert" | "neutral" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold border transition-colors",
        variant === "default" && "border-transparent bg-primary text-white",
        variant === "ok" && "border-status-ok-mark/40 bg-status-ok-bg text-status-ok-ink",
        variant === "warn" && "border-status-warn-mark/40 bg-status-warn-bg text-status-warn-ink",
        variant === "alert" && "border-status-alert-mark/40 bg-status-alert-bg text-status-alert-ink",
        variant === "neutral" && "border-line bg-status-none-bg text-status-none-ink",
        variant === "outline" && "border-line bg-surface text-ink",
        className
      )}
      {...props}
    />
  );
}
