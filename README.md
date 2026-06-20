# Grocery Ordering Website

Production-ready, white-label grocery ordering PWA. Deploy for any supermarket in minutes.

## Stack

- Next.js 15, TypeScript, Tailwind CSS, shadcn-style UI primitives
- PostgreSQL with Prisma ORM
- NextAuth credentials authentication with bcrypt password hashing
- Cloudflare R2-ready image URL support (+ any external URL including Unsplash)
- Framer Motion, Recharts, Leaflet/OpenStreetMap
- PWA manifest, offline shell, robots, sitemap, schema markup

## Quick Start (Development)

1. Copy `.env.example` to `.env` and fill in your values.
2. Install: `npm install`
3. Run migrations: `npx prisma migrate dev`
4. Seed data: `npm run seed`
5. Start: `npm run dev`

**Default admin login:** `admin@store.in` / `Admin@12345`
(Customize via `ADMIN_EMAIL` env var before seeding)

## Deploy for a New Customer

See **[docs/NEW-CUSTOMER-SETUP.md](docs/NEW-CUSTOMER-SETUP.md)** for the complete guide:
- Database setup (Neon/Supabase/Railway)
- Vercel deployment
- Store configuration (name, location, delivery radius)
- Product setup & image URLs
- Custom domain

## How Store Branding Works

All branding is **dynamic** — no code changes needed per customer:

1. **Admin Settings panel** (DB) → Primary source for store name, address, coordinates, phone, delivery rules
2. **Environment variables** → Fallback: `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_STORE_ADDRESS`
3. **Seed data** → Initial values, overridden by admin settings

## Image URLs

The system accepts **any HTTPS image URL** including:
- Unsplash page URLs: `https://unsplash.com/photos/...` (auto-converted!)
- Direct Unsplash: `https://images.unsplash.com/photo-...`
- Imgur, Cloudflare R2, or any public HTTPS image

## Folder Structure

```text
app/                 Next.js routes, API routes, admin and customer pages
components/          UI, cart, auth, checkout, map, admin components
lib/                 constants, products, validation, Prisma, distance, WhatsApp helpers
prisma/              Database schema and seed data
public/              PWA icons and service worker
docs/                Setup guides, permissions matrix
```

## Delivery Rules

The store coordinates are configured in Admin Settings (or `STORE_LAT`/`STORE_LNG` env vars as fallback). Checkout uses Haversine distance calculation and blocks submission when the customer location is more than the configured delivery radius (KM) away.
