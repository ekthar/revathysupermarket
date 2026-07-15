# Revathy Supermarket — Comprehensive System Rewrite Plan

> Generated: July 15, 2026
> Scope: Full-stack audit findings + admin panel rewrite + system hardening

---

## Executive Summary

| Area | Current Score | Target | Key Problem |
|------|-------------|--------|-------------|
| **Admin Panel UI/UX** | 6.5/10 | 9/10 | No shared layout primitives, inconsistent patterns, no pagination |
| **Customer UI/UX** | 8/10 | 9.5/10 | Touch targets, client-side waterfalls, a11y gaps |
| **Business Logic** | 8/10 | 9/10 | Uncached DB calls, mobile/web duplication, auth inconsistency |
| **Database/Migrations** | 5/10 | 9/10 | 28 migrations in 19 days, no planning, no squash |
| **Overall Architecture** | 7.5/10 | 9/10 | Missing service layer, no unified abstractions |

---

## Part 1: Why So Many Migrations?

### Root Cause: No upfront schema design

**28 migrations in 19 days** because:

1. **"Ship and discover" pattern** — Schema started with 10 tables, grew to 38 through iterative additions. 5 migrations landed in a single day (June 17).
2. **Single-column patches** — 6 migrations add just 1-2 columns each (arrived_at, bill_number, category_icon, etc.)
3. **Same-feature splits** — GST was split across 2 same-day migrations instead of one.
4. **Performance afterthoughts** — Indexes added in separate migrations rather than with table creation.
5. **No squash** — The migration folder is a full history of every incremental decision.

### Fix Plan

| Action | Priority | Effort |
|--------|----------|--------|
| Squash all 28 migrations into 1 clean `init` | HIGH | 1 day |
| Create a schema design document for future features | HIGH | 2 hours |
| Establish rule: 1 migration per feature branch, not per column | HIGH | Process |
| Add indexes in the same migration as table creation | MEDIUM | Process |

---

## Part 2: Admin Panel — Complete Rewrite Plan

### Current State (28 routes, 43 components, 6.5/10)

**Critical Issues:**
- No shared layout primitives (3 different header patterns)
- No pagination on any list
- No error boundaries (only 1 of 28 routes)
- No breadcrumbs for nested routes
- Massive monolithic components (37KB settings, 36KB orders)
- Mixed auth guard patterns (3 systems co-existing)
- No loading states for sub-routes
- No bulk actions, no global search, no keyboard shortcuts

### Rewrite Architecture

```
components/admin/
├── layout/                  ← NEW: Shared layout primitives
│   ├── AdminPageShell.tsx      Page wrapper (header + breadcrumbs + content)
│   ├── AdminPageHeader.tsx     Gradient header with title/description/actions
│   ├── AdminBreadcrumbs.tsx    Auto-generated from route segments
│   ├── AdminEmptyState.tsx     Reusable empty state with icon/title/action
│   ├── AdminAccessDenied.tsx   Unified permission denied UI
│   └── AdminErrorBoundary.tsx  Shared error boundary component
│
├── data/                    ← NEW: Shared data display
│   ├── AdminDataTable.tsx      Sortable columns, pagination, bulk select
│   ├── AdminPagination.tsx     Cursor-based pagination controls
│   ├── AdminFilters.tsx        Reusable filter bar (search, date, status)
│   ├── AdminBulkActions.tsx    Action bar for selected items
│   └── AdminExport.tsx         CSV/Excel export button
│
├── feedback/                ← NEW: Shared feedback patterns
│   ├── AdminConfirmDialog.tsx  Destructive action confirmation
│   ├── AdminToast.tsx          Success/error toast with undo
│   └── AdminLoadingSkeleton.tsx Consistent skeleton patterns
│
├── {domain}/                ← EXISTING: Domain-specific components
│   ├── orders/
│   ├── products/
│   ├── customers/
│   └── ...
```

### Phase 1: Foundation (Week 1-2)

| Task | Details | Effort |
|------|---------|--------|
| Create `AdminPageShell` | Wraps every page with consistent header, breadcrumbs, and content area | 4h |
| Create `AdminDataTable` | Sortable, paginated, filterable table with row selection | 8h |
| Create `AdminPagination` | Cursor-based with page size selector | 3h |
| Create `AdminEmptyState` | Icon + title + description + optional action button | 2h |
| Create `AdminAccessDenied` | Single permission denied UI replacing 3 patterns | 1h |
| Create `AdminErrorBoundary` | Add to every admin route group | 3h |
| Create `AdminBreadcrumbs` | Auto-infer from route path + configurable labels | 3h |
| Add `loading.tsx` to all sub-routes | At minimum: orders/[id], reports/*, customers/[id] | 2h |
| **Subtotal** | | **~26h** |

### Phase 2: Page Migrations (Week 2-4)

Migrate each page to use the new primitives:

| Page | Key Changes | Effort |
|------|-------------|--------|
| `/admin` (Dashboard) | Split 28KB monolithic component into widgets, add role-based views | 6h |
| `/admin/orders` | Replace custom card list with `AdminDataTable` + pagination + bulk status update | 8h |
| `/admin/orders/[id]` | Add breadcrumbs, add error boundary, split into sub-components | 4h |
| `/admin/products` | `AdminDataTable` + bulk actions (activate/deactivate) + pagination | 6h |
| `/admin/categories` | Lightweight — add `AdminPageShell`, fix header | 2h |
| `/admin/customers` | `AdminDataTable` + pagination + search + export | 4h |
| `/admin/staff` | `AdminDataTable` + role management improvements | 3h |
| `/admin/settings` | Split 37KB monolithic → tabbed sections (store, delivery, payments, loyalty, flags) | 8h |
| `/admin/reports/*` | Consistent layout, pagination on data, export buttons | 6h |
| `/admin/collections` | `AdminDataTable` + pagination | 3h |
| `/admin/feedback` | Add filters (rating, date), pagination | 2h |
| `/admin/offers` + `/admin/promo-codes` | Merge UI pattern, add bulk actions | 4h |
| Other pages (slots, pricing, notifications, etc.) | Apply `AdminPageShell` wrapper | 4h |
| **Subtotal** | | **~60h** |

### Phase 3: New Features (Week 4-5)

| Feature | Details | Effort |
|---------|---------|--------|
| **Global Command Palette** (Cmd+K) | Search orders by number, customers by name, jump to any page | 6h |
| **Keyboard shortcuts** | N = new, E = edit, / = search, ← → = pagination | 4h |
| **Activity feed / notifications panel** | Persistent notification center (not just toasts) | 6h |
| **Role-based dashboard** | Packing staff sees order queue, admin sees revenue charts | 4h |
| **Bulk actions** | Multi-select → update status / delete / export | 4h |
| **Dark mode toggle** | Visible in admin header, persisted | 2h |
| **Responsive data views** | Card view (mobile) ↔ Table view (desktop) toggle | 4h |
| **Subtotal** | | **~30h** |

### Admin Rewrite Total: ~116 hours (3-4 weeks at full-time pace)

---

## Part 3: Customer UI/UX Fixes

### Critical (Fix Immediately)

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 1 | 5 images with `alt=""` | Add product name as alt text | 30m |
| 2 | Cart buttons 28px (below 44px min) | Increase to `w-11 h-11` or add padding for hit area | 1h |
| 3 | Checkout accessible with empty cart | Add redirect guard in checkout page.tsx | 30m |

### High Priority (This Sprint)

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 4 | Recent Orders client-side fetch waterfall | Move to server-fetch in page.tsx, pass as prop | 2h |
| 5 | 60 products serialized to client | Compute category counts server-side | 1h |
| 6 | FloatingCartBar hidden on all /products/* | Only hide on /products/[slug] detail pages | 30m |
| 7 | `min-h-screen` → `min-h-[100dvh]` | Find and replace across 7 files | 30m |
| 8 | Leaflet CSS loaded globally | Dynamic import only in map-using components | 1h |

### Medium Priority (Next Sprint)

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 9 | Double padding on products page | Remove outer `px-4` | 15m |
| 10 | Promo input lacks form wrapper | Wrap in `<form>` for Enter-to-submit | 15m |
| 11 | Store config fetched client-side on every cart visit | Server-fetch or SWR with staleTime | 1h |
| 12 | No scroll-snap on promo carousel | Add `snap-x snap-mandatory` to container | 30m |
| 13 | Add aria-live to cart subtotal | `<span aria-live="polite">` wrapper | 15m |
| 14 | Add aria-roledescription to carousel slides | Per ARIA carousel pattern | 30m |

---

## Part 4: Business Logic Hardening

### Critical Fixes

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 1 | `createDeliveryOtp()` uses `Math.random()` | Replace with `crypto.randomInt(1000, 9999)` | 15m |
| 2 | 6 sequential feature flag DB queries in checkout | Create `getMultipleFlags(keys[])` batch function | 2h |
| 3 | OTP send endpoint lacks distributed rate limiting | Apply Redis rate limiter (same as login) | 1h |

### High Priority

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 4 | No max quantity validation in checkout | Add `.max(100)` to item quantity in Zod schema | 15m |
| 5 | Loyalty config uncached | Wrap `getLoyaltyConfig()` with `unstable_cache` (60s TTL) | 30m |
| 6 | Delivery fee slabs uncached | Add 60s TTL cache to slab query | 30m |
| 7 | Mobile/web route duplication (~50 routes) | Extract service layer → call from both | 16h |

### Medium Priority

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 8 | 3 auth guard systems co-existing | Migrate all to `requirePermission()` | 4h |
| 9 | Duplicate `isWithinDeliveryRange`/`isWithinDeliveryRadius` | Delete one, update imports | 30m |
| 10 | Delivery radius dual source of truth (constant vs DB) | Remove hardcoded constant, always use DB setting | 30m |
| 11 | Dead `price` field in checkout schema | Remove from Zod schema + frontend payload | 30m |
| 12 | `console.warn` at module load in rate-limit.ts | Wrap in conditional check | 15m |

---

## Part 5: Database Cleanup

| # | Action | Details | Effort |
|---|--------|---------|--------|
| 1 | **Squash migrations** | Delete all 28, create fresh `init` from current schema | 2h |
| 2 | **Schema documentation** | Create `docs/database-schema.md` with model descriptions | 3h |
| 3 | **Index audit** | Verify all foreign keys and filter columns are indexed | 2h |
| 4 | **Remove dead code** | `maxPrice` filter, unused product fields | 1h |
| 5 | **Establish migration policy** | 1 migration per feature branch, review before merge | Process |

---

## Part 6: Architecture Improvements

### Service Layer Introduction

```typescript
// lib/services/order-service.ts
export class OrderService {
  static async getById(id: string, userId?: string) { ... }
  static async create(data: CheckoutInput, session: Session) { ... }
  static async updateStatus(id: string, status: OrderStatus, actor: User) { ... }
  static async cancel(id: string, reason: string, actor: User) { ... }
}
```

**Benefits:**
- Mobile & web routes call the same functions
- Business logic testable in isolation
- Single place for audit logging
- Transaction boundaries clearly defined

### Caching Strategy

| Data | TTL | Invalidation |
|------|-----|-------------|
| Feature flags | 30s | On flag update |
| Loyalty config | 60s | On settings save |
| Store settings | 120s | On settings save |
| Delivery slabs | 300s | On slab update |
| Categories list | 60s | On category change |
| Product counts | 30s | On order/stock change |

### Unified Response Helpers

```typescript
// lib/api-response.ts
export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
export function error(message: string, status = 400, code?: string) {
  return NextResponse.json({ success: false, error: message, code }, { status });
}
```

---

## Implementation Timeline

```
Week 1:  Database squash + Admin foundation components + Critical bug fixes
Week 2:  Admin page migrations (orders, products, customers, dashboard)
Week 3:  Admin page migrations (settings, reports, remaining) + Customer UI fixes
Week 4:  New admin features (Cmd+K, bulk actions, role-based views)
Week 5:  Service layer extraction + Business logic hardening + Caching
Week 6:  Testing, polish, dark mode, responsive improvements, performance audit
```

### Estimated Total Effort

| Area | Hours |
|------|-------|
| Admin panel rewrite | 116h |
| Customer UI fixes | 12h |
| Business logic hardening | 26h |
| Database cleanup | 8h |
| Architecture (service layer, caching, response helpers) | 24h |
| Testing & polish | 16h |
| **Total** | **~202 hours** |

---

## Priority Order (If Time-Constrained)

If you can only do one thing at a time:

1. **Week 1** — Fix critical bugs (security OTP, a11y, touch targets) + squash migrations
2. **Week 2** — Build admin shared components + migrate orders/products pages
3. **Week 3** — Complete admin migration + batch feature flag reads + add caching
4. **Week 4** — Service layer for top 5 routes + new admin features
5. **Week 5-6** — Remaining items + testing + polish

---

## Definition of Done

A page is "done" when it has:
- [ ] Uses `AdminPageShell` with header + breadcrumbs
- [ ] Has error boundary
- [ ] Has loading state
- [ ] Has empty state
- [ ] Has pagination (if list view)
- [ ] Has bulk actions (if applicable)
- [ ] Touch targets ≥ 44px
- [ ] Proper `aria-` attributes
- [ ] Works on mobile (responsive)
- [ ] Permissions checked with `requirePermission()`
- [ ] No monolithic component > 500 lines
