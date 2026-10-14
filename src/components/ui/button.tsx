import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "choice" | "ghost" | "danger";
  size?: "default" | "sm" | "lg" | "senior";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center font-bold text-base transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus disabled:pointer-events-none disabled:opacity-50 select-none",
          
          // Variants
          variant === "primary" &&
            "bg-primary text-primary-foreground hover:bg-primary-strong active:bg-primary-strong shadow-none border-0",
          variant === "secondary" &&
            "bg-sogan text-white hover:bg-sogan-strong active:bg-sogan-strong shadow-none border-0",
          variant === "outline" &&
            "border-2 border-line bg-surface text-ink hover:border-ink hover:bg-paper active:bg-paper",
          variant === "choice" &&
            "w-full justify-start text-left border-2 border-line bg-surface text-ink hover:border-primary hover:bg-[#F9F5EC] active:bg-[#F9F5EC] p-4 rounded-xl",
          variant === "ghost" &&
            "bg-transparent text-ink hover:bg-paper hover:text-ink active:bg-paper border-0",
          variant === "danger" &&
            "bg-[#B3261E] text-white hover:bg-[#8F1A13] active:bg-[#8F1A13] border-0",

          // Sizes (Aksesibilitas Lansia: min-h-[3.75rem] = 60px)
          size === "default" && "min-h-[3rem] px-5 py-3 rounded-lg text-lg",
          size === "sm" && "min-h-[2.5rem] px-3 py-1.5 rounded-md text-sm",
          size === "lg" && "min-h-[3.5rem] px-6 py-4 rounded-xl text-xl",
          size === "senior" && "min-h-[3.75rem] px-6 py-4 rounded-xl text-xl font-bold w-full",

          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
