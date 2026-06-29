"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { StageColdOpen } from "./stage-cold-open";
import { StageLogoReveal } from "./stage-logo-reveal";
import { StageTagline } from "./stage-tagline";
import { StageStorefront } from "./stage-storefront";
import { StageHandoff } from "./stage-handoff";

const TOTAL_DURATION_MS = 6400;
const SKIP_VISIBLE_MS = 800;
const REPEAT_VISIT_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h
const SESSION_KEY = "msm_intro_shown";
const LAST_VISIT_KEY = "msm_last_intro";

interface IntroShellProps {
  onComplete: () => void;
}

/**
 * Cinematic intro orchestrator.
 * 
 * Stages:
 * 0 - Native PWA splash (handled by OS/manifest)
 * 1 - Cold open: black screen with film slit line (0-1.2s)
 * 2 - Logo reveal: SVG path draw with chromatic aberration (1.2-3.0s)
 * 3 - Tagline typewriter (3.0-4.2s)
 * 4 - Storefront parallax pan (4.2-5.6s)
 * 5 - Hero hand-off: logo shrinks to header position (5.6-6.4s)
 * 
 * Rules:
 * - Total ≤ 6.5s, skippable from 800ms
 * - prefers-reduced-motion: collapse to 600ms fade
 * - Repeat visits within 24h: only Stage 5 hand-off (300ms)
 * - sessionStorage prevents re-play within same session
 * - ?skipIntro=1 query param skips entirely
 */
export function IntroShell({ onComplete }: IntroShellProps) {
  const [stage, setStage] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const prefersReduced = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const preloadStarted = useRef(false);

  // Preload homepage data during Stage 3
  const preloadHomepage = useCallback(() => {
    if (preloadStarted.current) return;
    preloadStarted.current = true;
    fetch("/api/products?featured=1&take=12", { priority: "low" } as RequestInit).catch(() => {});
  }, []);

  const handleComplete = useCallback(() => {
    if (isComplete) return;
    setIsComplete(true);
    // Mark session as seen
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
      localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
    } catch {}
    onComplete();
  }, [isComplete, onComplete]);

  const handleSkip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    handleComplete();
  }, [handleComplete]);

  useEffect(() => {
    // Reduced motion: immediate 600ms fade then complete
    if (prefersReduced) {
      const t = setTimeout(handleComplete, 600);
      return () => clearTimeout(t);
    }

    // Stage progression timings (cumulative from start)
    const stageTimings = [0, 1200, 3000, 4200, 5600, 6400];
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Show skip button after 800ms
    timers.push(setTimeout(() => setShowSkip(true), SKIP_VISIBLE_MS));

    // Advance through stages
    for (let i = 1; i < stageTimings.length; i++) {
      timers.push(setTimeout(() => {
        setStage(i);
        // Preload during stage 3
        if (i === 3) preloadHomepage();
      }, stageTimings[i]));
    }

    // Complete after last stage
    timerRef.current = setTimeout(handleComplete, TOTAL_DURATION_MS);
    timers.push(timerRef.current);

    return () => timers.forEach(clearTimeout);
  }, [prefersReduced, handleComplete, preloadHomepage]);

  // Reduced motion: simple fade
  if (prefersReduced) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
      >
        <div className="text-white font-display text-2xl font-black">MSM</div>
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden bg-black" aria-hidden="true">
      {/* Stage backgrounds — crossfade between stages */}
      {stage <= 1 && <StageColdOpen />}
      {stage === 2 && <StageLogoReveal />}
      {stage === 3 && <StageTagline />}
      {stage === 4 && <StageStorefront />}
      {stage === 5 && <StageHandoff />}

      {/* Skip button - visible after 800ms */}
      <AnimatePresence>
        {showSkip && !isComplete && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleSkip}
            className="fixed bottom-8 right-6 z-[201] px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-caption font-bold hover:bg-white/20 transition-colors"
            aria-label="Skip intro"
          >
            Skip
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Check if intro should be shown based on session/localStorage/query params.
 */
export function shouldShowIntro(): boolean {
  // Feature flag
  if (typeof window !== "undefined") {
    const featureFlag = (window as unknown as { __NEXT_DATA__?: { props?: { pageProps?: { env?: Record<string, string> } } } }).__NEXT_DATA__?.props?.pageProps?.env;
    // Check env-based feature flag
    if (process.env.NEXT_PUBLIC_FEATURE_INTRO === "0") return false;
  }

  // Check URL params
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("skipIntro") === "1") return false;
  }

  // Check sessionStorage (already shown this session)
  try {
    if (sessionStorage.getItem(SESSION_KEY) === "1") return false;
  } catch {}

  // Check repeat visit within 24h - show only handoff
  try {
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    if (lastVisit && Date.now() - Number(lastVisit) < REPEAT_VISIT_THRESHOLD_MS) {
      return false; // Will show quick handoff via separate logic
    }
  } catch {}

  return true;
}

/**
 * Check if this is a repeat visit within 24h (show only handoff).
 */
export function isRepeatVisit(): boolean {
  try {
    if (sessionStorage.getItem(SESSION_KEY) === "1") return false;
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    if (lastVisit && Date.now() - Number(lastVisit) < REPEAT_VISIT_THRESHOLD_MS) {
      return true;
    }
  } catch {}
  return false;
}
