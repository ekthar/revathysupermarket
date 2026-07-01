"use client";

// The global error boundary replaces the root layout (and its ThemeProvider),
// so next-themes cannot set the `dark` class here. This inline script mirrors
// the stored theme preference before paint so the dark: variants below apply.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`;

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="grid min-h-dvh place-items-center bg-slate-50 p-6 text-slate-950 dark:bg-neutral-950 dark:text-neutral-100">
        <main className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl dark:bg-neutral-900 dark:shadow-black/40">
          <h1 className="text-2xl font-black">We could not load the store</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-neutral-400">Check your connection and try again. Your cart has not been changed.</p>
          <button onClick={reset} className="mt-5 h-12 rounded-2xl bg-black px-6 font-bold text-white dark:bg-white dark:text-black">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
