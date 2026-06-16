import { SITE } from "@/lib/constants";
import { deliverySummary, serviceablePincodes } from "@/lib/delivery";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Megaphone, Save, Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Store control</p>
        <h2 className="mt-2 font-display text-4xl font-black leading-tight">Settings</h2>
        <p className="mt-2 text-sm text-muted-foreground">Manage contact details, delivery radius, map links, and offers.</p>
      </div>
      <form className="mt-5 grid gap-4 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5 md:grid-cols-2">
        <div className="flex items-center gap-3 md:col-span-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </span>
          <h3 className="font-display text-2xl font-black">Store details</h3>
        </div>
        <Input defaultValue={SITE.name} placeholder="Store name" className="h-12 rounded-2xl" />
        <Input defaultValue={SITE.phone} placeholder="Phone number" className="h-12 rounded-2xl" />
        <Input defaultValue={SITE.whatsapp} placeholder="WhatsApp number" className="h-12 rounded-2xl" />
        <Input defaultValue={String(SITE.deliveryRadiusKm)} placeholder="Delivery radius" className="h-12 rounded-2xl" />
        <Input defaultValue={serviceablePincodes().join(", ")} placeholder="Serviceable pincodes" className="h-12 rounded-2xl" />
        <Input defaultValue={SITE.address} placeholder="Address" className="h-12 rounded-2xl md:col-span-2" />
        <Input placeholder="Google Maps place link" className="h-12 rounded-2xl md:col-span-2" />
        <Input placeholder="Instagram URL" className="h-12 rounded-2xl" />
        <Input placeholder="Facebook URL" className="h-12 rounded-2xl" />
        <Button className="md:col-span-2">
          <Save className="h-4 w-4" />
          Save settings
        </Button>
      </form>
      <div className="mt-5 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-fresh/20">
            <Megaphone className="h-5 w-5 text-primary" />
          </span>
          <h3 className="font-display text-2xl font-black">Banner management</h3>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input placeholder="Offer title" className="h-12 rounded-2xl" />
          <Input placeholder="Homepage banner image URL" className="h-12 rounded-2xl" />
          <Input placeholder="Promotion link" className="h-12 rounded-2xl" />
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-border px-4">
            <input type="checkbox" defaultChecked />
            <span className="text-sm font-bold">Enable promotion</span>
          </label>
        </div>
      </div>
      <div className="mt-5 rounded-[1.75rem] border border-white/70 bg-primary p-5 text-white shadow-soft dark:border-white/10">
        <MapPin className="h-6 w-6 text-lime-fresh" />
        <h3 className="mt-3 font-display text-2xl font-black">Delivery radius</h3>
        <p className="mt-2 text-sm leading-6 text-white/80">
          Checkout uses store coordinates, GPS distance, and pincode validation. {deliverySummary()}
        </p>
      </div>
    </div>
  );
}
