/**
 * Property 2: Preservation - Existing Scroll and Interaction Behavior Unchanged
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 * 
 * These tests verify that the scroll bugfix changes in globals.css preserve
 * existing behavior for non-buggy interactions. Each test analyzes the CSS
 * rules to confirm preservation properties hold after the fix.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CSS_PATH = join(import.meta.dirname, "..", "app", "globals.css");
const css = readFileSync(CSS_PATH, "utf-8");

// Helper: extract a CSS rule block by selector
function getRuleBlock(selector: string): string {
  // Handle selectors with special regex characters
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "g");
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(css)) !== null) {
    matches.push(match[1]);
  }
  return matches.join("\n");
}

// Helper: get all declarations of a property within a rule block
function getDeclarations(ruleBlock: string, property: string): string[] {
  const lines = ruleBlock.split("\n").map(l => l.trim()).filter(Boolean);
  return lines.filter(l => {
    const parts = l.split(":");
    return parts[0]?.trim() === property;
  }).map(l => l.replace(/;$/, "").split(":").slice(1).join(":").trim());
}

// Helper: check if a class exists in the CSS
function classExists(className: string): boolean {
  return css.includes(`.${className}`);
}

/**
 * 3.1: Horizontal overflow still clipped via `overflow-x: clip` on html (no horizontal scrollbar created)
 * 
 * Preservation check: `overflow-x: clip` on html is present and functional.
 * The fix removed the duplicate `overflow-x: hidden` but kept `overflow-x: clip`.
 * This ensures horizontal overflow content is still clipped visually.
 */
test("3.1 - overflow-x: clip on html still clips horizontal overflow", () => {
  const htmlBlock = getRuleBlock("html");
  const overflowXDecls = getDeclarations(htmlBlock, "overflow-x");
  
  // There should be exactly one overflow-x declaration on html
  assert.equal(overflowXDecls.length, 1, "Expected exactly one overflow-x declaration on html");
  
  // It should be 'clip' (not 'hidden' which creates a scroll container)
  assert.equal(overflowXDecls[0], "clip", "overflow-x on html should be 'clip'");
});

/**
 * 3.2: Manual scrolling smooth without offset jumps (scroll-padding-top only affects anchor navigation)
 * 
 * Preservation check: `scroll-padding-top` only affects scroll-to-target behavior, not user-initiated scrolling.
 * The CSS spec guarantees scroll-padding only applies to scroll-snap and programmatic/anchor scrolling,
 * not to user manual scrolling. We verify the property value is reasonable.
 */
test("3.2 - scroll-padding-top uses --scroll-offset which only affects anchor navigation", () => {
  const htmlBlock = getRuleBlock("html");
  const scrollPadding = getDeclarations(htmlBlock, "scroll-padding-top");
  
  // scroll-padding-top should exist
  assert.ok(scrollPadding.length > 0, "scroll-padding-top should be defined on html");
  
  // It should reference var(--scroll-offset) - this CSS property ONLY affects
  // scroll targets (anchors, find-on-page, programmatic scrollTo with behavior)
  // NOT manual user scrolling (touch/wheel/trackpad)
  assert.ok(
    scrollPadding[0].includes("var(--scroll-offset)"),
    "scroll-padding-top should use var(--scroll-offset)"
  );
  
  // Verify --scroll-offset is defined in :root
  const rootBlock = getRuleBlock(":root");
  const scrollOffset = getDeclarations(rootBlock, "--scroll-offset");
  assert.ok(scrollOffset.length > 0, "--scroll-offset should be defined in :root");
  assert.ok(
    scrollOffset[0].includes("var(--mobile-header-height)"),
    "--scroll-offset should reference --mobile-header-height"
  );
});

/**
 * 3.3: Carousels where all items fit within viewport display correctly without extra whitespace
 * 
 * Preservation check: `padding-inline: 1rem` on scroll containers is additive but doesn't force
 * whitespace when content fits. The padding creates an inset for the scroll viewport but the
 * browser only shows the content area - no extra whitespace is forced.
 */
test("3.3 - padding-inline on .scroll-x doesn't force whitespace when content fits", () => {
  const scrollXBlock = getRuleBlock(".scroll-x");
  const paddingInline = getDeclarations(scrollXBlock, "padding-inline");
  
  // padding-inline should be 1rem
  assert.ok(paddingInline.length > 0, ".scroll-x should have padding-inline");
  assert.equal(paddingInline[0], "1rem", "padding-inline should be 1rem");
  
  // scroll-padding-inline should also be 1rem (for snap alignment)
  const scrollPaddingInline = getDeclarations(scrollXBlock, "scroll-padding-inline");
  assert.ok(scrollPaddingInline.length > 0, ".scroll-x should have scroll-padding-inline");
  assert.equal(scrollPaddingInline[0], "1rem", "scroll-padding-inline should be 1rem");
  
  // The key preservation: padding-inline on an overflow container acts as the scrollport inset.
  // When all content fits within the viewport, the padding simply appears as normal inline padding.
  // It does NOT create forced extra whitespace - it just determines where content starts and ends.
  // Verify overflow-x: auto is present (meaning scrollbar only appears when content overflows)
  const overflowX = getDeclarations(scrollXBlock, "overflow-x");
  assert.ok(overflowX.length > 0, ".scroll-x should have overflow-x: auto");
  assert.equal(overflowX[0], "auto", "overflow-x should be auto (scrollbar only when needed)");
});

/**
 * 3.4: Desktop/Android unaffected - iOS-specific changes are scoped and don't break other platforms
 * 
 * Preservation check: `overscroll-behavior: contain` on .route-scroll-container is a CSS standard
 * property that is platform-neutral. On desktop/Android it simply prevents overscroll chaining
 * (which is expected behavior). The iOS-specific `-webkit-overflow-scrolling: touch` is also
 * harmless on non-iOS platforms (it's ignored).
 */
test("3.4 - .route-scroll-container uses standard CSS properties safe on all platforms", () => {
  const routeBlock = getRuleBlock(".route-scroll-container");
  
  // overscroll-behavior: contain - standard CSS, no-op effect on desktop (already no bounce)
  const overscrollBehavior = getDeclarations(routeBlock, "overscroll-behavior");
  assert.ok(overscrollBehavior.length > 0, ".route-scroll-container should have overscroll-behavior");
  assert.equal(overscrollBehavior[0], "contain", "overscroll-behavior should be contain");
  
  // overflow-y: auto - standard, only adds scrollbar when content overflows
  const overflowY = getDeclarations(routeBlock, "overflow-y");
  assert.ok(overflowY.length > 0, ".route-scroll-container should have overflow-y");
  assert.equal(overflowY[0], "auto", "overflow-y should be auto (not forced scroll)");
  
  // -webkit-overflow-scrolling: touch - only recognized by WebKit (Safari).
  // On Chrome/Firefox/Edge this property is simply ignored - no effect.
  const webkitScroll = getDeclarations(routeBlock, "-webkit-overflow-scrolling");
  assert.ok(webkitScroll.length > 0, "Should have -webkit-overflow-scrolling for iOS");
  assert.equal(webkitScroll[0], "touch", "-webkit-overflow-scrolling should be touch");
  
  // min-height: 100dvh ensures full viewport height (standard on all platforms)
  const minHeight = getDeclarations(routeBlock, "min-height");
  assert.ok(minHeight.length > 0, ".route-scroll-container should have min-height");
  assert.equal(minHeight[0], "100dvh", "min-height should be 100dvh");
});

/**
 * 3.5: When `--keyboard-inset` is 0px, bottom nav is at `max(0.75rem, var(--safe-bottom))` (unchanged)
 * 
 * Preservation check: `calc(var(--safe-bottom) + var(--keyboard-inset))` with `--keyboard-inset: 0px`
 * resolves to just `var(--safe-bottom)`. So when the keyboard is closed:
 *   bottom: max(0.75rem, calc(var(--safe-bottom) + 0px)) = max(0.75rem, var(--safe-bottom))
 * This is mathematically identical to the original behavior.
 */
test("3.5 - ios-bottom-bar bottom with --keyboard-inset: 0px equals original position", () => {
  const bottomBarBlock = getRuleBlock(".ios-bottom-bar");
  const bottomDecls = getDeclarations(bottomBarBlock, "bottom");
  
  assert.ok(bottomDecls.length > 0, ".ios-bottom-bar should have bottom property");
  
  // The bottom value should include both var(--safe-bottom) and var(--keyboard-inset)
  const bottomValue = bottomDecls[0];
  assert.ok(
    bottomValue.includes("var(--keyboard-inset)"),
    "bottom should include var(--keyboard-inset)"
  );
  assert.ok(
    bottomValue.includes("var(--safe-bottom)"),
    "bottom should include var(--safe-bottom)"
  );
  assert.ok(
    bottomValue.includes("max("),
    "bottom should use max() for minimum spacing"
  );
  
  // Verify --keyboard-inset defaults to 0px in :root
  const rootBlock = getRuleBlock(":root");
  const keyboardInset = getDeclarations(rootBlock, "--keyboard-inset");
  assert.ok(keyboardInset.length > 0, "--keyboard-inset should be defined in :root");
  assert.equal(keyboardInset[0], "0px", "--keyboard-inset default should be 0px");
  
  // Mathematical proof: when --keyboard-inset is 0px:
  //   calc(var(--safe-bottom) + 0px) = var(--safe-bottom)
  //   max(0.75rem, var(--safe-bottom)) = original behavior
  // This confirms no regression when keyboard is closed.
});

/**
 * 3.6: `will-change: transform` is progressive enhancement - elements still render correctly without GPU
 * 
 * Preservation check: `will-change: transform` is a performance hint only.
 * It tells the browser to pre-compose the element on a GPU layer, but if the browser
 * or device doesn't support GPU compositing, the element still renders correctly
 * with standard CPU rendering. The `transform: translateZ(0)` is also a no-op visually
 * (it doesn't move the element).
 */
test("3.6 - will-change and translateZ(0) are progressive enhancement only", () => {
  const stickyHeaderBlock = getRuleBlock(".ios-sticky-tracking-header");
  const bottomBarBlock = getRuleBlock(".ios-bottom-bar");
  
  // Verify will-change is present on both elements
  const stickyWillChange = getDeclarations(stickyHeaderBlock, "will-change");
  assert.ok(stickyWillChange.length > 0, ".ios-sticky-tracking-header should have will-change");
  assert.equal(stickyWillChange[0], "transform", "will-change should be transform");
  
  const barWillChange = getDeclarations(bottomBarBlock, "will-change");
  assert.ok(barWillChange.length > 0, ".ios-bottom-bar should have will-change");
  assert.equal(barWillChange[0], "transform", "will-change should be transform");
  
  // Verify transform: translateZ(0) - this is a visual no-op (moves 0 in Z axis)
  // On low-end devices without GPU, this is simply ignored or computed as identity transform
  const stickyTransform = getDeclarations(stickyHeaderBlock, "transform");
  assert.ok(stickyTransform.length > 0, ".ios-sticky-tracking-header should have transform");
  assert.equal(stickyTransform[0], "translateZ(0)", "transform should be translateZ(0) (visual no-op)");
  
  const barTransform = getDeclarations(bottomBarBlock, "transform");
  assert.ok(barTransform.length > 0, ".ios-bottom-bar should have transform");
  assert.equal(barTransform[0], "translateZ(0)", "transform should be translateZ(0) (visual no-op)");
  
  // Progressive enhancement proof:
  // - will-change: transform -> Hint only. Browsers that don't support GPU compositing ignore it.
  // - transform: translateZ(0) -> No visual change (0px in Z). If 3D transforms aren't supported,
  //   the browser treats it as identity, rendering the element in its normal position.
});

/**
 * 3.7: Sheets with non-overflowing (short) content display without forced scrolling
 * 
 * Preservation check: `overflow-y: auto` only shows scrollbar when content overflows.
 * The max-height constraint on `.sheet-scroll-content` uses `calc(90dvh - var(--safe-bottom))`
 * which is the maximum height. If content is shorter, no scrollbar appears.
 */
test("3.7 - sheet-scroll-content with overflow-y: auto only scrolls when content overflows", () => {
  const sheetBlock = getRuleBlock(".sheet-scroll-content");
  
  // overflow-y: auto means scrollbar appears ONLY when content exceeds max-height
  const overflowY = getDeclarations(sheetBlock, "overflow-y");
  assert.ok(overflowY.length > 0, ".sheet-scroll-content should have overflow-y");
  assert.equal(overflowY[0], "auto", "overflow-y should be auto (not scroll, not hidden)");
  
  // max-height constraint - content shorter than this shows no scrollbar
  const maxHeight = getDeclarations(sheetBlock, "max-height");
  assert.ok(maxHeight.length > 0, ".sheet-scroll-content should have max-height");
  assert.ok(
    maxHeight[0].includes("90dvh"),
    "max-height should reference 90dvh"
  );
  assert.ok(
    maxHeight[0].includes("var(--safe-bottom)"),
    "max-height should account for safe-bottom"
  );
  
  // overscroll-behavior: contain prevents momentum leak but doesn't force scrolling
  const overscroll = getDeclarations(sheetBlock, "overscroll-behavior");
  assert.ok(overscroll.length > 0, ".sheet-scroll-content should have overscroll-behavior");
  assert.equal(overscroll[0], "contain", "overscroll-behavior should be contain");
  
  // Key preservation proof:
  // overflow-y: auto = browser shows scrollbar ONLY when content height > max-height.
  // For short content: no scrollbar, no scroll indicators, no visual difference.
});

/**
 * 3.8: Cart bar taps register correctly - `.floating-cart-bar` has `pointer-events: auto`
 * which ensures events pass through despite wrapper having `pointer-events: none`
 * 
 * Preservation check: The wrapper has `pointer-events: none` to avoid blocking taps on
 * underlying content, but the inner `.floating-cart-bar` restores `pointer-events: auto`
 * which means all tap/click events are correctly received by the cart bar.
 */
test("3.8 - floating-cart-bar receives pointer events despite wrapper pointer-events: none", () => {
  // Verify wrapper has pointer-events: none
  const wrapperBlock = getRuleBlock(".floating-cart-wrapper");
  const wrapperPointerEvents = getDeclarations(wrapperBlock, "pointer-events");
  assert.ok(wrapperPointerEvents.length > 0, ".floating-cart-wrapper should have pointer-events");
  assert.equal(wrapperPointerEvents[0], "none", "Wrapper should have pointer-events: none");
  
  // Verify inner cart bar has pointer-events: auto (restores interaction)
  const cartBarBlock = getRuleBlock(".floating-cart-bar");
  const cartBarPointerEvents = getDeclarations(cartBarBlock, "pointer-events");
  assert.ok(cartBarPointerEvents.length > 0, ".floating-cart-bar should have pointer-events");
  assert.equal(cartBarPointerEvents[0], "auto", "Cart bar should have pointer-events: auto");
  
  // Verify cart bar does NOT have position: fixed (moved to wrapper)
  const cartBarPosition = getDeclarations(cartBarBlock, "position");
  // Should not have position: fixed
  const hasFixed = cartBarPosition.some(v => v === "fixed");
  assert.equal(hasFixed, false, ".floating-cart-bar should NOT have position: fixed (moved to wrapper)");
  
  // Verify wrapper HAS position: fixed
  const wrapperPosition = getDeclarations(wrapperBlock, "position");
  assert.ok(wrapperPosition.length > 0, ".floating-cart-wrapper should have position");
  assert.equal(wrapperPosition[0], "fixed", "Wrapper should have position: fixed");
  
  // CSS pointer-events proof:
  // pointer-events: none on parent -> parent doesn't capture any pointer events
  // pointer-events: auto on child -> child CAN capture pointer events
  // This is standard CSS behavior: child's pointer-events overrides parent's pointer-events: none
  // Result: taps on the cart bar area are received by .floating-cart-bar correctly
});
