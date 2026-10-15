import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "choice" | "ghost" | "danger" | "link";
  size?: "default" | "sm" | "lg" | "senior";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles & Focus Ring (WCAG AAA focus visibility)
          "inline-flex items-center justify-center font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus disabled:pointer-events-none disabled:opacity-50 select-none",

          // Variants
          variant === "primary" &&
            "bg-primary text-primary-foreground hover:bg-primary-strong active:bg-primary-strong shadow-none border-0",
          variant === "secondary" &&
            "bg-sogan text-white hover:bg-sogan-strong active:bg-sogan-strong shadow-none border-0",
          variant === "outline" &&
            "border-2 border-line bg-surface text-ink hover:border-ink hover:bg-paper active:bg-paper",
          variant === "choice" &&
            "w-full justify-start text-left border-2 border-line bg-surface text-ink hover:border-primary hover:bg-paper active:bg-paper p-4 rounded-xl",
          variant === "ghost" &&
            "bg-transparent text-ink hover:bg-paper hover:text-ink active:bg-paper border-0",
          variant === "danger" &&
            "bg-status-alert-mark text-white hover:bg-status-alert-mark/90 active:bg-status-alert-mark/90 border-0",
          variant === "link" &&
            "text-primary underline-offset-4 hover:underline p-0 min-h-0 h-auto bg-transparent border-0 font-semibold",

          // Sizes (Touch Target Standard: sm >= 44px, senior >= 60px)
          size === "default" && "min-h-[3rem] px-5 py-3 rounded-lg text-base md:text-lg",
          size === "sm" && "min-h-[2.75rem] px-4 py-2 rounded-lg text-sm", // 44px minimum touch target
          size === "lg" && "min-h-[3.5rem] px-6 py-4 rounded-xl text-lg md:text-xl",
          size === "senior" && "min-h-[3.75rem] px-6 py-4 rounded-xl text-xl font-bold w-full", // 60px senior target

          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
