// Shared spring presets for consistent animations across the app
export const springPresets = {
  // Default interaction spring (buttons, cards)
  default: { type: "spring" as const, stiffness: 300, damping: 30 },
  // Snappy spring for micro-interactions (taps, toggles)
  snappy: { type: "spring" as const, stiffness: 400, damping: 25 },
  // Gentle spring for enter/exit animations
  gentle: { type: "spring" as const, stiffness: 200, damping: 20 },
  // Bouncy spring for attention-grabbing (badges, notifications)
  bouncy: { type: "spring" as const, stiffness: 400, damping: 15 },
};

// Standard micro-interaction props
export const tapScale = {
  primary: { scale: 0.96 },    // Primary buttons (add to cart, checkout)
  secondary: { scale: 0.92 },  // Secondary buttons (nav items, cards)
  subtle: { scale: 0.98 },     // Subtle press (list items, links)
};

// Page transition variants
export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { type: "spring" as const, stiffness: 260, damping: 25, mass: 0.8 },
};
