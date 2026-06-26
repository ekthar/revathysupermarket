import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSettings } from "@/lib/authz";
import webpush from "web-push";
import { createNotification } from "@/lib/notifications";

const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
const subject = process.env.WEB_PUSH_SUBJECT ?? "mailto:owner@msmsupermarket.in";

let configured = false;
function configureWebPush() {
  if (configured || !publicKey || !privateKey) return Boolean(publicKey && privateKey);
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

const broadcastSchema = z.object({
  title: z.string().min(2).max(100),
  body: z.string().min(2).max(300),
  url: z.string().optional().default("/"),
  imageUrl: z.string().url().optional(),
  audience: z.enum(["all", "customers", "staff"]).default("all"),
  templateId: z.string().optional()
});

// GET /api/admin/push-broadcast - Get broadcast history
export async function GET() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const history = await prisma.setting.findMany({
    where: { key: { startsWith: "pushBroadcast:" } },
    orderBy: { createdAt: "desc" },
    take: 20
  }).catch(() => []);

  const broadcasts = history.map((h) => {
    try { return { id: h.id, ...JSON.parse(h.value), createdAt: h.createdAt }; }
    catch { return null; }
  }).filter(Boolean);

  return NextResponse.json({ broadcasts });
}

// POST /api/admin/push-broadcast - Send push to all/segment
export async function POST(request: Request) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = broadcastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid notification data." }, { status: 400 });
  }

  if (!configureWebPush()) {
    return NextResponse.json({ error: "Web Push not configured. Set NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY and WEB_PUSH_PRIVATE_KEY in environment." }, { status: 500 });
  }

  const { title, body: notifBody, url, imageUrl, audience } = parsed.data;

  // Get target subscriptions based on audience
  let subscriptions;
  // Intentionally unbounded - must reach all subscribers for broadcast delivery
  if (audience === "customers") {
    subscriptions = await prisma.pushSubscription.findMany({
      where: { user: { role: "CUSTOMER" } },
      include: { user: { select: { id: true } } }
    });
  } else if (audience === "staff") {
    subscriptions = await prisma.pushSubscription.findMany({
      where: { user: { role: { in: ["ADMIN", "STAFF", "OWNER", "MANAGER", "PACKING_STAFF", "DELIVERY_PARTNER"] } } },
      include: { user: { select: { id: true } } }
    });
  } else {
    subscriptions = await prisma.pushSubscription.findMany({
      include: { user: { select: { id: true } } }
    });
  }

  const payload = JSON.stringify({
    title,
    body: notifBody,
    url,
    image: imageUrl,
    badge: "/icons/icon-192.png"
  });

  let sent = 0;
  let failed = 0;
  const deadEndpoints: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (error) {
        failed++;
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          deadEndpoints.push(sub.endpoint);
        }
      }
    })
  );

  // Clean up dead subscriptions
  if (deadEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: deadEndpoints } }
    }).catch(() => null);
  }

  // Also create in-app notifications for all targeted users
  const userIds = [...new Set(subscriptions.map((s) => s.user.id))];
  await Promise.allSettled(
    userIds.map((userId) =>
      createNotification({ userId, title, body: notifBody, type: "promo" })
    )
  );

  // Save to broadcast history
  await prisma.setting.create({
    data: {
      key: `pushBroadcast:${Date.now()}`,
      value: JSON.stringify({ title, body: notifBody, url, audience, sent, failed, total: subscriptions.length })
    }
  }).catch(() => null);

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: subscriptions.length,
    cleaned: deadEndpoints.length
  });
}
