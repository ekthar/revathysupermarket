import { NextResponse } from "next/server";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:19006",
  "http://127.0.0.1:19006",
  "capacitor://localhost",
  "https://revathysupermarket.vercel.app",
];

function allowedOrigins() {
  const configured = process.env.MOBILE_CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set(configured?.length ? configured : DEFAULT_ALLOWED_ORIGINS);
}

export function isAllowedMobileCorsOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && allowedOrigins().has(origin));
}

export function mobileCorsHeaders(request: Request) {
  const headers = new Headers();
  const origin = request.headers.get("origin");

  if (origin && allowedOrigins().has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");

  return headers;
}

export function mobileOptionsResponse(request: Request) {
  return new Response(null, {
    status: 204,
    headers: mobileCorsHeaders(request),
  });
}

export function mobileJson(
  request: Request,
  body: unknown,
  init?: ResponseInit
) {
  const headers = mobileCorsHeaders(request);
  const initHeaders = new Headers(init?.headers);

  initHeaders.forEach((value, key) => headers.set(key, value));

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}
