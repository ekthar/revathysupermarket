# MSM Supermarket Permissions Matrix

| Role | Allowed actions |
| --- | --- |
| OWNER / ADMIN | Full access: settings, staff, products, orders, returns, refunds, audit log |
| MANAGER | Orders, products, customers, returns, audit log; no settings or staff management |
| STAFF | Orders and product maintenance |
| PACKING_STAFF | Packing queue and item availability/edit requests only |
| DELIVERY_PARTNER | Own assigned orders, pickup, delivery OTP confirmation, current location update |
| CUSTOMER | Own profile, own orders, own saved addresses, own return requests |

All staff/admin API routes must use the shared authorization helpers in `lib/authz.ts`.
