# MSM Supermarket Website

Production-ready grocery ordering website for MSM Supermarket, Kerala.

## Stack

- Next.js 15, TypeScript, Tailwind CSS, shadcn-style UI primitives
- PostgreSQL with Prisma ORM
- NextAuth credentials authentication with bcrypt password hashing
- Cloudflare R2-ready image URL support
- Framer Motion, Recharts, Leaflet/OpenStreetMap
- PWA manifest, offline shell, robots, sitemap, schema markup

## Local Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_SITE_URL`.
3. Install dependencies with `npm install`.
4. Run `npx prisma migrate dev`.
5. Seed sample data with `npm run seed`.
6. Start development with `npm run dev`.

Admin seed login:

- Email: `admin@msmsupermarket.in`
- Password: `Admin@12345`

## Delivery Rules

The store coordinates are configured in `lib/constants.ts`. Checkout uses Haversine distance calculation and blocks submission when the customer location is more than 5 KM away.

## Deployment To Vercel

1. Create a PostgreSQL database.
2. Add all variables from `.env.example` to Vercel Project Settings.
3. Connect the repository to Vercel.
4. Use the default build command: `npm run build`.
5. Run Prisma migrations against production before the first launch.
6. Configure Cloudflare R2 public URLs for product and banner images.

## Folder Structure

```text
app/                 Next.js routes, API routes, admin and customer pages
components/          UI, cart, auth, checkout, map, admin components
lib/                 constants, products, validation, Prisma, distance, WhatsApp helpers
prisma/              Database schema and seed data
public/              PWA icons and service worker
types/               NextAuth type augmentation
```
