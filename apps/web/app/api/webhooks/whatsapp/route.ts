import { NextResponse } from "next/server";
import { updateWhatsAppMessageStatus } from "@/lib/whatsapp-business";
import { verifyHmacSignature } from "@/lib/security";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Invalid verification token." }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyHmacSignature(rawBody, request.headers.get("x-hub-signature-256"), process.env.WHATSAPP_APP_SECRET)) {
    return NextResponse.json({ error: "Invalid webhook signature.", code: "INVALID_SIGNATURE" }, { status: 401 });
  }
  let body: { entry?: Array<{ changes?: Array<{ value?: { statuses?: unknown[] } }> }> } | null = null;
  try { body = JSON.parse(rawBody || "null"); } catch { return NextResponse.json({ error: "Invalid webhook payload.", code: "INVALID_PAYLOAD" }, { status: 400 }); }
  const statuses = (body?.entry?.flatMap((entry: { changes?: Array<{ value?: { statuses?: unknown[] } }> }) =>
    entry.changes?.flatMap((change) => change.value?.statuses ?? []) ?? []
  ) ?? []) as Array<{ id?: string; status?: string }>;

  await Promise.all(
    statuses.map((status: { id?: string; status?: string }) =>
      status.id && status.status ? updateWhatsAppMessageStatus(status.id, status.status) : Promise.resolve()
    )
  );

  return NextResponse.json({ ok: true });
}
