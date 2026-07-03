# Product: MSM Supermarket

A full-stack grocery delivery and management platform for a single-store supermarket (Revathy Supermarket). The system supports:

- **Customer ordering** — Browse products, add to cart, checkout with multiple payment methods, track delivery in real-time
- **Delivery management** — Assign delivery partners, GPS tracking, delivery collections, ETA estimation
- **Staff operations** — Order packing, inventory management, customer support tickets
- **Admin dashboard** — Product/category management, order oversight, reports, feature flags, promo codes, loyalty programs
- **Multi-channel** — Web (PWA), Android/iOS customer app, delivery partner app, staff app, TWA (Android PWA wrapper)

Key domain concepts: Orders follow a lifecycle (received → packing → ready → out for delivery → delivered), loyalty points system, wallet/UPI/COD payments, scheduled and ASAP delivery slots, support tickets, return/refund flows, feature flags for gradual rollouts.

The store is a single physical location with a defined delivery radius. All mobile apps communicate with the Next.js web backend via API routes.
