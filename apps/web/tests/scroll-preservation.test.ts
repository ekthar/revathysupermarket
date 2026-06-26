import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(import.meta.dirname, "..", "app", "globals.css"), "utf8");
const layout = readFileSync(join(import.meta.dirname, "..", "app", "layout.tsx"), "utf8");

function rule(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
}

test("the route wrapper does not become a second vertical scroller", () => {
  const route = rule(".route-scroll-container");
  assert.doesNotMatch(route, /overflow-y\s*:/);
  assert.doesNotMatch(route, /overscroll-behavior\s*:/);
  assert.doesNotMatch(route, /-webkit-overflow-scrolling\s*:/);
});

test("root elements allow native scrolling", () => {
  const html = rule("html");
  const body = rule("body");
  assert.doesNotMatch(html, /touch-action\s*:/);
  assert.doesNotMatch(html, /overscroll-behavior\s*:/);
  assert.doesNotMatch(body, /overscroll-behavior-y\s*:/);
});

test("custom global edge-swipe interception is not mounted", () => {
  assert.doesNotMatch(layout, /IosEdgeSwipeBack/);
});

test("horizontal rails do not disable vertical gesture arbitration", () => {
  assert.match(rule(".scroll-x"), /touch-action\s*:\s*pan-x pan-y/);
  assert.match(rule(".wheel-scroll"), /touch-action\s*:\s*pan-x pan-y/);
});
