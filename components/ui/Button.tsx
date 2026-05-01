import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-card hover:bg-primary-hover",
  secondary:
    "border border-border bg-card text-primary shadow-sm hover:border-primary/30 hover:bg-surface-muted",
  outline:
    "border border-border bg-transparent text-text shadow-sm hover:bg-surface-muted hover:text-foreground",
  ghost: "text-text-muted hover:bg-surface-muted hover:text-foreground",
  destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
};

const sizes: Record<ButtonSize, string> = {
  // Enforce 44px tap targets on mobile, allow denser UI on >=sm screens.
  sm: "min-h-11 px-3 text-xs sm:min-h-9",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-6 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});
