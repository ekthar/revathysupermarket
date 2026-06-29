import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    screens: {
      xs: "360px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px"
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#050505",
          foreground: "#FFFFFF",
          50: "#F7F7F6",
          100: "#EDEDEC",
          200: "#D4D4D2",
          300: "#B0B0AD",
          400: "#8A8A86",
          500: "#6B6B67",
          600: "#525250",
          700: "#3D3D3B",
          800: "#272726",
          900: "#050505"
        },
        secondary: {
          DEFAULT: "#22C55E",
          foreground: "#FFFFFF",
          50: "#EDFCF2",
          100: "#D3F9E0",
          200: "#AAF0C4",
          300: "#73E3A2",
          400: "#3BCD7A",
          500: "#22C55E",
          600: "#12A347",
          700: "#0F823A",
          800: "#106630",
          900: "#0E5429"
        },
        success: {
          DEFAULT: "#22C55E",
          foreground: "#FFFFFF",
          100: "#DCFCE7",
          300: "#86EFAC",
          500: "#16A34A",
          700: "#166534"
        },
        semantic: {
          error: {
            100: "#FEE2E2",
            300: "#FCA5A5",
            500: "#EF4444",
            700: "#B91C1C"
          },
          warning: {
            100: "#FEF3C7",
            300: "#FCD34D",
            500: "#F59E0B",
            700: "#B45309"
          },
          info: {
            100: "#DBEAFE",
            300: "#93C5FD",
            500: "#3B82F6",
            700: "#1D4ED8"
          }
        },
        neutral: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
          950: "#030712"
        },
        lime: {
          fresh: "#A7D129"
        },
        berry: {
          50: "#FFF1F4",
          100: "#FFE0E8",
          600: "#C0265A",
          700: "#9F1D4B"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      fontSize: {
        display: ["32px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "900" }],
        heading: ["24px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        title: ["20px", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "700" }],
        body: ["14px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "500" }],
        caption: ["12px", { lineHeight: "1.4", letterSpacing: "0", fontWeight: "500" }],
        micro: ["10px", { lineHeight: "1.3", letterSpacing: "0", fontWeight: "500" }]
      },
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", '"SF Pro Text"', "system-ui", "sans-serif"],
        display: ["var(--font-display)", "-apple-system", "BlinkMacSystemFont", '"SF Pro Display"', "system-ui", "sans-serif"]
      },
      boxShadow: {
        "elevation-1": "0 1px 3px rgba(5, 5, 5, 0.04), 0 4px 12px rgba(5, 5, 5, 0.06)",
        "elevation-2": "0 4px 16px rgba(5, 5, 5, 0.08), 0 12px 32px rgba(5, 5, 5, 0.10)",
        "elevation-3": "0 8px 24px rgba(5, 5, 5, 0.12), 0 24px 64px rgba(5, 5, 5, 0.18)",
        premium: "0 24px 80px -42px rgba(5, 5, 5, 0.65)",
        soft: "0 18px 45px -30px rgba(5, 5, 5, 0.35)"
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "20px",
        xl: "28px",
        "2xl": "1.5rem",
        full: "9999px"
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
