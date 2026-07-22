/**
 * Type declarations for the global Capacitor object injected by the native shell.
 *
 * When running inside a Capacitor native app, `window.Capacitor` is available
 * with platform detection methods. These declarations provide type safety
 * instead of relying on `(window as any).Capacitor`.
 */

interface CapacitorGlobal {
  /**
   * Returns true if the app is running inside a native Capacitor shell.
   */
  isNativePlatform(): boolean;

  /**
   * Returns the current platform: 'android', 'ios', or 'web'.
   */
  getPlatform(): "android" | "ios" | "web";

  /**
   * Returns true if a specific plugin is available on the current platform.
   */
  isPluginAvailable(pluginName: string): boolean;

  /**
   * Convert a device file path to a URL that can be used in a WebView.
   */
  convertFileSrc(filePath: string): string;
}

declare global {
  interface Window {
    /**
     * The global Capacitor object, available when running inside a native shell.
     * Will be undefined when running as a standard web app.
     */
    Capacitor?: CapacitorGlobal;
  }
}

export {};
