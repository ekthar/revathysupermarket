"use client";

/**
 * Voice Search — Web Speech API integration for hands-free product search.
 *
 * Uses the SpeechRecognition API (Chrome, Safari, Edge) to transcribe
 * spoken queries into text for the search input.
 *
 * Common use case: user is cooking and needs to quickly search for an
 * ingredient without washing/drying hands to type.
 *
 * Features:
 * - Streaming transcription (interim results update in real-time)
 * - Auto-stops after silence (no manual stop needed)
 * - Language: en-IN (Indian English for better grocery term recognition)
 * - Graceful fallback: returns { supported: false } on unsupported browsers
 *
 * Browser support:
 * - Chrome 33+ (SpeechRecognition)
 * - Safari 14.1+ (webkitSpeechRecognition)
 * - Edge 79+ (SpeechRecognition)
 * - Firefox: NOT supported (no SpeechRecognition API)
 */

export type VoiceSearchState = "idle" | "listening" | "processing" | "error";

export type VoiceSearchResult = {
  transcript: string;
  isFinal: boolean;
  confidence: number;
};

export type VoiceSearchCallbacks = {
  onResult: (result: VoiceSearchResult) => void;
  onStateChange: (state: VoiceSearchState) => void;
  onError?: (error: string) => void;
};

/**
 * Check if voice search (Web Speech API) is supported in this browser.
 */
export function isVoiceSearchSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

/**
 * Create a voice search session.
 *
 * Returns start/stop controls. Call start() to begin listening,
 * stop() to manually end. The session auto-stops after ~3s of silence.
 *
 * @param callbacks - onResult (streaming), onStateChange, onError
 * @returns { start, stop, isSupported }
 */
export function createVoiceSearch(callbacks: VoiceSearchCallbacks) {
  const { onResult, onStateChange, onError } = callbacks;

  if (!isVoiceSearchSupported()) {
    return {
      start: () => { onError?.("Voice search is not supported in this browser."); },
      stop: () => {},
      isSupported: false,
    };
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognition();

  // Configuration
  recognition.continuous = false; // Stop after one phrase (grocery item names are short)
  recognition.interimResults = true; // Stream partial results
  recognition.lang = "en-IN"; // Indian English for better local product name recognition
  recognition.maxAlternatives = 1;

  // Event handlers
  recognition.onstart = () => {
    onStateChange("listening");
  };

  recognition.onresult = (event: any) => {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript;
    const isFinal = result.isFinal;
    const confidence = result[0].confidence;

    onResult({ transcript, isFinal, confidence });

    if (isFinal) {
      onStateChange("idle");
    }
  };

  recognition.onerror = (event: any) => {
    const errorMap: Record<string, string> = {
      "not-allowed": "Microphone access denied. Please allow microphone permission.",
      "no-speech": "No speech detected. Try again.",
      "audio-capture": "No microphone found. Check your device.",
      "network": "Network error. Check your connection.",
      "aborted": "", // User cancelled — not an error
    };

    const message = errorMap[event.error] || `Speech recognition error: ${event.error}`;
    if (message) onError?.(message);
    onStateChange("error");
  };

  recognition.onend = () => {
    // Ensure state is set to idle when recognition ends (silence timeout)
    onStateChange("idle");
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (err: any) {
        // Already started — ignore
        if (err?.message?.includes("already started")) return;
        onError?.("Could not start voice recognition.");
        onStateChange("error");
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // Not started — ignore
      }
    },
    isSupported: true,
  };
}
