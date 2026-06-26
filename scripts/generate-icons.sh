#!/bin/bash
# generate-icons.sh
# =================
# Generates all app icons, PWA icons, and favicons from the branding source SVGs.
#
# Prerequisites:
#   - Inkscape (for SVG → PNG): brew install inkscape / apt install inkscape
#   - ImageMagick (for ICO): brew install imagemagick / apt install imagemagick
#
# Usage:
#   pnpm run generate:icons
#   # or directly:
#   bash scripts/generate-icons.sh

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BRANDING_DIR="$ROOT_DIR/branding"
WEB_ICONS_DIR="$ROOT_DIR/apps/web/public/icons"
WEB_BRANDING_DIR="$ROOT_DIR/apps/web/public/branding"
MOBILE_CUSTOMER_ASSETS="$ROOT_DIR/apps/mobile-customer/assets/images"
MOBILE_DELIVERY_ASSETS="$ROOT_DIR/apps/mobile-delivery/assets/images"
FAVICON_DIR="$ROOT_DIR/apps/web/app"

ICON_SVG="$BRANDING_DIR/logo-icon.svg"
LIGHT_SVG="$BRANDING_DIR/logo-light.svg"
DARK_SVG="$BRANDING_DIR/logo-dark.svg"

echo "🎨 Generating icons from branding source..."
echo "   Source: $BRANDING_DIR"
echo ""

# Check for Inkscape
if ! command -v inkscape &> /dev/null; then
  echo "⚠️  Inkscape not found. Install it:"
  echo "   macOS: brew install inkscape"
  echo "   Linux: sudo apt install inkscape"
  echo ""
  echo "   Alternatively, manually export PNGs from the SVGs at required sizes."
  echo "   Required outputs:"
  echo "   - $WEB_ICONS_DIR/icon-192.png (192x192)"
  echo "   - $WEB_ICONS_DIR/icon-512.png (512x512)"
  echo "   - $WEB_ICONS_DIR/icon-maskable-512.png (512x512, extra padding)"
  echo "   - $WEB_ICONS_DIR/apple-touch-icon.png (180x180)"
  echo "   - $MOBILE_CUSTOMER_ASSETS/icon.png (1024x1024)"
  echo "   - $MOBILE_CUSTOMER_ASSETS/adaptive-icon.png (1024x1024)"
  echo "   - $MOBILE_CUSTOMER_ASSETS/splash-icon.png (200x200)"
  echo "   - $MOBILE_CUSTOMER_ASSETS/notification-icon.png (96x96)"
  exit 1
fi

# Generate Web PWA icons
echo "📱 Generating web PWA icons..."
inkscape "$ICON_SVG" --export-type=png --export-filename="$WEB_ICONS_DIR/icon-192.png" -w 192 -h 192
inkscape "$ICON_SVG" --export-type=png --export-filename="$WEB_ICONS_DIR/icon-512.png" -w 512 -h 512
inkscape "$ICON_SVG" --export-type=png --export-filename="$WEB_ICONS_DIR/icon-maskable-512.png" -w 512 -h 512
inkscape "$ICON_SVG" --export-type=png --export-filename="$WEB_ICONS_DIR/apple-touch-icon.png" -w 180 -h 180

# Generate favicon
echo "🌐 Generating favicon..."
if command -v convert &> /dev/null; then
  inkscape "$ICON_SVG" --export-type=png --export-filename="/tmp/favicon-32.png" -w 32 -h 32
  inkscape "$ICON_SVG" --export-type=png --export-filename="/tmp/favicon-16.png" -w 16 -h 16
  convert /tmp/favicon-16.png /tmp/favicon-32.png "$FAVICON_DIR/favicon.ico"
  rm -f /tmp/favicon-16.png /tmp/favicon-32.png
else
  echo "   ⚠️ ImageMagick not found. Skipping favicon.ico generation."
fi

# Generate mobile customer app icons
echo "📲 Generating mobile customer icons..."
inkscape "$ICON_SVG" --export-type=png --export-filename="$MOBILE_CUSTOMER_ASSETS/icon.png" -w 1024 -h 1024
inkscape "$ICON_SVG" --export-type=png --export-filename="$MOBILE_CUSTOMER_ASSETS/adaptive-icon.png" -w 1024 -h 1024
inkscape "$ICON_SVG" --export-type=png --export-filename="$MOBILE_CUSTOMER_ASSETS/splash-icon.png" -w 200 -h 200
inkscape "$ICON_SVG" --export-type=png --export-filename="$MOBILE_CUSTOMER_ASSETS/notification-icon.png" -w 96 -h 96

# Generate mobile delivery app icons
echo "🚚 Generating mobile delivery icons..."
inkscape "$ICON_SVG" --export-type=png --export-filename="$MOBILE_DELIVERY_ASSETS/icon.png" -w 1024 -h 1024
inkscape "$ICON_SVG" --export-type=png --export-filename="$MOBILE_DELIVERY_ASSETS/adaptive-icon.png" -w 1024 -h 1024
inkscape "$ICON_SVG" --export-type=png --export-filename="$MOBILE_DELIVERY_ASSETS/splash-icon.png" -w 200 -h 200
inkscape "$ICON_SVG" --export-type=png --export-filename="$MOBILE_DELIVERY_ASSETS/notification-icon.png" -w 96 -h 96

# Copy SVGs to web public for runtime use
echo "📋 Copying SVGs to web public..."
mkdir -p "$WEB_BRANDING_DIR"
cp "$LIGHT_SVG" "$WEB_BRANDING_DIR/logo-light.svg"
cp "$DARK_SVG" "$WEB_BRANDING_DIR/logo-dark.svg"
cp "$ICON_SVG" "$WEB_BRANDING_DIR/logo-icon.svg"

echo ""
echo "✅ Done! All icons generated from branding source."
echo ""
echo "Files updated:"
echo "  - apps/web/public/icons/ (PWA icons)"
echo "  - apps/web/public/branding/ (SVG logos)"
echo "  - apps/web/app/favicon.ico"
echo "  - apps/mobile-customer/assets/images/ (app icons)"
echo "  - apps/mobile-delivery/assets/images/ (app icons)"
echo ""
echo "Next steps:"
echo "  1. Commit the changes"
echo "  2. For mobile: run 'expo prebuild' to regenerate native projects"
echo "  3. Deploy"
