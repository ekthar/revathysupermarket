"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { shouldShowIntro, isRepeatVisit } from "./intro-shell";
import { shouldShowOnboarding } from "./onboarding-carousel";

// Dynamic imports — no SSR, code-split away from main bundle
const IntroShell = dynamic(
  () => import("./intro-shell").then((m) => ({ default: m.IntroShell })),
  { ssr: false }
);

const OnboardingCarousel = dynamic(
  () => import("./onboarding-carousel").then((m) => ({ default: m.OnboardingCarousel })),
  { ssr: false }
);

const StageHandoff = dynamic(
  () => import("./stage-handoff").then((m) => ({ default: m.StageHandoff })),
  { ssr: false }
);

type IntroPhase = "checking" | "intro" | "handoff-only" | "onboarding" | "done";

/**
 * Top-level intro controller.
 * 
 * Flow:
 * 1. Check if intro should show (session/localStorage/query/feature flag)
 * 2. If first visit → full intro → onboarding carousel
 * 3. If repeat visit within 24h → quick handoff only (300ms)
 * 4. Otherwise → skip
 */
export function IntroController() {
  const [phase, setPhase] = useState<IntroPhase>("checking");

  useEffect(() => {
    // Feature flag check
    if (process.env.NEXT_PUBLIC_FEATURE_INTRO === "0") {
      setPhase("done");
      return;
    }

    // URL escape hatch
    const params = new URLSearchParams(window.location.search);
    if (params.get("skipIntro") === "1") {
      setPhase("done");
      return;
    }

    if (shouldShowIntro()) {
      setPhase("intro");
    } else if (isRepeatVisit()) {
      setPhase("handoff-only");
      // Auto-complete after 300ms
      setTimeout(() => setPhase("done"), 300);
    } else {
      setPhase("done");
    }
  }, []);

  const handleIntroComplete = useCallback(() => {
    // After intro, check if onboarding needed
    if (shouldShowOnboarding()) {
      setPhase("onboarding");
    } else {
      setPhase("done");
    }
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setPhase("done");
  }, []);

  if (phase === "checking" || phase === "done") return null;

  return (
    <AnimatePresence>
      {phase === "intro" && (
        <IntroShell key="intro" onComplete={handleIntroComplete} />
      )}
      {phase === "handoff-only" && (
        <div key="handoff" className="fixed inset-0 z-[200]">
          <StageHandoff />
        </div>
      )}
      {phase === "onboarding" && (
        <OnboardingCarousel key="onboarding" onComplete={handleOnboardingComplete} />
      )}
    </AnimatePresence>
  );
}
