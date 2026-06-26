import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const newMessageSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify ticket ownership
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { customerId: true },
    });

    if (!ticket || ticket.customerId !== auth.userId) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const messages = await prisma.supportMessage.findMany({
      where: { ticketId: id },
      select: {
        id: true,
        body: true,
        authorId: true,
        createdAt: true,
        author: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const items = messages.map((m) => ({
      id: m.id,
      body: m.body,
      authorId: m.authorId,
      authorName: m.author.name,
      authorRole: m.author.role,
      isMe: m.authorId === auth.userId,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify ticket ownership
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { customerId: true, status: true },
    });

    if (!ticket || ticket.customerId !== auth.userId) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
      return NextResponse.json({ error: "Ticket is closed" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = newMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const message = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        authorId: auth.userId,
        body: parsed.data.body,
      },
      select: {
        id: true,
        body: true,
        authorId: true,
        createdAt: true,
      },
    });

    // Re-open ticket if it was waiting for customer
    if (ticket.status === "WAITING_FOR_CUSTOMER") {
      await prisma.supportTicket.update({
        where: { id },
        data: { status: "OPEN" },
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
