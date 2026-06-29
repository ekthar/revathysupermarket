"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Called when the error boundary catches an error */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary with accessible fallback UI.
 * Provides retry functionality and logs errors.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
  className?: string;
}

/**
 * Default error fallback UI with retry button.
 * Can be used standalone or within ErrorBoundary.
 */
export function ErrorFallback({ error, onReset, className }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center min-h-[200px]",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-state-danger/10 mb-4">
        <AlertTriangle className="h-6 w-6 text-state-danger" aria-hidden="true" />
      </div>
      <h3 className="text-title font-bold text-foreground">Something went wrong</h3>
      <p className="mt-2 text-body text-muted-foreground max-w-sm">
        {error?.message || "An unexpected error occurred. Please try again."}
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 inline-flex items-center gap-2 min-h-touch px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-body font-bold transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Retry loading this content"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}
