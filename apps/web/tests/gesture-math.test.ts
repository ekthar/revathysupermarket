/**
 * Unit tests for gesture-math.ts — Apple's physics formulas.
 *
 * Run with: npm test (tsx --test tests/*.test.ts)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { project, rubberband, nearestSnap, normalizeVelocity, clamp, lerp, mapRange } from "../lib/gesture-math";

describe("project()", () => {
  it("projects positive velocity forward", () => {
    const result = project(500);
    // (500/1000) * 0.998 / (1 - 0.998) = 0.5 * 0.998 / 0.002 = 249.5
    assert.ok(Math.abs(result - 249.5) < 0.1, `Expected ~249.5, got ${result}`);
  });

  it("projects negative velocity backward", () => {
    const result = project(-500);
    assert.ok(result < 0, "Negative velocity should project backward");
    assert.ok(Math.abs(result + 249.5) < 0.1);
  });

  it("zero velocity projects to zero", () => {
    assert.equal(project(0), 0);
  });

  it("respects custom deceleration rate", () => {
    const normal = project(500, 0.998);
    const snappy = project(500, 0.99);
    assert.ok(snappy < normal, "Snappier deceleration should project shorter");
  });
});

describe("rubberband()", () => {
  it("returns less than overshoot", () => {
    const result = rubberband(100, 400);
    assert.ok(result < 100, `Expected < 100, got ${result}`);
    assert.ok(result > 0, "Should be positive for positive overshoot");
  });

  it("typical case: 100px overshoot on 400px container", () => {
    const result = rubberband(100, 400);
    // (100 * 400 * 0.55) / (400 + 0.55 * 100) = 22000 / 455 ≈ 48.35
    assert.ok(Math.abs(result - 48.35) < 0.1, `Expected ~48.35, got ${result}`);
  });

  it("handles zero dimension (no division by zero)", () => {
    assert.equal(rubberband(100, 0), 0);
  });

  it("larger overshoot gives diminishing returns", () => {
    const small = rubberband(50, 400);
    const large = rubberband(200, 400);
    // Rate of increase should slow down
    assert.ok(large / 200 < small / 50, "Resistance should increase with distance");
  });

  it("respects custom constant", () => {
    const soft = rubberband(100, 400, 0.8);
    const hard = rubberband(100, 400, 0.3);
    assert.ok(soft > hard, "Higher constant = less resistance");
  });
});

describe("nearestSnap()", () => {
  it("returns nearest snap point", () => {
    assert.equal(nearestSnap(7, [0, 5, 10, 15]), 5);
    assert.equal(nearestSnap(8, [0, 5, 10, 15]), 10);
    assert.equal(nearestSnap(12, [0, 5, 10, 15]), 10);
  });

  it("handles exact match", () => {
    assert.equal(nearestSnap(10, [0, 10, 20]), 10);
  });

  it("handles empty array (returns projected)", () => {
    assert.equal(nearestSnap(42, []), 42);
  });

  it("handles single snap point", () => {
    assert.equal(nearestSnap(100, [0]), 0);
  });

  it("handles negative values", () => {
    assert.equal(nearestSnap(-80, [-100, -50, 0]), -100);
    assert.equal(nearestSnap(-30, [-100, -50, 0]), -50);
  });
});

describe("normalizeVelocity()", () => {
  it("normalizes velocity relative to distance", () => {
    assert.equal(normalizeVelocity(50, 100), 0.5);
    assert.equal(normalizeVelocity(100, 100), 1.0);
  });

  it("handles zero distance (no division by zero)", () => {
    assert.equal(normalizeVelocity(100, 0), 0);
  });
});

describe("clamp()", () => {
  it("clamps below min", () => {
    assert.equal(clamp(-5, 0, 100), 0);
  });

  it("clamps above max", () => {
    assert.equal(clamp(150, 0, 100), 100);
  });

  it("returns value when in range", () => {
    assert.equal(clamp(50, 0, 100), 50);
  });
});

describe("lerp()", () => {
  it("interpolates correctly", () => {
    assert.equal(lerp(0, 100, 0.5), 50);
    assert.equal(lerp(0, 100, 0), 0);
    assert.equal(lerp(0, 100, 1), 100);
  });
});

describe("mapRange()", () => {
  it("maps value from one range to another", () => {
    assert.equal(mapRange(5, 0, 10, 0, 100), 50);
    assert.equal(mapRange(0, 0, 10, 50, 150), 50);
    assert.equal(mapRange(10, 0, 10, 50, 150), 150);
  });
});
