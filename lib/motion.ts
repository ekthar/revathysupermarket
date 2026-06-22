export const motionTransition = {
  type: "spring" as const,
  stiffness: 320,
  damping: 30,
  mass: 0.75
};

export const quickFade = {
  duration: 0.16,
  ease: [0.22, 1, 0.36, 1] as const
};

export const pressScale = 0.97;
