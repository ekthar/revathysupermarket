# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Scroll Issues on Mobile (8 Bug Conditions)
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the 8 scroll bugs exist
  - **Scoped PBT Approach**: For each deterministic bug, scope the property to concrete failing cases:
    - Issue 1: Parse `globals.css` and assert only one `overflow-x` declaration exists on `html` selector (counterexample: finds 2 declarations — `overflow-x: hidden` then `overflow-x: clip`)
    - Issue 2: Assert `html` rule has `scroll-padding-top` defined with value `var(--scroll-offset)` (counterexample: property is absent)
    - Issue 3: Assert `.scroll-x` and `.wheel-scroll` classes have `padding-inline: 1rem` and `scroll-padding-inline: 1rem` (counterexample: both properties are missing)
    - Issue 4: Assert a `.route-scroll-container` class exists with `overflow-y: auto`, `overscroll-behavior: contain`, `-webkit-overflow-scrolling: touch`, and `min-height: 100dvh` (counterexample: class does not exist)
    - Issue 5: Assert `.ios-bottom-bar` `bottom` value includes `var(--keyboard-inset)` in the calc (counterexample: bottom is `max(0.75rem, var(--safe-bottom))` without keyboard offset)
    - Issue 6: Assert `.ios-sticky-tracking-header` and `.ios-bottom-bar` have `will-change: transform` and `transform: translateZ(0)` (counterexample: `will-change` is absent, no translateZ)
    - Issue 7: Assert a `.sheet-scroll-content` class exists with `-webkit-overflow-scrolling: touch`, `overflow-y: auto`, `overscroll-behavior: contain`, and `max-height: calc(90dvh - var(--safe-bottom))` (counterexample: class does not exist)
    - Issue 8: Assert `.floating-cart-wrapper` class exists with `pointer-events: none` and `.floating-cart-bar` has `pointer-events: auto` without `position: fixed` (counterexample: no wrapper class, cart bar has position fixed)
  - Run test on UNFIXED code - expect FAILURE (this confirms all 8 bugs exist)
  - Document counterexamples found for each issue
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Scroll and Interaction Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs and record:
    - Observe: `overflow-x: clip` on html still clips horizontal overflow content (no horizontal scrollbar)
    - Observe: Manual page scrolling works smoothly without unexpected offset jumps
    - Observe: Carousels where all items fit within viewport display correctly
    - Observe: Desktop/Android browsers render normally without iOS-specific side effects
    - Observe: When `--keyboard-inset` is 0px, bottom nav is at `max(0.75rem, var(--safe-bottom))`
    - Observe: Sticky headers and fixed bars render correctly regardless of GPU acceleration support
    - Observe: Bottom sheets with non-overflowing (short) content display without scroll indicators
    - Observe: `.floating-cart-bar` tap/click events register correctly
  - Write property-based tests capturing observed behavior:
    - For all viewport widths (320px–1440px): no horizontal scrollbar appears with `overflow-x: clip`
    - For all non-anchor scroll positions: content scrolls smoothly without offset interference
    - For carousels with items fitting viewport: no extra whitespace from padding
    - For desktop user agents: no iOS-specific class side effects
    - For `--keyboard-inset: 0px`: bottom nav position equals `max(0.75rem, var(--safe-bottom))`
    - For short modal content: no unnecessary overflow-y scroll indicators
    - For cart bar interactions: pointer-events pass through wrapper correctly to cart bar
  - Verify tests pass on UNFIXED code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3. Fix for scroll issues across mobile browsers (CSS changes in globals.css)

  - [x] 3.1 Remove duplicate overflow-x from html and add scroll-padding-top
    - Remove `overflow-x: hidden;` line from `html` rule (keep only `overflow-x: clip;`)
    - Add `--scroll-offset: calc(var(--mobile-header-height) + 60px);` to `:root` variables
    - Add `scroll-padding-top: var(--scroll-offset);` to `html` rule
    - _Bug_Condition: isBugCondition(input) where input.type == "page_render" AND htmlHasDuplicateOverflowX() OR input.type == "anchor_navigation" AND noScrollPaddingTopDefined()_
    - _Expected_Behavior: html has single overflow-x: clip; scroll targets are offset below sticky header_
    - _Preservation: Horizontal overflow still clipped via overflow-x: clip; manual scrolling unaffected_
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

  - [x] 3.2 Add padding-inline and scroll-padding-inline to .scroll-x and .wheel-scroll
    - Add `padding-inline: 1rem;` and `scroll-padding-inline: 1rem;` to `.scroll-x` class
    - Add `padding-inline: 1rem;` and `scroll-padding-inline: 1rem;` to `.wheel-scroll` class
    - _Bug_Condition: isBugCondition(input) where input.type == "horizontal_scroll" AND containerLacksInlinePadding(input.container)_
    - _Expected_Behavior: First and last carousel items have 16px inset from container edge_
    - _Preservation: Carousels where all items fit viewport display correctly without extra whitespace_
    - _Requirements: 2.3, 3.3_

  - [x] 3.3 Add .route-scroll-container class for iOS overscroll containment
    - Add new `.route-scroll-container` class in globals.css with:
      - `overflow-y: auto`
      - `-webkit-overflow-scrolling: touch`
      - `overscroll-behavior: contain`
      - `min-height: 100dvh`
    - Remove `-webkit-overflow-scrolling: touch` from the `body` rule (containment moves to route container)
    - _Bug_Condition: isBugCondition(input) where input.type == "overscroll" AND platform == "ios_safari" AND bodyHasOverflowY()_
    - _Expected_Behavior: Overscroll momentum is contained within the route container; no body bounce leak_
    - _Preservation: Desktop browsers and Android unaffected; non-scroll interactions unchanged_
    - _Requirements: 2.4, 3.4_

  - [x] 3.4 Update .ios-bottom-bar bottom to include --keyboard-inset
    - Change `.ios-bottom-bar` `bottom` from `max(0.75rem, var(--safe-bottom))` to `max(0.75rem, calc(var(--safe-bottom) + var(--keyboard-inset)))`
    - _Bug_Condition: isBugCondition(input) where input.type == "keyboard_open" AND platform == "android" AND bottomNavLacksKeyboardOffset()_
    - _Expected_Behavior: Bottom nav repositions above keyboard when --keyboard-inset > 0_
    - _Preservation: When --keyboard-inset is 0px, bottom nav position unchanged at max(0.75rem, var(--safe-bottom))_
    - _Requirements: 2.5, 3.5_

  - [x] 3.5 Add will-change: transform and transform: translateZ(0) to sticky/fixed elements
    - Add `will-change: transform;` and `transform: translateZ(0);` to `.ios-sticky-tracking-header`
    - Add `will-change: transform;` and `transform: translateZ(0);` to `.ios-bottom-bar`
    - _Bug_Condition: isBugCondition(input) where input.type == "scroll_past_sticky" AND elementLacksGPUPromotion(input.element)_
    - _Expected_Behavior: Sticky headers and fixed bottom bars are GPU-composited, eliminating scroll jank_
    - _Preservation: On low-end devices without GPU acceleration, elements still render correctly (progressive enhancement)_
    - _Requirements: 2.6, 3.6_

  - [x] 3.6 Add .sheet-scroll-content class for iOS bottom sheet scrolling
    - Add new `.sheet-scroll-content` class in globals.css with:
      - `-webkit-overflow-scrolling: touch`
      - `overflow-y: auto`
      - `overscroll-behavior: contain`
      - `max-height: calc(90dvh - var(--safe-bottom))`
    - Update `.stable-dialog` max-height to `min(90dvh, calc(var(--visual-viewport-height) - var(--safe-bottom)))`
    - _Bug_Condition: isBugCondition(input) where input.type == "modal_inner_scroll" AND platform == "ios" AND sheetLacksNativeScrollStyles()_
    - _Expected_Behavior: Bottom sheet inner content scrolls smoothly on iOS with native touch scrolling_
    - _Preservation: Sheets with short non-overflowing content display without forced scrolling or scroll indicators_
    - _Requirements: 2.7, 3.7_

  - [x] 3.7 Add .floating-cart-wrapper class and refactor .floating-cart-bar positioning
    - Add new `.floating-cart-wrapper` class with:
      - `position: fixed`
      - `pointer-events: none`
      - `bottom: calc(5rem + var(--safe-bottom))`
      - `left: 50%`
      - `transform: translateX(-50%)`
      - `z-index: 50`
      - `width: calc(100% - 2rem)`
      - `max-width: 400px`
    - Update `.floating-cart-bar` to remove `position: fixed`, `bottom`, `left`, `transform`, `z-index`, `width`, `max-width` and add `pointer-events: auto`
    - Ensure any animation uses only `transform` and `opacity` (no `height` or `padding` transitions)
    - _Bug_Condition: isBugCondition(input) where input.type == "cart_animation" AND cartBarUsesLayoutAnimations()_
    - _Expected_Behavior: Cart bar animates with transform/opacity only; no layout shift during scroll_
    - _Preservation: Cart bar tap/click events register correctly despite pointer-events: none on wrapper_
    - _Requirements: 2.8, 3.8_

- [x] 4. Apply component changes (layout.tsx and bottom-sheet.tsx)

  - [x] 4.1 Add route-scroll-container class to layout.tsx
    - In `app/layout.tsx`, change `<div className="pb-safe">` to `<div className="pb-safe route-scroll-container">`
    - This applies iOS overscroll containment to the route wrapper
    - _Requirements: 2.4_

  - [x] 4.2 Update bottom-sheet.tsx inner content with sheet-scroll-content class
    - In `components/ui/bottom-sheet.tsx`, change the inner content div:
      - From: `<div className="max-h-[calc(85dvh-80px)] overflow-y-auto px-5 py-4">`
      - To: `<div className="sheet-scroll-content ios-native-scroll overflow-y-auto px-5 py-4">`
    - Remove the inline `max-h-[calc(85dvh-80px)]` (now handled by `.sheet-scroll-content` class)
    - _Requirements: 2.7_

- [x] 5. Verify bug condition exploration test now passes

  - [x] 5.1 Re-run bug condition exploration test
    - **Property 1: Expected Behavior** - All 8 Scroll Issues Resolved
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior for all 8 bug conditions
    - When this test passes, it confirms all expected behaviors are satisfied:
      - Single `overflow-x: clip` on html (no duplicate)
      - `scroll-padding-top: var(--scroll-offset)` present on html
      - `.scroll-x` and `.wheel-scroll` have `padding-inline: 1rem` and `scroll-padding-inline: 1rem`
      - `.route-scroll-container` class exists with overscroll containment
      - `.ios-bottom-bar` bottom includes `var(--keyboard-inset)`
      - `.ios-sticky-tracking-header` and `.ios-bottom-bar` have `will-change: transform`
      - `.sheet-scroll-content` class exists with iOS scroll styles
      - `.floating-cart-wrapper` exists and `.floating-cart-bar` has `pointer-events: auto` without `position: fixed`
    - **EXPECTED OUTCOME**: Test PASSES (confirms all 8 bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 6. Verify preservation tests still pass

  - [x] 6.1 Re-run preservation property tests
    - **Property 2: Preservation** - Existing Scroll and Interaction Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all preservation tests still pass after fix:
      - Horizontal overflow still clipped (no horizontal scrollbar)
      - Manual scrolling smooth without offset jumps
      - Fitted carousels display correctly
      - Desktop/Android unaffected
      - Keyboard-closed nav positioned correctly
      - Low-end device rendering unchanged
      - Short modal content displays without scroll indicators
      - Cart bar taps register correctly
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 7. Checkpoint - Ensure all tests pass
  - Run the full test suite to confirm:
    - Bug condition exploration test (task 1) now PASSES
    - Preservation property tests (task 2) still PASS
    - No new regressions introduced
  - Cross-browser verification checklist:
    - iOS Safari 17+: overscroll contained, bottom sheet scrolls, anchor navigation offsets correctly
    - Android Chrome: keyboard-aware bottom nav repositioning works
    - Desktop Firefox: no visual regressions from CSS changes
  - Ensure all tests pass, ask the user if questions arise.
