/**
 * Native Camera — take photos or pick from gallery via Capacitor Camera plugin.
 *
 * Used for:
 * - Profile picture capture/selection
 * - Proof-of-delivery photos (delivery app)
 * - Product images (admin)
 *
 * Falls back to standard file input on web.
 *
 * Usage:
 *   import { takePhoto, pickFromGallery } from "@/lib/native-camera";
 *
 *   const photo = await takePhoto();
 *   if (photo) uploadProfilePicture(photo.dataUrl);
 */

import { isNative } from "@/lib/native-bridge";

export interface CapturedPhoto {
  /** Base64 data URL (data:image/jpeg;base64,...) */
  dataUrl: string;
  /** File path on device (native only, may be empty on web) */
  path?: string;
  /** Image format */
  format: "jpeg" | "png";
  /** Width in pixels (if available) */
  width?: number;
  /** Height in pixels (if available) */
  height?: number;
}

export interface CameraOptions {
  /** Image quality (0-100). Default: 80 */
  quality?: number;
  /** Max width in pixels. Images will be resized if larger. Default: 1024 */
  maxWidth?: number;
  /** Max height in pixels. Default: 1024 */
  maxHeight?: number;
  /** Whether to allow editing/cropping before returning. Default: true */
  allowEditing?: boolean;
}

/**
 * Take a photo using the device camera.
 * Returns null if cancelled or unavailable.
 */
export async function takePhoto(options?: CameraOptions): Promise<CapturedPhoto | null> {
  if (!isNative) {
    return pickViaFileInput("camera");
  }

  try {
    // @ts-ignore — only available in Capacitor native shell
    const { Camera, CameraResultType, CameraSource } = await import(
      /* webpackIgnore: true */ "@capacitor/camera"
    );

    const image = await Camera.getPhoto({
      quality: options?.quality ?? 80,
      width: options?.maxWidth ?? 1024,
      height: options?.maxHeight ?? 1024,
      allowEditing: options?.allowEditing ?? true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      correctOrientation: true,
    });

    if (!image.dataUrl) return null;

    return {
      dataUrl: image.dataUrl,
      path: image.path,
      format: image.format === "png" ? "png" : "jpeg",
    };
  } catch {
    // User cancelled or camera unavailable
    return null;
  }
}

/**
 * Pick a photo from the device gallery/photo library.
 * Returns null if cancelled or unavailable.
 */
export async function pickFromGallery(options?: CameraOptions): Promise<CapturedPhoto | null> {
  if (!isNative) {
    return pickViaFileInput("gallery");
  }

  try {
    // @ts-ignore — only available in Capacitor native shell
    const { Camera, CameraResultType, CameraSource } = await import(
      /* webpackIgnore: true */ "@capacitor/camera"
    );

    const image = await Camera.getPhoto({
      quality: options?.quality ?? 80,
      width: options?.maxWidth ?? 1024,
      height: options?.maxHeight ?? 1024,
      allowEditing: options?.allowEditing ?? true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      correctOrientation: true,
    });

    if (!image.dataUrl) return null;

    return {
      dataUrl: image.dataUrl,
      path: image.path,
      format: image.format === "png" ? "png" : "jpeg",
    };
  } catch {
    // User cancelled
    return null;
  }
}

/**
 * Show a picker: camera or gallery choice.
 * On native, shows the system action sheet (Camera / Photo Library).
 * On web, opens file picker directly.
 */
export async function pickOrCapture(options?: CameraOptions): Promise<CapturedPhoto | null> {
  if (!isNative) {
    return pickViaFileInput("any");
  }

  try {
    // @ts-ignore — only available in Capacitor native shell
    const { Camera, CameraResultType, CameraSource } = await import(
      /* webpackIgnore: true */ "@capacitor/camera"
    );

    const image = await Camera.getPhoto({
      quality: options?.quality ?? 80,
      width: options?.maxWidth ?? 1024,
      height: options?.maxHeight ?? 1024,
      allowEditing: options?.allowEditing ?? true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // Shows Camera/Gallery action sheet
      correctOrientation: true,
      promptLabelPhoto: "Photo Library",
      promptLabelPicture: "Take Photo",
    });

    if (!image.dataUrl) return null;

    return {
      dataUrl: image.dataUrl,
      path: image.path,
      format: image.format === "png" ? "png" : "jpeg",
    };
  } catch {
    return null;
  }
}

// ─── Web Fallback ────────────────────────────────────────────────────────────

function pickViaFileInput(source: "camera" | "gallery" | "any"): Promise<CapturedPhoto | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    if (source === "camera") {
      input.capture = "environment";
    }

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          dataUrl: reader.result as string,
          format: file.type.includes("png") ? "png" : "jpeg",
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };

    // Handle cancel (input never fires change event)
    input.oncancel = () => resolve(null);

    input.click();
  });
}
