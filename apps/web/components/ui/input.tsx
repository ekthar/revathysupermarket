import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Input — styled form input with automatic enterKeyHint for native keyboard accessories.
 *
 * On mobile, the keyboard shows contextual action buttons:
 * - "search" inputs → shows "Search" button
 * - "email" inputs → shows "Next" button
 * - "tel" inputs → shows "Done" button
 * - "password" inputs → shows "Done" button
 *
 * Override by passing enterKeyHint explicitly.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, enterKeyHint, ...props }, ref) => {
  // Auto-set enterKeyHint based on input type for native keyboard feel
  const autoHint = enterKeyHint ?? getDefaultEnterKeyHint(type);

  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm shadow-sm transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      type={type}
      enterKeyHint={autoHint}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

function getDefaultEnterKeyHint(type?: string): React.InputHTMLAttributes<HTMLInputElement>["enterKeyHint"] {
  switch (type) {
    case "search":
      return "search";
    case "email":
      return "next";
    case "tel":
      return "done";
    case "password":
      return "done";
    case "url":
      return "go";
    default:
      return "next";
  }
}

export { Input };
