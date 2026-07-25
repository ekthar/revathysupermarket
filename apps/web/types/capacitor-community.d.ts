// Type stubs for Capacitor community plugins (only available in native shell)
// Prevents TypeScript build errors on Vercel where these packages aren't installed

declare module "@capacitor-community/in-app-review" {
  export const InAppReview: {
    requestReview(): Promise<void>;
  };
}

declare module "@capacitor-community/biometric-auth" {
  export const BiometricAuth: {
    checkBiometry(): Promise<{ isAvailable: boolean; biometryType: number }>;
    authenticate(options?: { reason?: string }): Promise<void>;
  };
}

declare module "@capacitor-community/barcode-scanner" {
  export const BarcodeScanner: {
    checkPermission(options?: { force?: boolean }): Promise<{ granted: boolean }>;
    startScan(): Promise<{ hasContent: boolean; content: string }>;
    stopScan(): Promise<void>;
  };
}
