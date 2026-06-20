# Grocery Ordering Website (White-Label)

Production-ready, white-label grocery ordering PWA. Deploy for any supermarket in minutes.

## Stack

- Next.js 15, TypeScript, Tailwind CSS, shadcn-style UI primitives
- PostgreSQL with Prisma ORM
- NextAuth credentials + Google OAuth authentication
- Cloudflare R2 image uploads (+ any external URL including Unsplash)
- Framer Motion animations, PWA with offline support
- Per-product GST billing, WhatsApp notifications

## Quick Start

1. Copy `.env.example` to `.env` and fill in values.
2. `npm install`
3. `npx prisma migrate dev`
4. `npm run seed`
5. `npm run dev`

**Default admin login:** `admin@store.in` / `Admin@12345`
(Customize via `ADMIN_EMAIL` env var before seeding)

## How Branding Works

All branding is **100% dynamic** — no code changes per customer:
- **Admin Settings panel (DB)** → Primary source for name, address, coordinates, phone, delivery rules
- **Environment variables** → Fallback: `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_STORE_ADDRESS`, `STORE_LAT`, `STORE_LNG`

## Image Support

Accepts **any HTTPS image URL**:
- Unsplash page URLs: `https://unsplash.com/photos/...` (auto-converted to direct image!)
- Direct image URLs from any host
- File uploads via Cloudflare R2

## Folder Structure

```
app/          Next.js routes, API routes, admin and customer pages
components/   UI, cart, auth, checkout, map, admin components
lib/          constants, products, validation, Prisma, distance, billing
prisma/       Database schema, migrations, seed data
public/       PWA icons and service worker
```
