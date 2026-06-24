# Bugfix Requirements Document

## Introduction

The revathysupermarket Next.js 15 app has 8 scroll-related issues that collectively degrade the mobile browsing experience. These range from duplicate CSS properties causing unpredictable overflow behavior, to iOS Safari momentum bounce leaks, keyboard overlap on Android, scroll jank on product grids, broken modal/sheet scrolling on iOS, and layout shifts from cart animations. This bugfix addresses all scroll issues systematically to deliver a smooth, native-feeling scroll experience across iOS and Android.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the html element is rendered THEN the system applies duplicate `overflow-x` declarations (`overflow-x: hidden` followed by `overflow-x: clip`), causing browser-dependent behavior where some engines use the first declaration

1.2 WHEN a user navigates to an anchor link or the page scrolls to a focused element THEN the system positions the content behind the sticky mobile header because no scroll-padding-top offset is defined

1.3 WHEN a horizontal scroll container (`.scroll-x` or `.wheel-scroll`) is scrolled to the start or end THEN the system clips the first and last child items because the container lacks inline padding and scroll-padding

1.4 WHEN a user scrolls a page on iOS Safari THEN the system allows momentum bounce to leak from inner page containers to the body, causing a double-scroll / rubber-band effect on the entire viewport

1.5 WHEN the virtual keyboard opens on Android THEN the system does not account for keyboard height, causing the bottom navigation bar to overlap input fields and the page layout to shift

1.6 WHEN a user scrolls the product grid past sticky headers or fixed bottom bars THEN the system exhibits scroll jank because those elements lack GPU-composited layer promotion (`will-change: transform`)

1.7 WHEN a user attempts to scroll within a modal (Dialog) or bottom sheet (Sheet) on iOS THEN the inner content does not scroll because `-webkit-overflow-scrolling: touch`, `overflow-y: auto`, `overscroll-behavior: contain`, and proper max-height constraints are missing

1.8 WHEN the floating cart bar animates in/out using height and padding transitions THEN the system triggers layout recalculations that cause visible layout shift during scroll

### Expected Behavior (Correct)

2.1 WHEN the html element is rendered THEN the system SHALL apply only `overflow-x: clip` (removing the duplicate `overflow-x: hidden` declaration) so the html element does not create a scroll container

2.2 WHEN a user navigates to an anchor link or the page scrolls to a focused element THEN the system SHALL offset the scroll position by `scroll-padding-top: var(--scroll-offset)` where `--scroll-offset` equals `calc(var(--mobile-header-height) + 60px)`, ensuring content is visible below the sticky header

2.3 WHEN a horizontal scroll container (`.scroll-x` or `.wheel-scroll`) is rendered THEN the system SHALL apply `padding-inline: 1rem` and `scroll-padding-inline: 1rem` so that first and last child items are fully visible without clipping

2.4 WHEN a user scrolls a page on iOS Safari THEN the system SHALL contain overscroll within each route's top-level container by applying `overflow-y: auto`, `overscroll-behavior: contain`, native scroll styles, and `min-height: 100dvh` to route containers, and SHALL remove `overflow-y` scroll from the body element

2.5 WHEN the virtual keyboard opens on Android THEN the system SHALL detect keyboard visibility, set a `--keyboard-inset` CSS variable to the keyboard height, and adjust the bottom navigation bar's bottom position to `max(0.75rem, calc(var(--safe-bottom) + var(--keyboard-inset)))` so it does not overlap input fields

2.6 WHEN a user scrolls the product grid past sticky headers or fixed bottom bars THEN the system SHALL apply `will-change: transform` and `transform: translateZ(0)` to all sticky headers and fixed bottom bars to promote them to GPU-composited layers, eliminating scroll jank

2.7 WHEN a user scrolls within a modal (Dialog) or bottom sheet (Sheet) on iOS THEN the system SHALL apply `-webkit-overflow-scrolling: touch`, `overflow-y: auto`, `overscroll-behavior: contain`, and `max-height: calc(90dvh - var(--safe-bottom))` to the inner content containers, enabling smooth native scrolling

2.8 WHEN the floating cart bar animates in/out THEN the system SHALL wrap it in a fixed container with `pointer-events: none`, give the inner motion element `pointer-events: auto`, and use only `transform` and `opacity` animations (no height or padding transitions) to prevent layout shift during scroll

### Unchanged Behavior (Regression Prevention)

3.1 WHEN horizontal overflow content exists on any page THEN the system SHALL CONTINUE TO clip it visually (via `overflow-x: clip` on html) without creating a scrollable container

3.2 WHEN a user manually scrolls through page content without anchor navigation THEN the system SHALL CONTINUE TO scroll smoothly without unexpected jumps or offset interference

3.3 WHEN a user scrolls a horizontal carousel and the content fits entirely within the viewport THEN the system SHALL CONTINUE TO display all items correctly without extra whitespace from added padding

3.4 WHEN a user scrolls on desktop browsers or Android devices THEN the system SHALL CONTINUE TO function normally without any side effects from iOS-specific overscroll containment changes

3.5 WHEN the virtual keyboard is closed or not present THEN the system SHALL CONTINUE TO position the bottom navigation bar at `max(0.75rem, var(--safe-bottom))` with `--keyboard-inset` at 0px

3.6 WHEN a user scrolls on low-end devices without GPU acceleration THEN the system SHALL CONTINUE TO render sticky headers and fixed bars correctly (the GPU hints are progressive enhancement only)

3.7 WHEN a user interacts with modal/sheet content that does not overflow (short content) THEN the system SHALL CONTINUE TO display it without forced scrolling or unnecessary scroll indicators

3.8 WHEN the floating cart bar is visible and the user taps it THEN the system SHALL CONTINUE TO register tap/click events correctly despite the pointer-events container wrapper
