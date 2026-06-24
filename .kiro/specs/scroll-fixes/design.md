# Scroll Fixes Bugfix Design

## Overview

The revathysupermarket Next.js 15 app has 8 scroll-related issues degrading the mobile browsing experience across iOS Safari, Android Chrome, and Desktop Firefox. The bugs stem from duplicate CSS declarations, missing scroll offsets, absent GPU layer promotion, incomplete iOS overscroll containment, and layout-triggering animations. This design formalizes each bug condition, defines the minimal targeted fix for each issue, and establishes a comprehensive testing strategy to verify fixes without introducing regressions.

## Glossary

- **Bug_Condition (C)**: The set of conditions that collectively trigger one or more of the 8 scroll issues — duplicate overflow, missing scroll-padding, clipped carousel items, overscroll bounce leak, keyboard overlap, scroll jank, broken modal/sheet scroll, and cart bar layout shift
- **Property (P)**: The desired scroll behavior — smooth, jank-free scrolling with correct offsets, contained overscroll, responsive keyboard handling, and GPU-composited sticky/fixed elements
- **Preservation**: Existing behaviors that must remain unchanged — horizontal overflow clipping, smooth manual scrolling, correct carousel display, desktop/Android behavior, keyboard-closed nav positioning, low-end device rendering, short modal content display, and cart bar tap registration
- **globals.css**: The global stylesheet at `app/globals.css` containing all utility classes, scroll behaviors, and fixed element positioning
- **viewport-stability.tsx**: Component at `components/ui/viewport-stability.tsx` that detects keyboard visibility and sets `--keyboard-inset` and `data-keyboard-open` attributes
- **mobile-bottom-nav.tsx**: Component at `components/mobile-bottom-nav.tsx` rendering the fixed bottom navigation bar with `.ios-bottom-bar` class
- **bottom-sheet.tsx**: Component at `components/ui/bottom-sheet.tsx` rendering bottom sheet modals with drag-to-dismiss and `.stable-dialog` class
- **layout.tsx**: Root layout at `app/layout.tsx` that wraps all pages with `<div className="pb-safe">{children}</div>`

## Bug Details

### Bug Condition

The bugs manifest across 8 distinct conditions that collectively affect scroll behavior on mobile devices. The conditions range from CSS conflicts (duplicate declarations) to missing progressive enhancement (GPU promotion) to platform-specific scroll issues (iOS overscroll bounce, Android keyboard overlap).

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ScrollInteraction
  OUTPUT: boolean
  
  RETURN (
    (input.type == "page_render" AND htmlHasDuplicateOverflowX())
    OR (input.type == "anchor_navigation" AND noScrollPaddingTopDefined())
    OR (input.type == "horizontal_scroll" AND containerLacksInlinePadding(input.container))
    OR (input.type == "overscroll" AND platform == "ios_safari" AND bodyHasOverflowY())
    OR (input.type == "keyboard_open" AND platform == "android" AND bottomNavLacksKeyboardOffset())
    OR (input.type == "scroll_past_sticky" AND elementLacksGPUPromotion(input.element))
    OR (input.type == "modal_inner_scroll" AND platform == "ios" AND sheetLacksNativeScrollStyles())
    OR (input.type == "cart_animation" AND cartBarUsesLayoutAnimations())
  )
END FUNCTION
```

### Examples

- **Issue 1**: On page render, html applies `overflow-x: hidden` then `overflow-x: clip`. In Safari 17, the first declaration creates a BFC scroll container, causing horizontal scroll issues before the second overrides it
- **Issue 2**: User clicks an anchor `#section-5`. Browser scrolls to the element but the top 56px+ is hidden behind the sticky header because `scroll-padding-top` is absent
- **Issue 3**: `.scroll-x` carousel shows 5 products. The first and last products are clipped at the edge with no visible padding/breathing room
- **Issue 4**: On iOS Safari, user scrolls page content to the bottom; momentum continues and "bounces" the entire viewport body, creating a rubber-band double-scroll effect
- **Issue 5**: On Android, user taps a text input at the bottom of the page. Virtual keyboard opens, but the bottom nav bar covers the input field because `--keyboard-inset` is not applied to `.ios-bottom-bar`'s bottom offset
- **Issue 6**: User scrolls a product grid on mobile. The sticky header and fixed bottom bar repaint on every frame instead of being composited, causing visible jank (dropped frames)
- **Issue 7**: On iOS Safari, user opens a bottom sheet with long content and tries to scroll. The inner content does not scroll because `-webkit-overflow-scrolling: touch` is not applied to the scrollable container within the sheet
- **Issue 8**: Cart bar animates in using `height` and `padding` transitions, causing layout recalculation that shifts surrounding content during scroll

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Horizontal overflow content continues to be clipped visually via `overflow-x: clip` on html without creating a scrollable container
- Manual page scrolling works smoothly without unexpected jumps or offset interference from the scroll-padding changes
- Carousels where all content fits within the viewport display correctly without extra whitespace from added padding
- Desktop browsers and Android devices function normally without side effects from iOS-specific overscroll containment
- When the keyboard is closed, the bottom nav remains positioned at `max(0.75rem, var(--safe-bottom))` with `--keyboard-inset` at 0px
- On low-end devices without GPU acceleration, sticky headers and fixed bars still render correctly (GPU hints are progressive enhancement)
- Modals/sheets with short (non-overflowing) content display without forced scrolling or unnecessary scroll indicators
- The floating cart bar continues to register tap/click events correctly despite the pointer-events container wrapper

**Scope:**
All interactions that do NOT involve the 8 bug conditions should be completely unaffected by these fixes. This includes:
- Standard page navigation without anchors
- Desktop-only interactions
- Non-scroll user inputs (taps, form submissions, etc.)
- Admin panel pages (excluded from mobile nav)
- Print styles

## Hypothesized Root Cause

Based on the bug analysis and codebase inspection, the root causes are:

1. **Issue 1 - Duplicate overflow-x**: `globals.css` line ~80 has `overflow-x: hidden;` immediately followed by `overflow-x: clip;`. The first declaration is dead code in modern browsers but creates a BFC in older WebKit engines. Solution: remove the `overflow-x: hidden` line entirely.

2. **Issue 2 - Missing scroll-padding-top**: The `html` element has no `scroll-padding-top` property. When `scroll-behavior: smooth` or anchor navigation occurs, the browser scrolls the target flush to viewport top, behind the sticky header (56px + some margin). Solution: add `scroll-padding-top: var(--scroll-offset)` where `--scroll-offset: calc(var(--mobile-header-height) + 60px)`.

3. **Issue 3 - Carousel edge clipping**: `.scroll-x` and `.wheel-scroll` classes define horizontal overflow scrolling but have no `padding-inline` or `scroll-padding-inline`. First/last items snap flush to the container edge. Solution: add `padding-inline: 1rem` and `scroll-padding-inline: 1rem` to both classes.

4. **Issue 4 - iOS overscroll bounce leak**: The `body` element has `-webkit-overflow-scrolling: touch` but its child content wrapper (`<div className="pb-safe">`) does not contain its own overscroll. Momentum scrolling leaks to the body/html viewport, causing bounce. Solution: apply `overflow-y: auto`, `overscroll-behavior: contain`, `-webkit-overflow-scrolling: touch`, and `min-height: 100dvh` to the route container (the `pb-safe` div), and remove `overflow-y` scroll behavior from body (body already has `overscroll-behavior-y: none` but lacks containment on its scroll child).

5. **Issue 5 - Keyboard overlap on Android**: `viewport-stability.tsx` correctly detects keyboard and sets `--keyboard-inset`, and the CSS hides `.ios-bottom-bar` when `data-keyboard-open` is set. However, the current approach fully hides the nav bar. The requirement asks for the bottom position to be adjusted by `--keyboard-inset` rather than hiding it entirely. The `.ios-bottom-bar` class needs its `bottom` property updated to `max(0.75rem, calc(var(--safe-bottom) + var(--keyboard-inset)))`.

6. **Issue 6 - Scroll jank on sticky/fixed elements**: `.ios-sticky-tracking-header` and `.ios-bottom-bar` lack `will-change: transform` and `transform: translateZ(0)`. Without GPU layer promotion, these elements are repainted on every scroll frame. Solution: add both properties to promote them to compositor layers.

7. **Issue 7 - Broken modal/sheet scrolling on iOS**: `bottom-sheet.tsx` has `overflow-y-auto` on the inner content div but lacks `-webkit-overflow-scrolling: touch` and `overscroll-behavior: contain` on that specific scrollable container. The `.stable-dialog` class on the outer wrapper handles containment but the inner scroll container needs iOS-specific touch scroll styles. Solution: add `ios-native-scroll` class to the inner scrollable div and update max-height to use `calc(90dvh - var(--safe-bottom))`.

8. **Issue 8 - Cart bar layout shift**: The floating cart bar (`.floating-cart-bar` / `.ios-floating-action` used for cart) animates using height/padding transitions that trigger layout recalculations. Solution: wrap the cart bar in a fixed container with `pointer-events: none`, give the inner motion element `pointer-events: auto`, and use only `transform` + `opacity` animations. The CSS `.floating-cart-bar` class should not use height/padding transitions.

## Correctness Properties

Property 1: Bug Condition - Scroll Issues Resolved

_For any_ scroll interaction where one or more of the 8 bug conditions holds (isBugCondition returns true), the fixed code SHALL produce the expected correct behavior: single `overflow-x: clip` without duplicates, proper scroll-padding offset below sticky headers, inline padding on carousels, contained overscroll on iOS, keyboard-aware bottom nav positioning on Android, GPU-composited sticky/fixed elements, native-scrolling bottom sheets on iOS, and transform-only cart bar animations without layout shift.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

Property 2: Preservation - Existing Scroll and Interaction Behavior

_For any_ interaction where none of the 8 bug conditions hold (isBugCondition returns false), the fixed code SHALL produce the same result as the original code, preserving horizontal overflow clipping, smooth manual scrolling, correct carousel display for fitting content, desktop/Android normality, keyboard-closed nav positioning, low-end device rendering, short modal content display, and cart bar tap registration.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

**File**: `app/globals.css`

**Issue 1 - Remove duplicate overflow-x:**
1. Remove the line `overflow-x: hidden;` from the `html` rule, keeping only `overflow-x: clip;`

**Issue 2 - Add scroll-padding-top:**
2. Add `--scroll-offset: calc(var(--mobile-header-height) + 60px);` to `:root` variables
3. Add `scroll-padding-top: var(--scroll-offset);` to the `html` rule

**Issue 3 - Add carousel inline padding:**
4. Add `padding-inline: 1rem;` and `scroll-padding-inline: 1rem;` to `.scroll-x` class
5. Add `padding-inline: 1rem;` and `scroll-padding-inline: 1rem;` to `.wheel-scroll` class

**Issue 4 - Contain iOS overscroll:**
6. Add a new `.route-scroll-container` class with:
   - `overflow-y: auto`
   - `-webkit-overflow-scrolling: touch`
   - `overscroll-behavior: contain`
   - `min-height: 100dvh`
7. Remove `-webkit-overflow-scrolling: touch` from the `body` rule (move to route container)

**Issue 5 - Keyboard-aware bottom nav:**
8. Update `.ios-bottom-bar` bottom property from `max(0.75rem, var(--safe-bottom))` to `max(0.75rem, calc(var(--safe-bottom) + var(--keyboard-inset)))`
9. Update `html[data-keyboard-open] .ios-bottom-bar` to remove the full hide behavior (remove `opacity: 0` and `pointer-events: none`), keeping only `transform: translateY(0)` so the nav stays visible but repositioned

**Issue 6 - GPU layer promotion:**
10. Add `will-change: transform;` and `transform: translateZ(0);` to `.ios-sticky-tracking-header`
11. Add `will-change: transform;` and `transform: translateZ(0);` to `.ios-bottom-bar`

**Issue 7 - iOS bottom sheet scrolling:**
12. Update `.stable-dialog` max-height to `min(90dvh, calc(var(--visual-viewport-height) - var(--safe-bottom)))`
13. Add a new `.sheet-scroll-content` class with:
    - `-webkit-overflow-scrolling: touch`
    - `overflow-y: auto`
    - `overscroll-behavior: contain`
    - `max-height: calc(90dvh - var(--safe-bottom))`

**Issue 8 - Cart bar animation fix:**
14. Add a new `.floating-cart-wrapper` class with:
    - `position: fixed`
    - `pointer-events: none`
    - `bottom: calc(5rem + var(--safe-bottom))`
    - `left: 50%`
    - `transform: translateX(-50%)`
    - `z-index: 50`
    - `width: calc(100% - 2rem)`
    - `max-width: 400px`
15. Update `.floating-cart-bar` to remove `position: fixed`, `bottom`, `left`, `transform`, `z-index`, `width`, `max-width` (these move to wrapper) and add `pointer-events: auto`
16. Ensure any animation on the cart bar uses only `transform` and `opacity` (no `height` or `padding` transitions)

---

**File**: `app/layout.tsx`

**Issue 4 - Route scroll container:**
17. Add `route-scroll-container` class to the `<div className="pb-safe">` wrapper:
    - Change to `<div className="pb-safe route-scroll-container">`

---

**File**: `components/ui/bottom-sheet.tsx`

**Issue 7 - iOS sheet scrolling:**
18. Add `sheet-scroll-content ios-native-scroll` classes to the inner content `<div>`:
    - Change `<div className="max-h-[calc(85dvh-80px)] overflow-y-auto px-5 py-4">` to `<div className="sheet-scroll-content ios-native-scroll overflow-y-auto px-5 py-4">`
    - Remove the inline `max-h-[calc(85dvh-80px)]` (handled by `.sheet-scroll-content` class)

---

**File**: `components/mobile-bottom-nav.tsx`

**Issue 6 - GPU promotion (component-level):**
19. No changes needed — the `.ios-bottom-bar` class already applies to the nav element; the CSS change in globals.css covers this

---

**File**: `components/ui/viewport-stability.tsx`

**Issue 5 - Already handles keyboard detection:**
20. No changes needed — the component already sets `--keyboard-inset` and `data-keyboard-open` correctly. The CSS change in globals.css adjusts the positioning.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate each bug on unfixed code, then verify the fixes work correctly and preserve existing behavior. Testing must cover three platforms: iOS Safari 17+, Android Chrome, and Desktop Firefox.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fixes. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write CSS and component tests that simulate or inspect each bug condition on the UNFIXED code to observe failures and confirm root causes.

**Test Cases**:
1. **Duplicate overflow-x test**: Parse `globals.css` and assert only one `overflow-x` declaration exists on `html` (will fail on unfixed code — finds 2)
2. **Missing scroll-padding test**: Render a page with anchor links, navigate to anchor, measure target element's position relative to viewport top — assert it is at least `var(--mobile-header-height)` pixels from top (will fail on unfixed code)
3. **Carousel padding test**: Render `.scroll-x` container, measure first child's `offsetLeft` — assert it equals 16px (1rem) (will fail on unfixed code — equals 0)
4. **iOS overscroll containment test**: Check computed styles on route container for `overscroll-behavior: contain` (will fail on unfixed code — property not set)
5. **Keyboard overlap test**: Simulate keyboard open state, measure `.ios-bottom-bar` computed `bottom` — assert it includes `--keyboard-inset` offset (will fail on unfixed code)
6. **GPU promotion test**: Check computed `will-change` on `.ios-sticky-tracking-header` and `.ios-bottom-bar` — assert `transform` (will fail on unfixed code — equals `auto`)
7. **Sheet scrolling test**: Open bottom sheet with overflowing content on iOS, check inner container has `-webkit-overflow-scrolling: touch` computed style (will fail on unfixed code)
8. **Cart animation test**: Inspect `.floating-cart-bar` transitions — assert no `height` or `padding` in transition property (will fail on unfixed code if layout animations exist)

**Expected Counterexamples**:
- Issue 1: CSS parser finds 2 `overflow-x` declarations on html selector
- Issue 2: Anchor target scrolled to y=0 (behind 56px header)
- Issue 3: First carousel child at x=0 (no padding)
- Issue 5: Bottom nav `bottom` value does not incorporate keyboard height
- Issue 6: `will-change` computes to `auto` (no GPU promotion)

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed code produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderWithFixedCSS(input)
  ASSERT expectedBehavior(result)
END FOR
```

Specifically:
- Issue 1: Assert `html` computed `overflow-x` == `clip` and no horizontal scrollbar appears
- Issue 2: Assert anchor-navigated elements are visible below the sticky header
- Issue 3: Assert first/last carousel items have 16px inset from container edge
- Issue 4: Assert route container has `overscroll-behavior: contain` and body momentum doesn't leak
- Issue 5: Assert `.ios-bottom-bar` bottom offset increases by `--keyboard-inset` value when keyboard opens
- Issue 6: Assert sticky/fixed elements have `will-change: transform` computed
- Issue 7: Assert bottom sheet inner content scrolls smoothly on iOS with touch
- Issue 8: Assert cart bar animation uses only transform/opacity, no layout shift measured

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalBehavior(input) == fixedBehavior(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many viewport sizes and scroll positions to verify no regression
- It catches edge cases where padding/margin changes could break layout
- It provides strong guarantees that non-buggy interactions remain unchanged

**Test Plan**: Observe behavior on UNFIXED code first for standard interactions, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Horizontal clip preservation**: Verify wide content (>viewport width) is still clipped, no horizontal scrollbar appears on any page
2. **Manual scroll smoothness**: Verify scroll events fire at 60fps without jank on standard page scroll (no unexpected jumps from scroll-padding on non-anchor scrolls)
3. **Fitted carousel preservation**: Verify carousels where all items fit within viewport don't show extra whitespace
4. **Desktop/Android normality**: Verify desktop Firefox and Android Chrome render identically to before (iOS-specific changes are scoped)
5. **Keyboard-closed nav**: Verify when `--keyboard-inset` is 0px, bottom nav is at `max(0.75rem, var(--safe-bottom))` (unchanged)
6. **Low-end GPU fallback**: Verify `will-change: transform` is progressive enhancement (elements still render correctly without GPU)
7. **Short modal content**: Verify sheets with non-overflowing content display without scroll indicators
8. **Cart bar taps**: Verify click/tap events on the cart bar register correctly despite pointer-events wrapper

### Unit Tests

- Test CSS output: parse globals.css and validate single `overflow-x` declaration on html
- Test scroll-padding-top computed value matches `calc(56px + 60px)` = `116px`
- Test `.scroll-x` has `padding-inline: 1rem` and `scroll-padding-inline: 1rem`
- Test `.ios-bottom-bar` computed `bottom` with `--keyboard-inset: 300px` equals `max(0.75rem, calc(safe-bottom + 300px))`
- Test `.ios-sticky-tracking-header` and `.ios-bottom-bar` have `will-change: transform`
- Test bottom-sheet inner content div has `ios-native-scroll` and `sheet-scroll-content` classes
- Test `.floating-cart-bar` does not have `position: fixed` (moved to wrapper)

### Property-Based Tests

- Generate random viewport sizes (320px–1440px width, 568px–1024px height) and verify no horizontal scrollbar appears on any page with `overflow-x: clip`
- Generate random anchor positions and verify all are visible below the header after scroll
- Generate random numbers of carousel items (1–20) and verify first/last items have 16px offset from container edge
- Generate random `--keyboard-inset` values (0–400px) and verify bottom nav `bottom` offset is correct
- Generate random scroll positions and verify sticky/fixed elements maintain `will-change: transform`

### Integration Tests

- **iOS Safari 17 full flow**: Load page → scroll product grid → open bottom sheet → scroll sheet content → close sheet → verify no layout shift
- **Android Chrome keyboard flow**: Load page → tap input → verify keyboard detected → verify bottom nav repositions → close keyboard → verify nav returns to original position
- **Desktop Firefox regression**: Navigate all main routes → verify no visual difference from baseline screenshots
- **Anchor navigation flow**: Click in-page anchor → verify target element is fully visible below sticky header
- **Carousel interaction flow**: Scroll carousel to end → verify last item fully visible with padding → scroll back → verify first item fully visible
- **Cart bar animation flow**: Add item to cart → verify cart bar appears with transform/opacity only → verify no CLS (Cumulative Layout Shift) measured → tap cart bar → verify navigation works
