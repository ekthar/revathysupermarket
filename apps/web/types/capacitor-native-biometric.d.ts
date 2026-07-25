// Type stub for capacitor-native-biometric (only available in native Capacitor shell)
// This prevents TypeScript build errors on Vercel where the package isn't installed
declare module "capacitor-native-biometric" {
  export const NativeBiometric: {
    isAvailable(): Promise<{ isAvailable: boolean; biometryType?: number }>;
    verifyIdentity(options: {
      reason?: string;
      title?: string;
      subtitle?: string;
      description?: string;
      useFallback?: boolean;
      maxAttempts?: number;
    }): Promise<void>;
    setCredentials(options: { server: string; username: string; password: string }): Promise<void>;
    getCredentials(options: { server: string }): Promise<{ username: string; password: string }>;
    deleteCredentials(options: { server: string }): Promise<void>;
  };
  export const BiometryType: {
    FACE_ID: number;
    TOUCH_ID: number;
    FINGERPRINT: number;
    FACE_AUTHENTICATION: number;
    IRIS_AUTHENTICATION: number;
  };
}
