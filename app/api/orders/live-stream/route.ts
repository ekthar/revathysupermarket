import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream({
    async start(controller) {
      async function send() {
        if (request.signal.aborted) return;
        const orders = await prisma.order.findMany({ where: { userId: session!.user!.id, status: { notIn: ["DELIVERED", "CANCELLED"] } }, select: { id: true, status: true, updatedAt: true, deliveryPartner: { select: { currentLatitude: true, currentLongitude: true, locationUpdatedAt: true } } } }).catch(() => []);
        const payload = orders.map((order) => ({ id: order.id, status: order.status, updatedAt: order.updatedAt.toISOString(), deliveryPartnerLocation: order.deliveryPartner?.currentLatitude && order.deliveryPartner.currentLongitude ? { latitude: Number(order.deliveryPartner.currentLatitude), longitude: Number(order.deliveryPartner.currentLongitude), updatedAt: order.deliveryPartner.locationUpdatedAt?.toISOString() } : null }));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      }
      await send(); timer = setInterval(send, 10000);
    },
    cancel() { if (timer) clearInterval(timer); }
  });
  request.signal.addEventListener("abort", () => { if (timer) clearInterval(timer); });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" } });
}
