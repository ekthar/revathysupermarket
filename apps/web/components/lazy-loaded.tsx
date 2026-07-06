import dynamic from "next/dynamic";

// Framer Motion - split animation library from main bundle
export const DynamicMotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false }
);

// Onboarding tour - only loaded when needed
export const DynamicOnboardingTour = dynamic(
  () => import("@/components/ui/onboarding-tour").then((mod) => mod.OnboardingTour),
  { ssr: false, loading: () => <div className="h-8" /> }
);
