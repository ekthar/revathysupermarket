import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/authz";

export const dynamic = "force-dynamic";

async function trackingPayload(id: string) {
  const latest = await prisma.order.findUnique({
    where: { id },
    select: {
      status: true,
      deliveryPartner: {
        select: {
          currentLatitude: true,
          currentLongitude: true,
          locationUpdatedAt: true
        }
      },
      deliveryLocationEvents: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { heading: true }
      }
    }
  });

  const headingValue = latest?.deliveryLocationEvents?.[0]?.heading ?? undefined;

  return {
    status: latest?.status,
    deliveryPartnerLocation: latest?.deliveryPartner?.currentLatitude && latest.deliveryPartner.currentLongitude ? {
      latitude: Number(latest.deliveryPartner.currentLatitude),
      longitude: Number(latest.deliveryPartner.currentLongitude),
      updatedAt: latest.deliveryPartner.locationUpdatedAt?.toISOString(),
      ...(headingValue !== undefined && headingValue !== null ? { heading: headingValue } : {})
    } : null
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { userId: true }
  });
  if (!order || (!isStaffRole(session?.user?.role) && order.userId !== session?.user?.id)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  };

  if (process.env.VERCEL || process.env.ENABLE_LONG_SSE_TRACKING !== "true") {
    return new Response(`data: ${JSON.stringify(await trackingPayload(id))}\n\n`, { headers });
  }

  let timer: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = async () => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(await trackingPayload(id))}\n\n`));
      };
      send();
      timer = setInterval(send, 10000);
    },
    cancel() {
      if (timer) clearInterval(timer);
    }
  });

  return new Response(stream, { headers });
}
