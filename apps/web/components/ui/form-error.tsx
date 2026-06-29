"use client";

import { AlertCircle } from "lucide-react";
import { memo } from "react";

interface FormErrorProps {
  /** The error message to display */
  message?: string | null;
  /** ID to link this error to a form field via aria-describedby */
  id?: string;
  className?: string;
}

/**
 * Accessible form field error message.
 *
 * Features:
 * - role="alert" for screen reader announcement on appearance
 * - aria-live="polite" for non-intrusive updates
 * - Slide-in animation for visual feedback
 * - Linked to input via aria-describedby={id}
 *
 * Usage:
 * ```tsx
 * <input aria-describedby="email-error" aria-invalid={!!error} />
 * <FormError id="email-error" message={error} />
 * ```
 */
export const FormError = memo(function FormError({ message, id, className = "" }: FormErrorProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={`field-error ${className}`}
    >
      <AlertCircle className="h-3 w-3 shrink-0" />
      <span>{message}</span>
    </p>
  );
});
