# Flutter migration implementation prompt

Use this prompt with a coding agent that has access to this repository.

---

You are a senior Flutter and Next.js migration engineer. Inspect this repository completely before changing code. Convert the customer and delivery-partner mobile experience of this MSM Supermarket application to a production-grade Flutter app while retaining the existing Next.js 15 application as the backend API and web admin/staff portal.

Do not perform a blind visual rewrite. Preserve the existing business rules, Prisma/PostgreSQL data model, order lifecycle, role permissions, prices, GST, delivery fees, loyalty, wallet, OTP rules, delivery collection reconciliation, damage adjustments, location tracking, and audit behavior. The existing Next.js admin and staff interfaces must continue to work.

## Target architecture

- Create a new `mobile/` Flutter project for Android and iOS.
- Use the latest stable Flutter and Dart versions available in the environment.
- Use feature-first clean architecture with presentation, application/domain, and data layers without needless abstraction.
- Use Riverpod for state management and dependency injection, GoRouter for navigation, Dio for HTTP, Freezed/json_serializable for typed immutable models, and flutter_secure_storage for credentials.
- Retain Next.js route handlers and Prisma as the backend. Add versioned mobile endpoints under `/api/mobile/v1/...` where the existing browser-cookie APIs are unsuitable.
- Add short-lived access tokens plus rotating refresh tokens for Flutter. Store refresh-token hashes server-side, support revocation, device logout, expiry, and role checks. Do not embed secrets in Flutter or reuse a browser session cookie as the long-term mobile authentication design.
- Keep the web admin portal in Next.js. Flutter should cover customer onboarding/login, shopping, cart, checkout, account, orders/tracking, support, and the delivery-partner workflow.

## Delivery assignment alerts — critical requirement

Polling alone is not an acceptable final native solution. Implement Firebase Cloud Messaging end to end:

- Add a Prisma-backed device-token model keyed by user, platform, installation ID, token, and last-seen time, with token rotation and logout cleanup.
- When an admin assigns or reassigns an order, commit the database assignment first, create an idempotent assignment-alert record/event, then send an FCM high-priority data message to that exact delivery partner.
- Include `eventId`, `orderId`, `orderNumber`, `assignedAt`, and a safe deep link. Never include the delivery OTP or other secrets in push payloads.
- Keep `/api/delivery/poll` as a recovery/fallback endpoint based on server-side unacknowledged assignment state. Flutter must reconcile pending alerts at app startup, resume, login, network recovery, and periodically while foregrounded. Never use a first-poll client baseline that can swallow an assignment.
- Acknowledge an alert server-side only when the partner explicitly dismisses or opens it. Make acknowledgment idempotent and ownership-checked.
- On Android, implement an urgent delivery alarm using a high-importance notification channel, full-screen intent where OS policy permits, heads-up notification, vibration, wake behavior, and looping alarm audio until the user dismisses or opens the assignment. Add all required manifest declarations and explain Play Store policy limitations. Request exact-alarm/full-screen capabilities only if legitimately allowed; degrade gracefully when denied.
- On iOS, use time-sensitive notifications where authorized and document that continuous background sound/full-screen takeover is restricted by iOS. Use the strongest policy-compliant fallback rather than pretending parity is possible.
- In the foreground, show a full-screen Flutter assignment sheet and play looping alarm audio every three seconds until acknowledged. Manage audio focus and lifecycle correctly.
- Create a first-run “Enable delivery alerts” setup screen that verifies notification permission, exact/full-screen capability where applicable, battery optimization status, and a test alarm. Show an actionable health/status card afterward.
- Push delivery must be idempotent. Duplicate FCM delivery, polling recovery, app restarts, and token refreshes must never create duplicate active alarm screens.

## Existing features to map

Inspect and map the current implementation rather than guessing, especially:

- `app/delivery`, `components/delivery`, and `/api/delivery/*`
- cart and checkout behavior in `components/cart` and `components/checkout-form.tsx`
- customer account, wallet, loyalty, favorites, addresses, notifications, and support
- order tracking and delivery location updates
- authentication, OTP, safe redirects, permissions, validation, rate limiting, and security helpers
- Prisma schema and every relevant migration
- push subscription and notification logic

Use the existing status enums and server-confirmed money values. Do not duplicate authoritative pricing calculations in Flutter. Treat currency as decimal/minor-unit data, never binary floating point.

## Flutter UX requirements

- Match the current brand and workflows while redesigning layouts for native Material 3 behavior.
- Support light/dark themes, safe areas, keyboard behavior, accessibility labels, scalable text, empty/error/loading states, offline banners, pull-to-refresh, and retry.
- Persist the cart safely and reconcile it with current product price/stock before checkout.
- Use deep links for orders, delivery assignments, and account screens.
- Publish delivery GPS only during an active delivery and with clear permission disclosure. Throttle updates, handle background-location policy correctly, and stop tracking immediately when no longer needed.
- Never log tokens, OTPs, precise location, payment details, or sensitive customer data.

## Delivery plan

Work in verifiable phases and keep the repository runnable after each phase:

1. Audit the current web app and produce `docs/flutter-migration-map.md` listing screens, endpoints, models, auth assumptions, and feature parity status.
2. Add the versioned mobile API contract, token authentication, FCM device registration, assignment events, and tests without breaking web clients.
3. Scaffold `mobile/`, environments/flavors, networking, auth, routing, themes, model generation, error handling, and CI checks.
4. Implement customer features with widget/unit/integration tests.
5. Implement delivery workflows, FCM, fallback polling/reconciliation, foreground alarm, acknowledgment, GPS, and deep links with tests.
6. Add Firebase setup documentation using placeholder configuration files; never commit real secrets.
7. Run Prisma validation, migrations against a test database, backend lint/tests/build, Flutter analyze/test, and Android debug/release builds. Fix all introduced failures.
8. Produce `docs/flutter-release-checklist.md` covering environment variables, database migration order, Firebase/APNs setup, signing, permissions, privacy disclosures, staged rollout, monitoring, and rollback.

## Definition of done

- Web admin/staff behavior remains functional.
- Flutter customer and delivery flows reach feature parity for the agreed scope.
- A newly assigned delivery order produces a real native alert when the app is foregrounded, backgrounded, or terminated, subject to documented OS permissions and platform policy.
- A missed or duplicated push is recovered safely by server-side pending assignment reconciliation.
- Opening/dismissing an alert acknowledges only that partner’s assignment and stops the alarm.
- Automated tests cover assignment/reassignment, unauthorized acknowledgment, duplicate push, cold start, token rotation, offline recovery, and multiple pending assignments.
- No production secrets or Firebase private credentials are committed.

Before implementation, summarize the audited architecture and state any unavoidable platform limitations. Then proceed autonomously phase by phase, showing concise progress and validating each completed phase. Ask only when a product decision would materially change scope or data behavior.

