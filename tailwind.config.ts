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
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#0F8A5F",
          foreground: "#FFFFFF"
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
      fontFamily: {
        sans: ['"Inter Tight"', "-apple-system", "BlinkMacSystemFont", '"SF Pro Text"', "system-ui", "sans-serif"],
        display: ['"Manrope"', "-apple-system", "BlinkMacSystemFont", '"SF Pro Display"', "system-ui", "sans-serif"]
      },
      boxShadow: {
        premium: "0 20px 70px -35px rgba(15, 138, 95, 0.55)",
        soft: "0 18px 45px -30px rgba(30, 41, 59, 0.4)"
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem"
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
