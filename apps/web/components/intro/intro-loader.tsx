"use client";

import dynamic from "next/dynamic";

// Dynamic import with ssr:false is allowed in Client Components
const IntroGate = dynamic(
  () => import("./intro-gate").then((m) => ({ default: m.IntroGate })),
  { ssr: false }
);

/**
 * Client component wrapper that loads the IntroGate dynamically.
 * This exists because `ssr: false` is not allowed in Server Components (layout.tsx).
 */
export function IntroLoader() {
  return <IntroGate />;
}
