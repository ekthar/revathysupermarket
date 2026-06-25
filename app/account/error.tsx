"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-black text-slate-900 dark:text-white">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        {error.message || "Failed to load account information. Please try again."}
      </p>
      <button
        onClick={reset}
        className="mt-6 h-11 px-6 rounded-full bg-primary text-sm font-bold text-white hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}
