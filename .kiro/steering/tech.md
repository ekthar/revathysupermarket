# Tech Stack

## Monorepo Setup

- **Build system**: Turborepo v2.5+
- **Package manager**: npm 10.8.0 (npm workspaces)
- **Workspaces**: `apps/*`, `packages/*`
- **React version**: 19.1.0 (pinned via root overrides)

## Web App (`apps/web` — @msm/web)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5 (App Router) |
| Auth | NextAuth v5 beta + Prisma adapter + Google OAuth + Firebase Auth (mobile) |
| Database | PostgreSQL via Prisma 6 (Neon serverless adapter) |
| Caching | Upstash Redis (rate limiting + caching) |
| UI | Tailwind CSS 3, Radix UI, shadcn/ui, Framer Motion, Lucide icons |
| Data fetching | TanStack React Query v5, Server Actions |
| i18n | next-intl |
| Maps | MapLibre GL |
| Storage | Cloudflare R2 (AWS S3 SDK) |
| Push | Web Push + Firebase Cloud Messaging |
| Charts | Recharts |
| Validation | Zod |
| Deployment | Vercel |

## Mobile Apps (Expo/React Native)

All three mobile apps share the same base stack:

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54, React Native 0.81 |
| Router | expo-router (file-based routing) |
| Styling | NativeWind v4 (Tailwind for RN) |
| State | Zustand |
| HTTP | Axios |
| Auth | expo-secure-store, expo-auth-session |
| Location | expo-location, expo-task-manager |
| Build | EAS Build |

App-specific additions:
- **mobile-customer**: react-native-maps, expo-notifications
- **mobile-delivery**: expo-notifications, expo-location (background)
- **mobile-staff**: @maplibre/maplibre-react-native, @react-native-firebase/messaging, Notifee

## Shared Package (`packages/shared` — @msm/shared)

TypeScript library exporting types, Zod schemas, constants, and branding config. Consumed by all apps.

## TWA (`apps/twa`)

Android Trusted Web Activity — Gradle/Kotlin wrapper around the PWA for Play Store distribution.

## Infrastructure

- PostgreSQL (Neon serverless)
- Upstash Redis
- Cloudflare R2 (file/image storage)
- Firebase (FCM push to mobile apps)
- Vercel (web hosting)
- EAS (mobile CI/CD)

## Common Commands

```bash
# Root-level (Turborepo)
npm run dev              # Start all apps
npm run dev:web          # Web app only
npm run dev:customer     # Customer mobile
npm run dev:delivery     # Delivery mobile
npm run dev:staff        # Staff mobile
npm run build            # Build all
npm run build:web        # Build web only
npm run lint             # Lint all

# Web app (run from apps/web)
npm run dev              # next dev
npm run build            # prisma generate && next build
npm test                 # Unit tests (tsx --test)
npm run test:ui          # Playwright E2E tests
npm run test:lighthouse  # Lighthouse CI
npm run seed             # Seed database
npm run seed:flags       # Seed feature flags
npm run prisma:migrate   # prisma migrate dev
npm run prisma:generate  # prisma generate

# Mobile apps (run from respective app dir)
npx expo start           # Dev server
npx expo run:android     # Native Android build
npx expo run:ios         # Native iOS build
npx expo prebuild        # Generate native projects
```

## Key Environment Variables

Configured in `turbo.json` globalPassThroughEnv:
- `DATABASE_URL` / `DIRECT_DATABASE_URL` — PostgreSQL connection
- `AUTH_SECRET` / `NEXTAUTH_SECRET` — NextAuth signing
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — Redis
- `CLOUDFLARE_R2_*` — Object storage
- `FIREBASE_*` / `NEXT_PUBLIC_FIREBASE_*` — Push notifications
- `STORE_LAT` / `STORE_LNG` — Store coordinates
- `NEXT_PUBLIC_STORE_NAME` / `NEXT_PUBLIC_SITE_URL` — Branding
