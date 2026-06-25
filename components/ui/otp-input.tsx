"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
}

/**
 * Enhanced OTP input component with:
 * - Individual digit boxes for clarity
 * - Auto-advance between boxes
 * - Auto-submit on complete
 * - Haptic feedback
 * - Visual shake on error
 * - Paste support
 * - Auto-read from SMS (OTP autofill)
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error,
  autoFocus = true
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [shaking, setShaking] = useState(false);

  // Shake animation on error
  useEffect(() => {
    if (error) {
      setShaking(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      const timer = setTimeout(() => setShaking(false), 600);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = useCallback((index: number, digit: string) => {
    if (disabled) return;
    const cleanDigit = digit.replace(/\D/g, "").slice(-1);
    const newValue = value.split("");
    newValue[index] = cleanDigit;
    const result = newValue.join("").slice(0, length);
    onChange(result);

    // Haptic on each digit
    if (cleanDigit && navigator.vibrate) navigator.vibrate(20);

    // Move to next input
    if (cleanDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (result.length === length && result.replace(/\D/g, "").length === length) {
      onComplete?.(result);
    }
  }, [value, length, onChange, onComplete, disabled]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newValue = value.split("");
      newValue[index - 1] = "";
      onChange(newValue.join(""));
    }
  }, [value, onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pastedData.length > 0) {
      onChange(pastedData);
      if (pastedData.length === length) {
        onComplete?.(pastedData);
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  }, [length, onChange, onComplete]);

  return (
    <div className="space-y-2">
      <motion.div
        animate={shaking ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-center gap-2"
      >
        {Array.from({ length }, (_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={value[i] ?? ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`h-14 w-11 rounded-xl border-2 text-center text-xl font-black outline-none transition-all
              ${value[i] ? "border-secondary-500 bg-secondary-50 dark:border-secondary-400 dark:bg-secondary-900/30" : "border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800"}
              ${error ? "border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-950/20" : ""}
              focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20 dark:text-white
              disabled:opacity-50
            `}
          />
        ))}
      </motion.div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

/**
 * OTP countdown timer with resend button.
 * Enforces waiting period before allowing resend.
 */
export function OtpCountdown({
  seconds,
  onResend,
  resendLoading = false
}: {
  seconds: number;
  onResend: () => void;
  resendLoading?: boolean;
}) {
  const [countdown, setCountdown] = useState(seconds);

  useEffect(() => {
    setCountdown(seconds);
  }, [seconds]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  if (countdown > 0) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" strokeWidth="2" stroke="currentColor" opacity="0.2" />
          <path
            d="M8 2a6 6 0 0 1 6 6"
            strokeWidth="2"
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>
        <span className="font-bold">Resend in {countdown}s</span>
      </div>
    );
  }

  return (
    <button
      onClick={onResend}
      disabled={resendLoading}
      className="text-sm font-bold text-secondary-600 hover:text-secondary-700 disabled:opacity-50 dark:text-secondary-400"
    >
      {resendLoading ? "Sending..." : "Resend OTP"}
    </button>
  );
}
