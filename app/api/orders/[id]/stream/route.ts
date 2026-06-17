import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/authz";

export const dynamic = "force-dynamic";

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

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = async () => {
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
            }
          }
        });
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          status: latest?.status,
          deliveryPartnerLocation: latest?.deliveryPartner?.currentLatitude && latest.deliveryPartner.currentLongitude ? {
            latitude: Number(latest.deliveryPartner.currentLatitude),
            longitude: Number(latest.deliveryPartner.currentLongitude),
            updatedAt: latest.deliveryPartner.locationUpdatedAt?.toISOString()
          } : null
        })}\n\n`));
      };
      send();
      const timer = setInterval(send, 10000);
      return () => clearInterval(timer);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
