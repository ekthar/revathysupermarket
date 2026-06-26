"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center bg-slate-50 p-6 text-slate-950">
        <main className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl">
          <h1 className="text-2xl font-black">We could not load the store</h1>
          <p className="mt-2 text-sm text-slate-600">Check your connection and try again. Your cart has not been changed.</p>
          <button onClick={reset} className="mt-5 h-12 rounded-2xl bg-black px-6 font-bold text-white">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
