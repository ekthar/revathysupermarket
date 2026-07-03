# Project Structure

```
revathysupermarket/
├── apps/
│   ├── web/                    # Next.js 15 web application (main backend + frontend)
│   │   ├── app/                # App Router pages and API routes
│   │   │   ├── api/            # REST API routes (consumed by mobile apps)
│   │   │   ├── admin/          # Admin dashboard pages
│   │   │   ├── staff/          # Staff dashboard pages
│   │   │   ├── delivery/       # Delivery partner pages
│   │   │   ├── account/        # Customer account pages
│   │   │   ├── cart/           # Shopping cart
│   │   │   ├── checkout/       # Checkout flow
│   │   │   ├── products/       # Product browsing
│   │   │   ├── track/          # Order tracking
│   │   │   └── ...
│   │   ├── components/         # React components
│   │   │   ├── ui/             # shadcn/ui base components
│   │   │   ├── admin/          # Admin-specific components
│   │   │   ├── cart/           # Cart components
│   │   │   ├── checkout/       # Checkout components
│   │   │   ├── delivery/       # Delivery components
│   │   │   ├── home/           # Homepage components
│   │   │   └── ...
│   │   ├── lib/                # Shared utilities and business logic
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── queries/        # TanStack Query definitions
│   │   │   ├── realtime/       # Real-time/SSE utilities
│   │   │   ├── prisma.ts       # Prisma client singleton
│   │   │   ├── feature-flags.ts
│   │   │   ├── delivery.ts     # Delivery logic
│   │   │   ├── loyalty.ts      # Loyalty system
│   │   │   └── ...
│   │   ├── prisma/             # Database schema and migrations
│   │   │   ├── schema.prisma   # Main schema (40+ models)
│   │   │   ├── migrations/     # SQL migrations
│   │   │   ├── seed.ts         # Database seeder
│   │   │   └── seed-flags.ts   # Feature flag seeder
│   │   ├── i18n/               # Internationalization config
│   │   ├── tests/              # Unit and E2E tests
│   │   ├── types/              # TypeScript type definitions
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── middleware.ts       # Next.js middleware (auth, i18n)
│   │   └── ...
│   │
│   ├── mobile-customer/        # Expo customer app
│   │   ├── app/                # expo-router screens
│   │   │   ├── (auth)/         # Auth screens (login/register)
│   │   │   ├── (tabs)/         # Tab navigator (home, categories, orders)
│   │   │   ├── account/        # Account management
│   │   │   ├── checkout/       # Checkout flow
│   │   │   ├── orders/         # Order history/tracking
│   │   │   └── product/        # Product detail
│   │   └── src/
│   │       ├── components/     # Shared RN components
│   │       ├── services/       # API service layer (Axios)
│   │       ├── stores/         # Zustand stores
│   │       ├── config/         # App configuration
│   │       └── theme/          # Theme constants
│   │
│   ├── mobile-delivery/        # Expo delivery partner app
│   │   ├── app/                # expo-router screens
│   │   └── src/                # Same structure as mobile-customer
│   │
│   ├── mobile-staff/           # Expo staff/admin app
│   │   ├── app/                # expo-router screens
│   │   └── src/                # Same structure as mobile-customer
│   │
│   └── twa/                    # Android TWA (Trusted Web Activity)
│       └── (Gradle/Kotlin project)
│
├── packages/
│   └── shared/                 # @msm/shared — shared TypeScript library
│       └── src/
│           ├── types/          # Shared TypeScript interfaces/types
│           ├── schemas/        # Shared Zod validation schemas
│           ├── constants/      # Shared constants (enums, config values)
│           └── utils/          # Shared utility functions
│
├── branding/                   # Brand assets (logos, colors)
├── docs/                       # Project documentation
├── scripts/                    # Root-level build/deploy scripts
├── turbo.json                  # Turborepo pipeline config
└── package.json                # Root workspace config
```

## Conventions

- **Web routes**: Next.js App Router file-based routing. API routes under `app/api/`.
- **Mobile routes**: expo-router file-based routing with layout groups (e.g., `(tabs)`, `(auth)`).
- **Components**: Co-located by domain in `components/{domain}/`. Base UI primitives in `components/ui/`.
- **Business logic**: Lives in `lib/` as standalone modules (one concern per file).
- **Database**: Single Prisma schema in `apps/web/prisma/schema.prisma`. All apps hit the web API — no direct DB access from mobile.
- **Shared code**: Cross-app types, schemas, and constants go in `packages/shared`. Import via `@msm/shared`, `@msm/shared/types`, `@msm/shared/schemas`, or `@msm/shared/constants`.
- **State management**: Web uses TanStack React Query for server state. Mobile uses Zustand for client state + Axios for API calls.
- **Styling**: Tailwind CSS everywhere — standard Tailwind in web, NativeWind in mobile apps. shadcn/ui as component base in web.
