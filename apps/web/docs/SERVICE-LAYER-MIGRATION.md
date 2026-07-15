# Service Layer Migration Guide

## Goal

Deduplicate business logic between **web routes** (Server Actions / RSC) and **mobile API routes** (`app/api/…`). Both should call the same service — never inline Prisma queries in route handlers.

## Pattern

### Before (inline Prisma in route)

```ts
// app/api/mobile/delivery/collections/route.ts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get('partnerId');
  const page = Number(searchParams.get('page') ?? '1');

  const collections = await prisma.deliveryCollection.findMany({
    where: { partnerId: partnerId ?? undefined },
    include: { order: { select: { orderNumber: true } } },
    skip: (page - 1) * 20,
    take: 20,
  });

  return NextResponse.json({ collections });
}
```

### After (service call in route)

```ts
// app/api/mobile/delivery/collections/route.ts
import { DeliveryService } from '@/lib/services';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get('partnerId') ?? undefined;
  const page = Number(searchParams.get('page') ?? '1');

  const result = await DeliveryService.getCollections({ partnerId, page });
  return NextResponse.json(result);
}
```

The route handler becomes a thin auth + validation + serialization shell.

## Service Coverage Map

| Service | Covers Mobile Routes |
|---------|---------------------|
| `OrderService` | `/api/mobile/orders/*`, `/api/mobile/staff/orders/*` |
| `ProductService` | `/api/mobile/products/*`, `/api/mobile/categories/*` |
| `CustomerService` | `/api/mobile/customer/*`, `/api/mobile/addresses/*`, `/api/mobile/favorites/*` |
| `SettingsService` | `/api/mobile/settings/*`, `/api/mobile/feature-flags/*` |
| `DeliveryService` | `/api/mobile/delivery/*`, `/api/mobile/staff/delivery/*` |
| `ReportService` | `/api/mobile/admin/reports/*` |
| `MarketingService` | `/api/mobile/offers/*`, `/api/mobile/promo-codes/*`, `/api/mobile/admin/push/*` |

## Migration Checklist (per route)

1. **Identify** the route handler and its inline Prisma queries.
2. **Find** the matching service method (see table above) — or create one if missing.
3. **Replace** inline queries with the service call.
4. **Keep** auth checks (`getServerSession` / token validation) in the route.
5. **Keep** request validation (Zod parsing, param extraction) in the route.
6. **Remove** the Prisma import from the route file (unless still needed for edge cases).
7. **Test** both the mobile route and any web pages that also use the service.

## Rules

- Services live in `lib/services/` and use `import { prisma } from '@/lib/prisma'`.
- Services are **stateless static classes** — no instantiation, no constructor DI.
- Services throw typed errors (e.g. `OrderServiceError`) with `code` and `statusCode`.
- Route handlers catch service errors and map them to HTTP responses.
- Services must **not** access `NextRequest`, `cookies`, or `headers` — they are transport-agnostic.
- Decimal fields from Prisma are always converted to `number` inside the service before returning.

## Adding a New Service

1. Create `lib/services/{domain}-service.ts`.
2. Define return types as exported interfaces at the top.
3. Create a custom error class extending `Error` with `code` and `statusCode`.
4. Implement static methods with try/catch wrapping.
5. Export from `lib/services/index.ts`.
