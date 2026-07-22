"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { springs, tapScale } from "@/lib/motion";
import { haptic } from "@/lib/haptics";
import {
  createVoiceSearch,
  isVoiceSearchSupported,
  type VoiceSearchState,
} from "@/lib/voice-search";

/**
 * VoiceSearchButton — microphone input for hands-free product search.
 *
 * Shows a mic icon button. When tapped:
 * 1. Requests microphone permission (if not granted)
 * 2. Shows listening state with animated rings
 * 3. Streams interim transcription to the search input
 * 4. Auto-stops after silence, submits final transcript
 *
 * Hidden on unsupported browsers (Firefox).
 * Designed for: user is cooking and needs to search for "tomatoes" hands-free.
 */
export function VoiceSearchButton({
  onTranscript,
  onFinalResult,
}: {
  /** Called with interim transcript (updates in real-time while speaking) */
  onTranscript: (text: string) => void;
  /** Called with final confirmed transcript (after silence / stop) */
  onFinalResult: (text: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<VoiceSearchState>("idle");
  const voiceRef = useRef<ReturnType<typeof createVoiceSearch> | null>(null);

  // Check support on mount
  useEffect(() => {
    setSupported(isVoiceSearchSupported());
  }, []);

  const handleToggle = useCallback(() => {
    if (state === "listening") {
      // Stop listening
      voiceRef.current?.stop();
      setState("idle");
      return;
    }

    // Start listening
    haptic("medium");

    voiceRef.current = createVoiceSearch({
      onResult: (result) => {
        onTranscript(result.transcript);
        if (result.isFinal) {
          onFinalResult(result.transcript);
        }
      },
      onStateChange: setState,
      onError: (error) => {
        console.warn("Voice search error:", error);
        // Reset after 2s
        setTimeout(() => setState("idle"), 2000);
      },
    });

    voiceRef.current.start();
  }, [state, onTranscript, onFinalResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { voiceRef.current?.stop(); };
  }, []);

  // Don't render on unsupported browsers
  if (!supported) return null;

  const isListening = state === "listening";

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      whileTap={tapScale.subtle}
      transition={springs.tap}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors press ${
        isListening
          ? "bg-red-500 text-white"
          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
      }`}
      aria-label={isListening ? "Stop listening" : "Voice search"}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}

      {/* Listening animation — pulsing rings */}
      <AnimatePresence>
        {isListening && (
          <>
            <motion.span
              key="ring1"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-red-400"
            />
            <motion.span
              key="ring2"
              initial={{ scale: 1, opacity: 0.3 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
              className="absolute inset-0 rounded-full border-2 border-red-400"
            />
          </>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
