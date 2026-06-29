"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Eye, EyeOff, ImagePlus, Megaphone, MessageCircle, Save, Search, Settings, Trash2, Upload } from "lucide-react";
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
      {/* Settings Search */}
      <SettingsSearch />

      {/* Logo Upload Section */}
      <LogoUploadSection />

      <form onSubmit={saveSettings} className="mt-5 grid gap-4 rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5 md:grid-cols-2">
        <div className="flex items-center gap-3 md:col-span-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </span>
          <h3 className="font-display text-2xl font-black">Store details</h3>
        </div>
        <FieldGroup label="Store Name">
          <Input value={form.storeName} onChange={(event) => update("storeName", event.target.value)} placeholder="e.g. Revathy Supermarket" className="h-12 rounded-2xl" />
        </FieldGroup>
        <FieldGroup label="Phone Number">
          <Input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="e.g. 9895799990" className="h-12 rounded-2xl" />
        </FieldGroup>
        <FieldGroup label="WhatsApp Number">
          <Input value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} placeholder="e.g. 9895799990" className="h-12 rounded-2xl" />
        </FieldGroup>
        <FieldGroup label="Delivery Radius (km)">
          <Input value={form.deliveryRadiusKm} onChange={(event) => update("deliveryRadiusKm", Number(event.target.value))} type="number" min="1" max="50" placeholder="e.g. 50" className="h-12 rounded-2xl" />
        </FieldGroup>
        <div className="md:col-span-2">
          <FieldGroup label="Serviceable Pincodes" hint="Comma-separated. Used for reference only — delivery uses GPS distance.">
            <PincodeTagInput value={form.serviceablePincodes} onChange={(value) => update("serviceablePincodes", value)} />
          </FieldGroup>
        </div>
        <div className="md:col-span-2">
          <FieldGroup label="Store Address">
            <Input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="e.g. Kerala, India" className="h-12 rounded-2xl" />
          </FieldGroup>
        </div>
        <div className="md:col-span-2">
          <FieldGroup label="Google Maps Link">
            <Input value={form.googleMapsUrl} onChange={(event) => update("googleMapsUrl", event.target.value)} placeholder="e.g. https://maps.app.goo.gl/..." className="h-12 rounded-2xl" />
          </FieldGroup>
        </div>
        <FieldGroup label="Instagram URL">
          <Input value={form.instagramUrl} onChange={(event) => update("instagramUrl", event.target.value)} placeholder="e.g. https://instagram.com/yourstore" className="h-12 rounded-2xl" />
        </FieldGroup>
        <FieldGroup label="Facebook URL">
          <Input value={form.facebookUrl} onChange={(event) => update("facebookUrl", event.target.value)} placeholder="e.g. https://facebook.com/yourstore" className="h-12 rounded-2xl" />
        </FieldGroup>
        <div className="mt-2 flex items-center gap-3 border-t border-border pt-4 md:col-span-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-fresh/20 text-primary">
            %
          </span>
          <div>
            <h4 className="font-display text-xl font-black">GST billing</h4>
            <p className="text-xs font-bold text-muted-foreground">Prices stay inclusive. Bills show taxable value, CGST, and SGST.</p>
          </div>
        </div>
        <FieldGroup label="GST Business Name">
          <Input value={form.gstBusinessName} onChange={(event) => update("gstBusinessName", event.target.value)} placeholder="e.g. Revathy Enterprises" className="h-12 rounded-2xl" />
        </FieldGroup>
        <FieldGroup label="GSTIN">
          <Input value={form.gstin} onChange={(event) => update("gstin", event.target.value.toUpperCase())} placeholder="e.g. 32AAACR1234F1Z5" className="h-12 rounded-2xl" />
        </FieldGroup>
        <FieldGroup label="GST Rate (%)">
          <Input value={form.gstRatePercent} onChange={(event) => update("gstRatePercent", Number(event.target.value))} type="number" min="0" max="28" step="0.01" placeholder="e.g. 5" className="h-12 rounded-2xl" />
        </FieldGroup>
        <div className="mt-2 flex items-center gap-3 border-t border-border pt-4 md:col-span-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-fresh/20 text-primary">
            ₹
          </span>
          <div>
            <h4 className="font-display text-xl font-black">Delivery & Order Settings</h4>
            <p className="text-xs font-bold text-muted-foreground">Delivery fee, free delivery threshold, and minimum order value.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-muted p-3 text-sm"><p className="font-black">Distance-based delivery pricing is active</p><a href="/admin/pricing" className="mt-1 inline-block font-bold text-primary underline">Manage delivery fee ranges</a></div>
        <FieldGroup label="Free Delivery Above (₹)" hint="Set to 0 for never free">
          <Input value={form.freeDeliveryThreshold} onChange={(event) => update("freeDeliveryThreshold", Number(event.target.value))} type="number" min="0" max="50000" step="1" placeholder="e.g. 500" className="h-12 rounded-2xl" />
        </FieldGroup>
        <FieldGroup label="Minimum Order Value (₹)">
          <Input value={form.minimumOrderValue} onChange={(event) => update("minimumOrderValue", Number(event.target.value))} type="number" min="0" max="10000" step="1" placeholder="e.g. 100" className="h-12 rounded-2xl" />
        </FieldGroup>
        <FieldGroup label="Delivery Estimate Min (mins)">
          <Input value={form.deliveryEstimateMin} onChange={(event) => update("deliveryEstimateMin", Number(event.target.value))} type="number" min="5" max="120" step="5" placeholder="e.g. 30" className="h-12 rounded-2xl" />
        </FieldGroup>
        <FieldGroup label="Delivery Estimate Max (mins)">
          <Input value={form.deliveryEstimateMax} onChange={(event) => update("deliveryEstimateMax", Number(event.target.value))} type="number" min="10" max="180" step="5" placeholder="e.g. 45" className="h-12 rounded-2xl" />
        </FieldGroup>
        <Button className="md:col-span-2" disabled={isPending}>
          <Save className="h-4 w-4" />
          Save settings
        </Button>
      </form>

      <section className="mt-5 rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5">
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

      <div className="mt-5 rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-fresh/20">
            <Megaphone className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h3 className="font-display text-2xl font-black">Banner management</h3>
            <p className="text-sm text-muted-foreground mt-1">Banners have moved to their own dedicated page with live preview, countdown scheduling, and more.</p>
          </div>
        </div>
        <a href="/admin/banners" className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-elevation-2 hover:bg-primary/90 transition">
          <Megaphone className="h-4 w-4" />
          Go to Banners
        </a>
      </div>
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
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Fetch current logo on mount so it persists across refreshes
  useEffect(() => {
    fetch("/api/admin/logo")
      .then((res) => res.ok ? res.json() : { logoUrl: null })
      .then((data) => {
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
          setLogoUrlInput(data.logoUrl);
        }
      })
      .catch(() => {});
  }, []);

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
        setLogoUrlInput(data.logoUrl);
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

  async function saveLogoUrl() {
    const url = logoUrlInput.trim();
    if (!url) {
      showToast("Enter a valid URL", "error");
      return;
    }
    try {
      new URL(url);
    } catch {
      showToast("Invalid URL format", "error");
      return;
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: url })
      });
      if (res.ok) {
        setLogoUrl(url);
        showToast("Logo URL saved!", "success");
      } else {
        showToast("Failed to save logo URL", "error");
      }
    } catch {
      showToast("Failed to save logo URL", "error");
    }
  }

  async function removeLogo() {
    setRemoving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: "" })
      });
      if (res.ok) {
        setLogoUrl(null);
        setLogoUrlInput("");
        showToast("Logo removed", "success");
      } else {
        showToast("Failed to remove logo", "error");
      }
    } catch {
      showToast("Failed to remove logo", "error");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
          <ImagePlus className="h-5 w-5 text-primary" />
        </span>
        <div>
          <h3 className="font-display text-2xl font-black">Store Logo</h3>
          <p className="text-xs font-bold text-muted-foreground">Upload or paste any image URL (Unsplash, Imgur, etc.)</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-20 w-20 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center overflow-hidden shrink-0">
          {logoUrl ? (
            <Image src={logoUrl} alt="Store logo" fill className="object-contain" unoptimized />
          ) : (
            <Camera className="h-6 w-6 text-primary/40" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={logoUrlInput}
              onChange={(e) => setLogoUrlInput(e.target.value)}
              placeholder="Paste logo URL (Unsplash, Imgur, etc.)"
              className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button type="button" size="sm" onClick={saveLogoUrl} disabled={!logoUrlInput.trim()}>
              Save
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Uploading..." : "Upload file"}
            </Button>
            {logoUrl && (
              <Button type="button" variant="outline" size="sm" onClick={removeLogo} disabled={removing} className="text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" />
                {removing ? "Removing..." : "Remove logo"}
              </Button>
            )}
            <span className="text-micro text-muted-foreground">PNG/SVG/JPG (max 2MB)</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
        </div>
      </div>
    </div>
  );
}


function BannerUploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image too large. Max 5MB.", "error");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/uploads", { method: "POST", body: formData });
      const data = await readApiResponse<{ url?: string; error?: string }>(res);
      if (res.ok && data.url) {
        onUploaded(data.url);
        showToast("Image uploaded!", "success");
      } else {
        showToast(data.error || "Upload failed. Paste a URL instead.", "error");
      }
    } catch {
      showToast("Upload failed. Paste a URL instead.", "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="shrink-0 h-12 rounded-2xl">
        <Upload className="h-4 w-4" />
        {uploading ? "..." : "Upload"}
      </Button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </>
  );
}

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] font-medium text-muted-foreground">{hint}</p>}
    </div>
  );
}

const KERALA_PINCODES = [
  "695001", "695002", "695003", "695004", "695005", "695006", "695007", "695008", "695009", "695010",
  "695011", "695012", "695013", "695014", "695015", "695016", "695017", "695018", "695019", "695020",
  "695021", "695022", "695023", "695024", "695025", "695026", "695027", "695028", "695029", "695030",
  "695031", "695032", "695033", "695034", "695035", "695036", "695037", "695038", "695039", "695040",
  "695099", "695101", "695102", "695103", "695104", "695121", "695122", "695123", "695124", "695125",
  "695126", "695127", "695141", "695142", "695143", "695144", "695145", "695146", "695301", "695302",
  "695303", "695304", "695305", "695306", "695307", "695308", "695309", "695310", "695311", "695312",
  "695313", "695314", "695315", "695316", "695317", "695318", "695501", "695502", "695503", "695504",
  "695505", "695506", "695507", "695508", "695509", "695510", "695511", "695512", "695513", "695521",
  "695522", "695523", "695524", "695525", "695527", "695541", "695542", "695543", "695544", "695545",
  "695546", "695547", "695551", "695561", "695562", "695563", "695564", "695571", "695572", "695573",
  "695574", "695575", "695581", "695582", "695583", "695584", "695585", "695586", "695587", "695588",
  "695589", "695601", "695602", "695603", "695604", "695605", "695606", "695607", "695608", "695609",
  "695610", "695611", "695612", "695613", "695614", "695615", "695616"
];

function PincodeTagInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const tags = value.split(",").map((t) => t.trim()).filter(Boolean);

  function addTag(pincode: string) {
    const trimmed = pincode.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    const newTags = [...tags, trimmed];
    onChange(newTags.join(", "));
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function removeTag(pincode: string) {
    const newTags = tags.filter((t) => t !== pincode);
    onChange(newTags.join(", "));
  }

  function handleInputChange(val: string) {
    setInputValue(val);
    if (val.length >= 2) {
      const filtered = KERALA_PINCODES.filter(
        (p) => p.startsWith(val) && !tags.includes(p)
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) addTag(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="relative">
      <div className="min-h-12 flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/20 text-primary/60 hover:text-primary"
              aria-label={`Remove pincode ${tag}`}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          onBlur={() => { setTimeout(() => setShowSuggestions(false), 150); }}
          placeholder={tags.length === 0 ? "Type pincode to add..." : "Add more..."}
          className="h-8 min-w-[120px] flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {showSuggestions && (
        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
          {suggestions.map((pin) => (
            <button
              key={pin}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(pin)}
              className="flex w-full items-center px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-primary/5 hover:text-primary dark:text-neutral-300"
            >
              {pin}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const SETTINGS_SECTIONS = [
  { id: "logo", label: "Store Logo", keywords: ["logo", "image", "brand", "icon", "upload"] },
  { id: "store", label: "Store Details", keywords: ["store", "name", "phone", "whatsapp", "address", "maps", "social", "instagram", "facebook"] },
  { id: "gst", label: "GST Billing", keywords: ["gst", "gstin", "tax", "billing", "business"] },
  { id: "delivery", label: "Delivery & Orders", keywords: ["delivery", "radius", "fee", "minimum", "order", "estimate", "pincode"] },
  { id: "whatsapp", label: "WhatsApp API", keywords: ["whatsapp", "api", "template", "message", "webhook"] },
  { id: "banner", label: "Banner Management", keywords: ["banner", "offer", "promotion", "homepage", "image"] },
];

function SettingsSearch() {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const results = query.trim().length > 0
    ? SETTINGS_SECTIONS.filter((section) =>
        section.label.toLowerCase().includes(query.toLowerCase()) ||
        section.keywords.some((kw) => kw.includes(query.toLowerCase()))
      )
    : [];

  function scrollToSection(sectionId: string) {
    setQuery("");
    setShowResults(false);

    const headingMap: Record<string, string> = {
      logo: "Store Logo",
      store: "Store details",
      gst: "GST billing",
      delivery: "Delivery & Order Settings",
      whatsapp: "WhatsApp Business API",
      banner: "Banner management",
    };

    const targetText = headingMap[sectionId];
    if (!targetText) return;

    const headings = document.querySelectorAll("h3, h4");
    for (const heading of headings) {
      if (heading.textContent?.includes(targetText)) {
        heading.scrollIntoView({ behavior: "smooth", block: "start" });
        const parent = heading.closest("form, section, div[class*='rounded-xl']");
        if (parent) {
          parent.classList.add("ring-2", "ring-primary/40");
          setTimeout(() => parent.classList.remove("ring-2", "ring-primary/40"), 2000);
        }
        break;
      }
    }
  }

  return (
    <div className="mt-5 relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search settings... (logo, delivery, GST, banners...)"
          className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm font-medium outline-none shadow-soft focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          {results.map((section) => (
            <button
              key={section.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => scrollToSection(section.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors border-b border-border last:border-0"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Search className="h-3.5 w-3.5 text-primary" />
              </span>
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">{section.label}</p>
                <p className="text-xs text-muted-foreground">{section.keywords.slice(0, 4).join(", ")}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {showResults && query.trim().length > 0 && results.length === 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-border bg-card p-4 shadow-lg text-center">
          <p className="text-sm text-muted-foreground">No matching settings found</p>
        </div>
      )}
    </div>
  );
}
