import dynamic from "next/dynamic";

// Framer Motion - split animation library from main bundle
export const DynamicMotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false }
);

// Welcome onboarding - only loaded when needed
export const DynamicWelcomeOnboarding = dynamic(
  () => import("@/components/onboarding/welcome-onboarding").then((mod) => mod.WelcomeOnboarding),
  { ssr: false, loading: () => null }
);
