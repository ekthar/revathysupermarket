# Branding Assets

This directory is the **single source of truth** for the app's logo and branding.

## How to update the logo

1. Replace the files in this directory:
   - `logo-light.svg` — Logo for light backgrounds (dark-colored logo)
   - `logo-dark.svg` — Logo for dark backgrounds (light-colored logo)
   - `logo-icon.svg` — Square icon version (used for app icons, favicons)

2. Run the generation script:
   ```bash
   pnpm run generate:icons
   ```

3. This will automatically update:
   - `apps/web/public/icons/` — PWA icons (192, 512, maskable-512, apple-touch-icon)
   - `apps/web/app/favicon.ico` — Browser favicon
   - `apps/mobile-customer/assets/images/` — App icon, adaptive icon, splash, notification icon
   - `apps/mobile-delivery/assets/images/` — Same as above for delivery app

4. Commit and deploy. The logo will be applied everywhere:
   - Web header (light & dark mode)
   - PWA install icon
   - Mobile app icon (home screen)
   - Splash screens
   - Login/onboarding screens
   - Admin panel
   - Notification icons

## Logo requirements

| File | Purpose | Recommended Size |
|------|---------|-----------------|
| `logo-light.svg` | Full logo on light backgrounds | Any (vector) |
| `logo-dark.svg` | Full logo on dark backgrounds | Any (vector) |
| `logo-icon.svg` | Square icon (app icon, favicon) | 1:1 aspect ratio |
| `logo-icon-light.png` | Raster icon for light mode (fallback) | 512x512px |
| `logo-icon-dark.png` | Raster icon for dark mode (fallback) | 512x512px |

## Color scheme

The brand colors are defined in:
- `apps/web/tailwind.config.ts` → `theme.extend.colors.primary`
- `apps/web/app/manifest.ts` → `theme_color` and `background_color`
- `apps/mobile-customer/app.json` → `splash.backgroundColor`

Update all three when changing brand colors.
