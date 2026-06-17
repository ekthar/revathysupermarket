import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AccountClient } from "@/components/account/account-client";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  const user = session?.user?.id ? await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] } }
  }) : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5">
        <p className="text-xs font-black uppercase text-primary">Account</p>
        <h1 className="mt-2 font-display text-4xl font-black">Profile</h1>
      </section>
      {user ? (
        <AccountClient
          user={{ name: user.name ?? "", email: user.email ?? "", phone: user.phone ?? "" }}
          addresses={user.addresses.map((address) => ({
            id: address.id,
            label: address.label,
            houseName: address.houseName,
            street: address.street,
            landmark: address.landmark,
            pincode: address.pincode,
            isDefault: address.isDefault
          }))}
        />
      ) : (
        <div className="mt-5 rounded-2xl border border-border p-6">Please log in to manage your account.</div>
      )}
    </main>
  );
}
