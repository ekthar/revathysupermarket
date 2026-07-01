/**
 * Shared Typography components for mobile-staff app.
 * Provides consistent text sizing matching the web app's design tokens.
 *
 * Scale:
 *   Display:  32px / bold
 *   Heading:  24px / bold
 *   Title:    20px / bold
 *   Body:     14px / medium
 *   Caption:  12px / medium
 *   Micro:    10px / medium
 */

import { Text, type TextProps } from "react-native";

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  color?: "primary" | "secondary" | "muted" | "error" | "success" | "white";
}

const COLOR_MAP: Record<string, string> = {
  primary: "text-slate-900 dark:text-white",
  secondary: "text-slate-600 dark:text-slate-300",
  muted: "text-slate-500 dark:text-slate-400",
  error: "text-red-600 dark:text-red-400",
  success: "text-emerald-700 dark:text-emerald-400",
  white: "text-white",
};

export function Display({ children, color = "primary", className = "", ...props }: TypographyProps & { className?: string }) {
  return (
    <Text className={`text-[32px] font-bold leading-tight tracking-tight ${COLOR_MAP[color]} ${className}`} {...props}>
      {children}
    </Text>
  );
}

export function Heading({ children, color = "primary", className = "", ...props }: TypographyProps & { className?: string }) {
  return (
    <Text className={`text-2xl font-bold ${COLOR_MAP[color]} ${className}`} {...props}>
      {children}
    </Text>
  );
}

export function Title({ children, color = "primary", className = "", ...props }: TypographyProps & { className?: string }) {
  return (
    <Text className={`text-xl font-bold ${COLOR_MAP[color]} ${className}`} {...props}>
      {children}
    </Text>
  );
}

export function Body({ children, color = "primary", className = "", ...props }: TypographyProps & { className?: string }) {
  return (
    <Text className={`text-sm font-medium ${COLOR_MAP[color]} ${className}`} {...props}>
      {children}
    </Text>
  );
}

export function Caption({ children, color = "muted", className = "", ...props }: TypographyProps & { className?: string }) {
  return (
    <Text className={`text-xs font-medium ${COLOR_MAP[color]} ${className}`} {...props}>
      {children}
    </Text>
  );
}

export function Micro({ children, color = "muted", className = "", ...props }: TypographyProps & { className?: string }) {
  return (
    <Text className={`text-[10px] font-medium ${COLOR_MAP[color]} ${className}`} {...props}>
      {children}
    </Text>
  );
}
