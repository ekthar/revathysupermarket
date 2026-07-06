export function haptic(type: "light" | "medium" | "heavy" = "light") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const durations = { light: 5, medium: 10, heavy: 20 };
    navigator.vibrate(durations[type]);
  }
}
