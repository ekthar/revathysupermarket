import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { returnRequestSchema } from "@/lib/validations";

const RETURN_WINDOW_HOURS = Number(process.env.RETURN_WINDOW_HOURS ?? 48);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = returnRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid return request." }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order || order.userId !== session.user.id) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "DELIVERED") return NextResponse.json({ error: "Returns are available after delivery." }, { status: 400 });
  const ageHours = (Date.now() - order.updatedAt.getTime()) / 36e5;
  if (ageHours > RETURN_WINDOW_HOURS) return NextResponse.json({ error: "The return window has closed." }, { status: 400 });

  const itemMap = new Map(order.items.map((item) => [item.id, item]));
  const items = parsed.data.items.map((requested) => {
    const item = itemMap.get(requested.orderItemId);
    if (!item || requested.quantity > item.quantity) throw new Error("Invalid return quantity.");
    return {
      orderItemId: item.id,
      name: item.name,
      quantity: requested.quantity,
      price: Number(item.price),
      amount: Number(item.price) * requested.quantity
    };
  });
  const refundAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const returnRequest = await prisma.returnRequest.create({
    data: {
      orderId: id,
      items,
      reason: parsed.data.reason,
      photoUrl: parsed.data.photoUrl || null,
      note: parsed.data.note,
      refundAmount
    }
  });
  await writeAuditLog({
    actorId: session.user.id,
    actorRole: session.user.role,
    action: "return_requested",
    targetType: "ReturnRequest",
    targetId: returnRequest.id,
    metadata: { orderId: id, refundAmount }
  });

  return NextResponse.json({ returnRequest });
}
