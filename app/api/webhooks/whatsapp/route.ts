import { NextResponse } from "next/server";
import { updateWhatsAppMessageStatus } from "@/lib/whatsapp-business";

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
  const body = await request.json().catch(() => null);
  const statuses = body?.entry?.flatMap((entry: { changes?: Array<{ value?: { statuses?: unknown[] } }> }) =>
    entry.changes?.flatMap((change) => change.value?.statuses ?? []) ?? []
  ) ?? [];

  await Promise.all(
    statuses.map((status: { id?: string; status?: string }) =>
      status.id && status.status ? updateWhatsAppMessageStatus(status.id, status.status) : Promise.resolve()
    )
  );

  return NextResponse.json({ ok: true });
}
