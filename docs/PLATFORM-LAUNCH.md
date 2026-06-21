# Single-store platform launch checklist

## Before deployment

- Rotate the PostgreSQL and Cloudflare R2 credentials that previously appeared in `.env.example` and invalidate the old values.
- Configure `AUTH_SECRET`, production URLs, R2/S3, WhatsApp, `WHATSAPP_APP_SECRET`, Upstash and the restricted Google Maps browser key.
- Review `prisma/migrations/20260621160000_single_store_platform/migration.sql` against a recent database snapshot.
- Run `npm run db:migrate` in staging, verify loyalty/referral backfills, then repeat against production during the launch window.
- Create delivery slots before advertising scheduled delivery.
- Configure loyalty values in Admin → Settings.
- Keep install, rewards and delivery-slot flags disabled during migration rehearsal; enable them together after staging acceptance.

## Acceptance checks

- Place simultaneous orders for the last unit of a product; exactly one must succeed.
- Fill the last place in a delivery slot; the next order must receive `DELIVERY_SLOT_FULL`.
- Verify promo codes and loyalty points cannot be redeemed twice or beyond the configured limit.
- Walk through customer approval, packing, driver assignment, live tracking, delivery OTP, points award, feedback and support reply.
- Confirm customer, Packing Staff, Manager, Delivery Partner and Owner permissions independently.
- Confirm authenticated pages never appear offline or after logout from a shared browser.
- Test Android install, iOS Add to Home Screen, service-worker upgrade and push navigation.

## Monitoring and rollback

- Watch authentication failures, rate-limit responses, checkout conflicts, notification failures, stale driver locations and slow database queries.
- Retain the pre-migration database snapshot until all acceptance checks pass.
- Disable scheduled-delivery promotion and install prompts if operational issues arise; do not roll back the database while new-model records are being written.
- The current `xlsx` package has upstream high-severity advisories with no published fix. Imports are restricted to authenticated catalogue staff, 2MB, 2,000 rows and rate limited. Replace the library or remove XLSX support in a separately approved dependency/API change.
