# Product Design Engineering Audit — revathysupermarket

Reviewer scope: customer web app + admin panel (`apps/web`), and Expo/React
Native staff/delivery/customer apps. Every finding pairs the current state with
a concrete named replacement, a technical reason, and repro steps.

Severity: **P0** broken/blocking · **P1** causes real user/admin error · **P2** Apple-review polish.

---

## 1. Design System Consistency

### [P1] Shadow tokens duplicated by ~10 ad-hoc CSS shadow classes
- **File(s):** `apps/web/tailwind.config.ts` (boxShadow: elevation-1/2/3, premium, soft), `apps/web/app/globals.css` (`.card-shadow`, `.card-shadow-lg`, `.card-elevated`, `.card-green-glass`, `.ios-squircle-card`, `.admin-card`, `.glass-card`, `.floating-cart-bar`)
- **Current state:** Two parallel elevation systems exist — the Tailwind `shadow-elevation-*` tokens and a set of hand-written `box-shadow` values in globals.css, each with its own dark-mode override.
- **Instead of X, use Y:** Instead of per-class `box-shadow` literals in globals.css, express every elevation as one of the five `boxShadow` tokens (`shadow-elevation-1/2/3`, `shadow-premium`, `shadow-soft`) and delete the CSS duplicates; where a class must stay, set its shadow to `theme('boxShadow.elevation-2')` via `@apply`.
- **Why:** Two sources of truth for elevation means a change to the shadow language must be made in N places and dark-mode drift is guaranteed (already visible: `.card-elevated` is defined twice).
- **Repro / how to see it:** Compare a product card (`shadow-soft` via `Card`) against an `.admin-card` and an `.ios-squircle-card` in the same light mode — three different shadow ramps for the same "raised surface" role.
- **Effort:** M

### [P1] Sibling form controls use different corner radii
- **File(s):** `apps/web/components/ui/input.tsx` (`rounded-xl`), `apps/web/components/ui/button.tsx` (`rounded-2xl`), `apps/web/components/ui/card.tsx` (`rounded-2xl`)
- **Current state:** In the Tailwind config `xl = 28px` and `2xl = 24px`, so `Input` (rounded-xl = 28px) is more rounded than the `Button` (rounded-2xl = 24px) it sits next to in every form.
- **Instead of X, use Y:** Instead of `rounded-xl` on `Input`, use `rounded-2xl` so inputs and buttons share the 24px control radius; reserve `xl (28px)` for containers only.
- **Why:** `xl` being numerically larger than `2xl` is a config inversion that makes radius intent non-obvious; matching control radii is what makes a form read as one component.
- **Repro / how to see it:** Any create/edit form (e.g. category create) — the input's corners are visibly rounder than the submit button's.
- **Effort:** S

### [P1] Hardcoded `bg-white` / slate colors patched by a global dark-mode safety net
- **File(s):** `apps/web/app/globals.css` (`.dark .bg-white:not(.stay-light){…}`, `.dark .text-slate-900:not(.stay-light){…}` block), plus consumers such as `apps/web/components/admin/feature-flag-settings.tsx`
- **Current state:** Many components use raw `bg-white`/`bg-slate-*`/`text-slate-*`; a global override in globals.css rewrites those utilities in dark mode, with a `:not(.stay-light)` opt-out.
- **Instead of X, use Y:** Instead of raw `bg-white`/`text-slate-900`, use the semantic tokens already defined (`bg-card`, `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`) and delete the override block.
- **Why:** The override is a runtime CSS specificity hack that breaks the moment a component legitimately wants white in dark mode (hence the `stay-light` escape hatch); semantic tokens theme correctly without global rewrites.
- **Repro / how to see it:** Toggle dark mode on the admin feature-flags page — cards are white via the override, not via a token, so any new white element renders wrong until someone remembers the utility.
- **Effort:** L

### [P2] Parallel typography definition competes with the fontSize scale
- **File(s):** `apps/web/tailwind.config.ts` (fontSize: display/heading/title/body/caption/micro), `apps/web/app/globals.css` (`.section-title` hardcodes `font-family: "Manrope"`, `font-weight: 900`, `1.5rem`/`2rem`)
- **Current state:** Section headers can be styled either via the `text-heading`/`text-display` tokens or via `.section-title`, which hardcodes a font family not wired to the `--font-display` variable.
- **Instead of X, use Y:** Instead of `.section-title`, use `text-heading md:text-display font-display` so headers inherit the token font stack and letter-spacing.
- **Why:** `.section-title` names a raw `"Manrope"` family; if the display font variable changes, these headers silently diverge from the rest of the type ramp.
- **Repro / how to see it:** Compare a homepage `.section-title` with an admin `font-display text-4xl` heading — different weight/tracking for the same hierarchy level.
- **Effort:** S

---

## 2. Motion & Animation

### [P1] No shared spring tokens — inconsistent physics for the same interaction class
- **File(s):** `apps/web/components/product-card.tsx` (press/quantity springs stiffness 400–500), `apps/web/components/ui/page-transition.tsx` (260–300), `apps/web/components/ui/animated-section.tsx` (200–260), `apps/web/components/mobile-bottom-nav.tsx` (380), `apps/web/components/tracking/live-order-banner.tsx` (300)
- **Current state:** Spring configs are inline literals spanning stiffness 100/200/260/300/380/400/500 and damping 15–32, with no shared definitions.
- **Instead of X, use Y:** Instead of inline `{ type: "spring", stiffness, damping }` literals, import from a single `apps/web/lib/motion.ts` exposing named presets (`springs.press`, `springs.enter`, `springs.overlay`, `springs.layout`) and reference those everywhere.
- **Why:** "Press feedback" currently feels different on a product card (400/20) versus the bottom-nav indicator (380/32); a token set makes the feel a single decision instead of dozens.
- **Repro / how to see it:** Tap the add-to-cart stepper vs. switch bottom-nav tabs — the settle timing differs for two "quick tactile" interactions.
- **Effort:** M

### [P2] Per-mount `<style>` injection in the delivery map
- **File(s):** `apps/web/components/tracking/delivery-map.tsx` (creates a `<style>` in `document.head` inside the init effect)
- **Current state:** The map component appends a keyframes `<style>` node on mount and removes it on unmount.
- **Instead of X, use Y:** Instead of runtime `<style>` injection, move `@keyframes map-pulse`/`rider-pulse` into `globals.css` alongside the existing keyframes.
- **Why:** Injecting global CSS from a component is a side effect that duplicates on fast remounts and bypasses the stylesheet's cascade ordering.
- **Repro / how to see it:** Navigate in/out of a live-tracking screen repeatedly and inspect `<head>` for churn.
- **Effort:** S

> Note: the mobile `SlideToConfirm` snap-back bug (thumb reverting because `maxX`
> was computed against a stale default width) is **already fixed** in
> `apps/mobile-staff/src/components/SlideToConfirm.tsx` — gesture rendering is
> gated on `onLayout` and `maxX` is a shared value. No action needed.

---

## 3. Maps

### [P1] Delivery tracking map uses a neon palette that doesn't match the brand
- **File(s):** `apps/web/components/tracking/delivery-map.tsx` (`NEON_CYAN #22d3ee`, `NEON_MAGENTA #f472b6`, `NEON_AMBER #fbbf24`, `#0b1220` base)
- **Current state:** Reliability is sound (CartoDB Dark Matter **raster** tiles, no vector glyph/sprite/worker fetches), but the marker/route palette is a cyan/magenta/amber "cyberspace" theme used nowhere else in the app.
- **Instead of X, use Y:** Instead of the neon triad, use brand tokens — rider marker/route in `secondary #22C55E`, customer/home marker in `primary #050505`, store marker in `lime-fresh #A7D129` — keeping the CartoDB raster basemap.
- **Why:** The app's language is black + fresh-green minimalism; the neon map breaks brand continuity the instant a customer opens tracking.
- **Repro / how to see it:** Open any order in `OUT_FOR_DELIVERY` state on `/track/[id]`.
- **Effort:** M *(color-token swap only; palette is a defensible design change — confirm brand intent before shipping.)*

### [P2] Two map technologies for overlapping purposes
- **File(s):** Google Maps `iframe` embeds in `apps/web/components/location-map.tsx` and `apps/web/components/dashboard/order-tracking-map.tsx`; MapLibre GL in `store-location-picker.tsx`, `checkout/pin-on-map-picker.tsx`, `tracking/delivery-map.tsx`
- **Current state:** Static/location views use Google iframes while interactive views use MapLibre + raster tiles.
- **Instead of X, use Y:** Instead of Google `iframe` embeds for the static store map, render a non-interactive MapLibre raster map (or a static raster image) so there is one map stack and one visual style.
- **Why:** Two stacks means two CSP surfaces, two visual languages, and Google's iframe chrome (its own controls/branding) clashing with the custom MapLibre UI.
- **Repro / how to see it:** Compare the store `LocationMap` (Google chrome) with the checkout pin picker (custom MapLibre chrome).
- **Effort:** M

### [P2] Verify CSP covers the raster tile hosts
- **File(s):** `apps/web/next.config.ts` / middleware CSP (tile hosts `*.tile.openstreetmap.org`, `*.basemaps.cartocdn.com`)
- **Current state:** Raster tiles are loaded as images from OSM and CartoDB CDNs.
- **Instead of X, use Y:** Instead of relying on an unrestricted `img-src`, explicitly allowlist `https://*.tile.openstreetmap.org` and `https://*.basemaps.cartocdn.com` in `img-src` (and `connect-src` for the OSRM proxy `/api/route/road`).
- **Why:** A future tightening of CSP would silently blank the maps; explicit allowlisting documents the dependency.
- **Effort:** S

---

## 4. Admin Panel UX

### [P1] Feature-flag config fallback renders structured values as free-text
- **File(s):** `apps/web/components/admin/feature-flag-settings.tsx` (`SmartConfigFlagCard`, the `hints ? … : Object.entries(config).map(...)` branch)
- **Current state:** Any config-bearing flag **not** listed in `CONFIG_HINTS` falls back to a bare `type={typeof cfgValue === "number" ? "number" : "text"}` input; enum-like string values would be typed by hand. (All current flags have hints, so this is latent, not live.)
- **Instead of X, use Y:** Instead of the free-text fallback, require a `CONFIG_HINTS` entry for every config-bearing flag and render "unknown config" read-only with a "define a control" warning, so a new enum flag can never ship as a text box.
- **Why:** Free-text for an enum invites typos that the server stores verbatim (e.g. `mode: "nearset"`), silently disabling the feature.
- **Repro / how to see it:** Add a flag with `config: { mode: "x" }` and no `CONFIG_HINTS` entry — it renders a text input.
- **Effort:** S

### [P2] Multiple product-management surfaces
- **File(s):** `apps/web/components/admin/admin-products-client.tsx`, `admin-products-page-client.tsx`, `product-management-form.tsx`, `product-spreadsheet-manager.tsx`, `product-import-export.tsx`
- **Current state:** Five components touch product CRUD (inline edit, form, spreadsheet, import/export).
- **Instead of X, use Y:** Instead of parallel edit surfaces, designate `product-management-form.tsx` as the single edit authority and have the spreadsheet/import paths funnel through the same server action/validation.
- **Why:** Divergent write paths drift in validation rules; a field required in the form but optional in the spreadsheet importer is a data-quality bug waiting to happen.
- **Repro / how to see it:** Compare required-field handling between `product-management-form` and `product-spreadsheet-manager`.
- **Effort:** L *(needs product decision on which surface is canonical — flagged, not auto-implemented.)*

---

## 5. Notifications / Toasts / Transient UI

### [P1] Feature-flags page uses a bespoke top-right banner instead of the app toaster
- **File(s):** `apps/web/components/admin/feature-flag-settings.tsx` (`showToast` local state + `fixed top-4 right-4` div), vs. app standard `apps/web/components/ui/sonner-toaster.tsx` (Sonner, bottom-center pill) and `apps/web/components/toast-provider.tsx`
- **Current state:** This one screen renders its own `useState` toast with `setTimeout(…, 3000)` anchored top-right, while the rest of the app uses Sonner bottom-center via `useToast()`.
- **Instead of X, use Y:** Instead of the local `toast` state + fixed div, call `useToast().showToast(msg, tone)` (or `sonner`'s `toast.success/error`) and delete the bespoke banner.
- **Why:** Two toast systems mean different position, timing, dismiss behavior, and screen-reader announcement; Sonner already handles a11y and swipe-dismiss.
- **Repro / how to see it:** Toggle a flag — a top-right banner appears; toggle a category elsewhere — a bottom-center pill appears.
- **Effort:** S

---

## 6. Forms & Validation

### [P1] Create/edit forms validate on submit only
- **File(s):** `apps/web/components/admin/category-management-client.tsx` (`handleCreate`/`handleEdit` check `name` only at submit), and the same pattern in product/offer forms
- **Current state:** Validation fires after the user presses submit; empty/invalid fields aren't surfaced on blur or change.
- **Instead of X, use Y:** Instead of imperative submit-time checks, adopt the existing `zod` schemas with a resolver on blur/change (mirror the server `schema` in `app/api/admin/categories/route.ts`), showing inline `field-error` (already styled in globals.css).
- **Why:** Submit-only validation forces a round trip to learn a name is too short (server requires `min(2)`, client only checks non-empty), producing an error toast for something catchable inline.
- **Repro / how to see it:** Enter a 1-char category name — client accepts it, server 400s, user sees a toast instead of an inline field error.
- **Effort:** M

### [P2] Case/variant category names can collide on slug and 500
- **File(s):** `apps/web/app/api/admin/categories/route.ts` (uniqueness check is on `name`; `slug = slugify(name)`)
- **Current state:** The 409 guard checks exact `name`, but two different names can slugify to the same slug (e.g. "Fresh Fruits" vs "fresh-fruits"), and the `slug` unique constraint would then throw an unhandled 500.
- **Instead of X, use Y:** Instead of guarding only on `name`, also `findUnique({ where: { slug } })` (or catch Prisma `P2002`) and return the same 409 "already exists".
- **Why:** A duplicate should be a clean 409, never a 500.
- **Repro / how to see it:** Create "Fresh Fruits", then create "fresh fruits".
- **Effort:** S

---

## 7. Accessibility & Responsive

### [P1] Toggle switches have no accessible name
- **File(s):** `apps/web/components/admin/feature-flag-settings.tsx` (every `<input type="checkbox" class="sr-only peer">` toggle)
- **Current state:** The visual switch is a styled `div`; the real control is an `sr-only` checkbox with no `aria-label`, so screen readers announce an unlabeled checkbox.
- **Instead of X, use Y:** Instead of a bare checkbox, add `aria-label={meta.label}` (and `role="switch"`) to each toggle input.
- **Why:** Owners managing flags with assistive tech can't tell which switch they're on.
- **Repro / how to see it:** Tab through the feature-flags page with VoiceOver — toggles read as "checkbox" with no name.
- **Effort:** S

### [P2] Sub-40px tap targets
- **File(s):** `apps/web/components/admin/category-management-client.tsx` (sort buttons `h-6 w-6` = 24px), feature-flag toggles (`w-11 h-6` = 44×24, 24px tall)
- **Current state:** Several interactive controls are below the 40–44px WCAG 2.5.8 target on touch.
- **Instead of X, use Y:** Instead of `h-6 w-6`, wrap icon buttons in the existing `.touch-target` utility (min 44×44 on coarse pointers) while keeping the visual glyph small.
- **Why:** 24px targets cause mis-taps on mobile admin use.
- **Repro / how to see it:** On a phone, try reordering categories with the up/down arrows.
- **Effort:** S

---

## 8. Data Integrity / Silent Failures

### [P0] Runtime feature-flag reads default to OFF when a row is missing
- **File(s):** `apps/web/lib/feature-flags.ts` (`isFeatureEnabled` returns `flag?.enabled ?? false`), canonical defaults in `apps/web/prisma/feature-flags.ts`, self-heal only in `apps/web/app/admin/settings/page.tsx`
- **Current state:** `isFeatureEnabled(key)` returns `false` whenever the DB row is absent. `seedFeatureFlags` self-heals, but only when an admin loads the settings page — not on runtime reads by checkout, tracking, notifications, etc.
- **Instead of X, use Y:** Instead of `?? false`, fall back to the canonical default from the `featureFlags` array in `prisma/feature-flags.ts` (build a `key → {enabled, config}` map), so a flag that was never seeded (e.g. a freshly added `whatsapp_enabled`) behaves per its designed default instead of silently OFF.
- **Why:** In production, a forgotten `seed:flags` run turns off COD, live tracking, reviews, etc. with no error — the classic "seed never re-ran" silent failure.
- **Repro / how to see it:** Delete the `cod_enabled` row and load checkout — COD disappears with no warning.
- **Effort:** S

### [P1] Mobile alert/card screens hardcode light backgrounds
- **File(s):** `apps/mobile-staff/app/alert/[eventId].tsx`, `apps/mobile-staff/app/alert/packing/[eventId].tsx` (`className="bg-white rounded-3xl"`)
- **Current state:** Full-screen alert cards are fixed `bg-white`, unaffected by the app's dark scheme.
- **Instead of X, use Y:** Instead of `bg-white`, use `bg-white dark:bg-slate-900` (the NativeWind dark variant already used elsewhere in the staff app).
- **Why:** A blinding white full-screen alert at night is a real usability problem for delivery staff.
- **Repro / how to see it:** Trigger an incoming-order alert in dark mode on the staff app.
- **Effort:** S

---

## Prioritized Punch-List (do in this order)

1. **[P0] §8** `isFeatureEnabled` canonical-default fallback — unblocks reliable flag reads; prerequisite for trusting every flag-gated feature. *(implementing)*
2. **[P1] §5** Replace feature-flags bespoke toast with Sonner — smallest self-contained consistency win on the same file we're already touching. *(implementing)*
3. **[P1] §7** Add `aria-label`/`role="switch"` to feature-flag toggles — same file, a11y. *(implementing)*
4. **[P1] §1** `Input` radius `rounded-xl → rounded-2xl` — one-line token fix that unifies every form.
5. **[P1] §6** Category (and product) forms: zod validation on blur/change with inline `field-error`.
6. **[P2] §6** Category slug-collision 409 guard (pairs with #5).
7. **[P1] §2** Introduce `lib/motion.ts` spring presets; migrate product-card + bottom-nav first.
8. **[P1] §3** Re-skin delivery map to brand tokens (confirm brand intent first).
9. **[P1] §1** Migrate hardcoded `bg-white`/slate to semantic tokens; then delete the dark-mode override block.
10. **[P1] §8** Mobile staff alert cards `dark:` variants.

Items #1–#3 are implemented in this pass (single file, independently verifiable).
Larger systemic items (#4, #7, #9) and design-decision items (§4 product surfaces,
§3 map re-skin) are documented for follow-up to avoid batching unrelated changes.
