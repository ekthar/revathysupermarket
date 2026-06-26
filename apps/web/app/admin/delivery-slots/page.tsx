import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSettings } from "@/lib/authz";
import { DeliverySlotsClient } from "@/components/admin/delivery-slots-client";
export const dynamic = "force-dynamic";
export default async function DeliverySlotsPage() { const session = await auth(); if (!canManageSettings(session?.user?.role)) return <p className="rounded-2xl bg-red-50 p-4 text-red-700">You do not have access to delivery-slot settings.</p>; const slots = await prisma.deliverySlot.findMany({ where: { endsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" } }); return <div><h1 className="font-display text-3xl font-black">Delivery slots</h1><p className="mt-1 text-sm text-muted-foreground">Control same-day capacity without overbooking the store team.</p><div className="mt-5"><DeliverySlotsClient initialSlots={slots.map((slot) => ({ ...slot, startsAt: slot.startsAt.toISOString(), endsAt: slot.endsAt.toISOString() }))} /></div></div>; }
