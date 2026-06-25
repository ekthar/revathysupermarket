import assert from "node:assert/strict";
import test from "node:test";
import { calculateDistanceKm, isWithinDeliveryRadius } from "../lib/distance";

test("calculateDistanceKm returns 0 for the same point", () => {
  const point = { lat: 8.644361, lng: 76.843472 };
  assert.equal(calculateDistanceKm(point, point), 0);
});

test("calculateDistanceKm returns correct Haversine distance for known coordinates", () => {
  // Store location: 8.644361, 76.843472 (Trivandrum area)
  // A point approximately 3km north
  const store = { lat: 8.644361, lng: 76.843472 };
  const customer = { lat: 8.671361, lng: 76.843472 }; // ~3km due north
  const distance = calculateDistanceKm(customer, store);
  assert.ok(distance > 2.5 && distance < 3.5, `Expected ~3km, got ${distance}`);
});

test("calculateDistanceKm handles real-world distance accuracy", () => {
  // Trivandrum to Kochi: approximately 170km by straight line (Haversine)
  const trivandrum = { lat: 8.5241, lng: 76.9366 };
  const kochi = { lat: 9.9312, lng: 76.2673 };
  const distance = calculateDistanceKm(trivandrum, kochi);
  assert.ok(distance > 160 && distance < 180, `Expected ~170km, got ${distance}`);
});

test("isWithinDeliveryRadius returns true for a point within 5km", () => {
  const store = { lat: 8.644361, lng: 76.843472 };
  // About 2km away
  const nearby = { lat: 8.662361, lng: 76.843472 };
  assert.equal(isWithinDeliveryRadius(nearby, 5, store), true);
});

test("isWithinDeliveryRadius returns false for a point beyond 5km", () => {
  const store = { lat: 8.644361, lng: 76.843472 };
  // About 10km away
  const farAway = { lat: 8.734361, lng: 76.843472 };
  assert.equal(isWithinDeliveryRadius(farAway, 5, store), false);
});

test("isWithinDeliveryRadius uses default store coordinates", () => {
  // The default store is at { lat: 8.644361, lng: 76.843472 }
  // A point very close to it should be within any reasonable radius
  const nearStore = { lat: 8.645, lng: 76.844 };
  assert.equal(isWithinDeliveryRadius(nearStore, 5), true);
});

test("calculateDistanceKm is commutative", () => {
  const pointA = { lat: 8.644361, lng: 76.843472 };
  const pointB = { lat: 8.700000, lng: 76.900000 };
  const distanceAB = calculateDistanceKm(pointA, pointB);
  const distanceBA = calculateDistanceKm(pointB, pointA);
  assert.equal(distanceAB, distanceBA);
});
