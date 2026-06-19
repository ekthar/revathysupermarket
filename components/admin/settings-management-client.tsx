"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Eye, EyeOff, ImagePlus, Megaphone, MessageCircle, Save, Settings, Trash2, Upload } from "lucide-react";
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
  banners,
  whatsappConfig
  ,
  templateStatuses
}: {
  settings: StoreSettings;
  banners: Banner[];
  whatsappConfig: {
    phoneNumberIdConfigured: boolean;
    apiTokenConfigured: boolean;
    verifyTokenConfigured: boolean;
    businessPhone: string;
  };
  templateStatuses: Record<string, string>;
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
  const [testPhone, setTestPhone] = useState(whatsappConfig.businessPhone);
  const [localTemplateStatuses, setLocalTemplateStatuses] = useState(templateStatuses);
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

  async function sendTestMessage() {
    const response = await fetch("/api/admin/whatsapp-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testPhone })
    });
    const data = await readApiResponse<{ error?: string; success?: boolean }>(response);
    if (!response.ok || !data.success) {
      showToast(data.error ?? "Test message failed", "error");
      return;
    }
    showToast("WhatsApp test message sent", "success");
  }

  async function updateTemplateStatus(template: string, status: string) {
    setLocalTemplateStatuses((current) => ({ ...current, [template]: status }));
    const response = await fetch("/api/admin/whatsapp-template-status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template, status })
    });
    if (!response.ok) showToast("Template status could not be saved", "error");
  }

  return (
    <>
      {/* Logo Upload Section */}
      <LogoUploadSection />

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
        <Input value={form.deliveryRadiusKm} onChange={(event) => update("deliveryRadiusKm", Number(event.target.value))} type="number" min="1" max="50" placeholder="Delivery radius KM" className="h-12 rounded-2xl" />
        <Input value={form.serviceablePincodes} onChange={(event) => update("serviceablePincodes", event.target.value)} placeholder="Serviceable pincodes" className="h-12 rounded-2xl md:col-span-2" />
        <Input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Address" className="h-12 rounded-2xl md:col-span-2" />
        <Input value={form.googleMapsUrl} onChange={(event) => update("googleMapsUrl", event.target.value)} placeholder="Google Maps place link" className="h-12 rounded-2xl md:col-span-2" />
        <Input value={form.instagramUrl} onChange={(event) => update("instagramUrl", event.target.value)} placeholder="Instagram URL" className="h-12 rounded-2xl" />
        <Input value={form.facebookUrl} onChange={(event) => update("facebookUrl", event.target.value)} placeholder="Facebook URL" className="h-12 rounded-2xl" />
        <div className="mt-2 flex items-center gap-3 border-t border-border pt-4 md:col-span-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-fresh/20 text-primary">
            %
          </span>
          <div>
            <h4 className="font-display text-xl font-black">GST billing</h4>
            <p className="text-xs font-bold text-muted-foreground">Prices stay inclusive. Bills show taxable value, CGST, and SGST.</p>
          </div>
        </div>
        <Input value={form.gstBusinessName} onChange={(event) => update("gstBusinessName", event.target.value)} placeholder="GST business name" className="h-12 rounded-2xl" />
        <Input value={form.gstin} onChange={(event) => update("gstin", event.target.value.toUpperCase())} placeholder="GSTIN" className="h-12 rounded-2xl" />
        <Input value={form.gstRatePercent} onChange={(event) => update("gstRatePercent", Number(event.target.value))} type="number" min="0" max="28" step="0.01" placeholder="GST rate %" className="h-12 rounded-2xl" />
        <Button className="md:col-span-2" disabled={isPending}>
          <Save className="h-4 w-4" />
          Save settings
        </Button>
      </form>

      <section className="mt-5 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <MessageCircle className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h3 className="font-display text-2xl font-black">WhatsApp Business API</h3>
            <p className="text-xs font-bold text-muted-foreground">Secrets are read from environment variables and kept masked.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ConfigStatus label="Phone number ID" configured={whatsappConfig.phoneNumberIdConfigured} />
          <ConfigStatus label="API token" configured={whatsappConfig.apiTokenConfigured} />
          <ConfigStatus label="Webhook verify token" configured={whatsappConfig.verifyTokenConfigured} />
          <div className="rounded-2xl border border-border bg-background/70 p-3">
            <p className="text-xs font-black uppercase text-muted-foreground">Business phone</p>
            <p className="mt-1 font-black">{whatsappConfig.businessPhone || "Not configured"}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <Input value={testPhone} onChange={(event) => setTestPhone(event.target.value)} placeholder="Test phone number" className="h-12 rounded-2xl" />
          <Button type="button" onClick={sendTestMessage}>
            <MessageCircle className="h-4 w-4" />
            Test message
          </Button>
        </div>
        <div className="mt-4 grid gap-2 text-sm font-bold text-muted-foreground">
          {["login_otp", "order_confirmed", "order_packed", "delivery_assigned", "out_for_delivery", "delivered", "order_edited", "return_approved"].map((template) => (
            <div key={template} className="grid gap-2 rounded-2xl bg-muted px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <span>{template}</span>
              <select
                value={localTemplateStatuses[template] ?? "pending"}
                onChange={(event) => updateTemplateStatus(template, event.target.value)}
                className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-black outline-none"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          ))}
        </div>
      </section>

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

function ConfigStatus({ label, configured }: { label: string; configured: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-3">
      <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
      <p className={configured ? "mt-1 font-black text-primary" : "mt-1 font-black text-red-600"}>
        {configured ? "Configured" : "Missing"}
      </p>
    </div>
  );
}

function LogoUploadSection() {
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Logo too large. Max 2MB.", "error");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("logo", file);

    try {
      const res = await fetch("/api/admin/logo", { method: "POST", body: formData });
      const data = await readApiResponse<{ logoUrl?: string; error?: string }>(res);
      if (res.ok && data.logoUrl) {
        setLogoUrl(data.logoUrl);
        showToast("Logo uploaded!", "success");
      } else {
        showToast(data.error || "Upload failed", "error");
      }
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-5 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
          <ImagePlus className="h-5 w-5 text-primary" />
        </span>
        <div>
          <h3 className="font-display text-2xl font-black">Store Logo</h3>
          <p className="text-xs font-bold text-muted-foreground">Upload your store logo. Used in PWA, splash screen, and header.</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="h-20 w-20 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt="Store logo" className="h-full w-full object-contain" />
          ) : (
            <Camera className="h-6 w-6 text-primary/40" />
          )}
        </div>
        <div className="flex-1">
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Logo"}
          </Button>
          <p className="mt-2 text-[10px] text-muted-foreground">PNG, SVG, or JPG. Max 2MB. Square recommended.</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
        </div>
      </div>
    </div>
  );
}
