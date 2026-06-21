import sharp from "sharp";
import { fileURLToPath } from "node:url";

const source = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#0F8A5F"/><path d="M164 208h184l-16 188H180l-16-188Z" fill="#fff"/><path d="M208 220v-40c0-27 21-48 48-48s48 21 48 48v40" fill="none" stroke="#fff" stroke-width="28" stroke-linecap="round"/><path d="M216 278h80M216 326h80" stroke="#0F8A5F" stroke-width="20" stroke-linecap="round"/></svg>`);
const output = new URL("../public/icons/", import.meta.url);

await Promise.all([
  sharp(source).resize(192, 192).png().toFile(fileURLToPath(new URL("icon-192.png", output))),
  sharp(source).resize(512, 512).png().toFile(fileURLToPath(new URL("icon-512.png", output))),
  sharp(source).resize(410, 410, { fit: "contain" }).extend({ top: 51, bottom: 51, left: 51, right: 51, background: "#0f8a5f" }).png().toFile(fileURLToPath(new URL("icon-maskable-512.png", output))),
  sharp(source).resize(180, 180).png().toFile(fileURLToPath(new URL("apple-touch-icon.png", output)))
]);
