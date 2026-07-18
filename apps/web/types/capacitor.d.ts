/**
 * Global type declarations for Capacitor native bridge.
 * Eliminates `(window as any).Capacitor` pattern.
 */
interface CapacitorGlobal {
  isNativePlatform(): boolean;
  getPlatform(): "android" | "ios" | "web";
  isPluginAvailable(name: string): boolean;
}

interface Window {
  Capacitor?: CapacitorGlobal;
}
