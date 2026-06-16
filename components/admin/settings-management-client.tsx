"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Megaphone, Save, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast-provider";
import { readApiResponse } from "@/lib/client-api";
import type { StoreSettings } from "@/lib/store-settings";

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  href?: string | null;
  isActive: boolean;
};

export function SettingsManagementClient({
  settings,
  banners
}: {
  settings: StoreSettings;
  banners: Banner[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    ...settings,
    serviceablePincodes: settings.serviceablePincodes.join(", ")
  });
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    image: "",
    href: "",
    isActive: true
  });
  const [localBanners, setLocalBanners] = useState(banners);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      ...form,
      deliveryRadiusKm: Number(form.deliveryRadiusKm),
      serviceablePincodes: form.serviceablePincodes
        .split(",")
        .map((pincode) => pincode.trim())
        .filter(Boolean)
    };
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await readApiResponse<{ error?: string }>(response);
    if (!response.ok) {
      showToast(data.error ?? "Settings could not be saved", "error");
      return;
    }
    showToast("Settings saved everywhere", "success");
    startTransition(() => router.refresh());
  }

  async function createBanner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bannerForm)
    });
    const data = await readApiResponse<{ banner?: Banner; error?: string }>(response);
    if (!response.ok || !data.banner) {
      showToast(data.error ?? "Banner could not be saved", "error");
      return;
    }
    setLocalBanners((current) => [data.banner!, ...current]);
    setBannerForm({ title: "", subtitle: "", image: "", href: "", isActive: true });
    showToast("Homepage banner saved", "success");
    startTransition(() => router.refresh());
  }

  async function toggleBanner(banner: Banner) {
    setLocalBanners((current) => current.map((item) => (item.id === banner.id ? { ...item, isActive: !item.isActive } : item)));
    const response = await fetch(`/api/admin/banners/${banner.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !banner.isActive })
    });
    const data = await readApiResponse<{ error?: string }>(response);
    if (!response.ok) {
      setLocalBanners((current) => current.map((item) => (item.id === banner.id ? banner : item)));
      showToast(data.error ?? "Banner could not be updated", "error");
      return;
    }
    showToast(!banner.isActive ? "Banner enabled" : "Banner disabled", "success");
    startTransition(() => router.refresh());
  }

  async function deleteBanner(banner: Banner) {
    setLocalBanners((current) => current.filter((item) => item.id !== banner.id));
    const response = await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" });
    const data = await readApiResponse<{ error?: string }>(response);
    if (!response.ok) {
      setLocalBanners((current) => [banner, ...current]);
      showToast(data.error ?? "Banner could not be deleted", "error");
      return;
    }
    showToast("Banner deleted", "success");
    startTransition(() => router.refresh());
  }

  return (
    <>
      <form onSubmit={saveSettings} className="mt-5 grid gap-4 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5 md:grid-cols-2">
        <div className="flex items-center gap-3 md:col-span-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </span>
          <h3 className="font-display text-2xl font-black">Store details</h3>
        </div>
        <Input value={form.storeName} onChange={(event) => update("storeName", event.target.value)} placeholder="Store name" className="h-12 rounded-2xl" />
        <Input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Phone number" className="h-12 rounded-2xl" />
        <Input value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} placeholder="WhatsApp number" className="h-12 rounded-2xl" />
        <Input value={form.deliveryRadiusKm} onChange={(event) => update("deliveryRadiusKm", Number(event.target.value))} type="number" min="1" max="25" placeholder="Delivery radius KM" className="h-12 rounded-2xl" />
        <Input value={form.serviceablePincodes} onChange={(event) => update("serviceablePincodes", event.target.value)} placeholder="Serviceable pincodes" className="h-12 rounded-2xl md:col-span-2" />
        <Input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Address" className="h-12 rounded-2xl md:col-span-2" />
        <Input value={form.googleMapsUrl} onChange={(event) => update("googleMapsUrl", event.target.value)} placeholder="Google Maps place link" className="h-12 rounded-2xl md:col-span-2" />
        <Input value={form.instagramUrl} onChange={(event) => update("instagramUrl", event.target.value)} placeholder="Instagram URL" className="h-12 rounded-2xl" />
        <Input value={form.facebookUrl} onChange={(event) => update("facebookUrl", event.target.value)} placeholder="Facebook URL" className="h-12 rounded-2xl" />
        <Button className="md:col-span-2" disabled={isPending}>
          <Save className="h-4 w-4" />
          Save settings
        </Button>
      </form>

      <form onSubmit={createBanner} className="mt-5 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-fresh/20">
            <Megaphone className="h-5 w-5 text-primary" />
          </span>
          <h3 className="font-display text-2xl font-black">Banner management</h3>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input required value={bannerForm.title} onChange={(event) => setBannerForm((current) => ({ ...current, title: event.target.value }))} placeholder="Offer title" className="h-12 rounded-2xl" />
          <Input value={bannerForm.subtitle} onChange={(event) => setBannerForm((current) => ({ ...current, subtitle: event.target.value }))} placeholder="Subtitle" className="h-12 rounded-2xl" />
          <Input required value={bannerForm.image} onChange={(event) => setBannerForm((current) => ({ ...current, image: event.target.value }))} placeholder="Homepage banner image URL" className="h-12 rounded-2xl md:col-span-2" />
          <Input value={bannerForm.href} onChange={(event) => setBannerForm((current) => ({ ...current, href: event.target.value }))} placeholder="Promotion link" className="h-12 rounded-2xl" />
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-border px-4">
            <input type="checkbox" checked={bannerForm.isActive} onChange={(event) => setBannerForm((current) => ({ ...current, isActive: event.target.checked }))} />
            <span className="text-sm font-bold">Enable promotion</span>
          </label>
          <Button className="md:col-span-2">
            <Save className="h-4 w-4" />
            Save banner
          </Button>
        </div>

        <div className="mt-5 grid gap-3">
          {localBanners.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm font-bold text-muted-foreground">No banners yet.</p>
          ) : localBanners.map((banner) => (
            <article key={banner.id} className="grid gap-3 rounded-[1.35rem] border border-border bg-background/70 p-3 sm:grid-cols-[110px_1fr]">
              <img src={banner.image} alt={banner.title} className="aspect-video w-full rounded-2xl object-cover sm:aspect-square" />
              <div className="min-w-0">
                <p className={banner.isActive ? "text-xs font-black uppercase text-primary" : "text-xs font-black uppercase text-muted-foreground"}>{banner.isActive ? "Active" : "Disabled"}</p>
                <h4 className="truncate font-black">{banner.title}</h4>
                {banner.subtitle && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{banner.subtitle}</p>}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleBanner(banner)}>
                    {banner.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {banner.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => deleteBanner(banner)} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </form>
    </>
  );
}
