"use client";

import { useMemo, useState, useTransition } from "react";
import { Edit3, Eye, EyeOff, Minus, Package, Plus, Save, Search, Sparkles, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductImage } from "@/components/product-image";
import { useToast } from "@/components/toast-provider";
import { readApiResponse } from "@/lib/client-api";
import { cn, formatCurrency } from "@/lib/utils";

export type AdminProduct = {
  id: string;
  slug?: string;
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  image?: string | null;
  description: string;
  unit?: string;
  isActive: boolean;
  isFeatured: boolean;
};

type ProductResponse = {
  product?: AdminProduct & { category?: { name: string } };
  error?: string;
};

const tabs = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "featured", label: "Featured" },
  { key: "low", label: "Low stock" },
  { key: "inactive", label: "Inactive" }
] as const;

export function AdminProductsClient({ products: initialProducts }: { products: AdminProduct[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("all");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [isPending, startTransition] = useTransition();

  const lowStock = products.filter((product) => product.isActive && product.stock <= 15);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = !needle || [product.name, product.category].join(" ").toLowerCase().includes(needle);
      const matchesTab =
        tab === "all" ||
        (tab === "active" && product.isActive) ||
        (tab === "featured" && product.isFeatured) ||
        (tab === "inactive" && !product.isActive) ||
        (tab === "low" && product.isActive && product.stock <= 15);
      return matchesQuery && matchesTab;
    });
  }, [products, query, tab]);

  function updateLocal(id: string, patch: Partial<AdminProduct>) {
    setProducts((current) => current.map((product) => (product.id === id ? { ...product, ...patch } : product)));
  }

  async function patchProduct(product: AdminProduct, patch: Partial<AdminProduct>, success: string) {
    const previous = product;
    updateLocal(product.id, patch);
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    const data = await readApiResponse<ProductResponse>(response);

    if (!response.ok) {
      updateLocal(product.id, previous);
      showToast(data.error ?? "Product update failed", "error");
      return false;
    }

    showToast(success, "success");
    startTransition(() => router.refresh());
    return true;
  }

  async function deactivate(product: AdminProduct) {
    const previous = product;
    updateLocal(product.id, { isActive: false });
    const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const data = await readApiResponse<ProductResponse>(response);

    if (!response.ok) {
      updateLocal(product.id, previous);
      showToast(data.error ?? "Product could not be deactivated", "error");
      return;
    }

    showToast("Product deactivated", "success");
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="mt-5 rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Inventory</p>
        <h2 className="mt-2 font-display text-4xl font-black leading-tight">Products</h2>
        <p className="mt-2 text-sm text-muted-foreground">Edit prices, update stock, and keep inactive items away from customers.</p>
        <label className="relative mt-5 block">
          <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-primary" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/70 bg-white/90 pl-11 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-slate-900"
            placeholder="Search products or categories"
          />
        </label>
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                "h-10 shrink-0 rounded-full px-4 text-xs font-black transition active:scale-[0.98]",
                tab === item.key ? "bg-primary text-white" : "border border-white/70 bg-white/80 text-foreground dark:border-white/10 dark:bg-slate-900"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-5 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Package className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-2xl font-black">Low stock</h3>
            <p className="text-sm text-muted-foreground">{lowStock.length} products need attention</p>
          </div>
        </div>
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
          {lowStock.length === 0 ? (
            <p className="rounded-2xl bg-primary/10 p-3 text-sm font-bold text-primary">All active products have healthy stock.</p>
          ) : lowStock.slice(0, 10).map((product) => (
            <button
              type="button"
              key={product.id}
              onClick={() => setEditing(product)}
              className="min-w-40 rounded-2xl bg-red-50 p-3 text-left text-red-700"
            >
              <p className="line-clamp-2 text-sm font-black">{product.name}</p>
              <p className="mt-2 text-2xl font-black">{product.stock}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-border p-10 text-center sm:col-span-2 xl:col-span-3">
            <p className="font-display text-2xl font-black">No products found</p>
            <p className="mt-2 text-sm text-muted-foreground">Try a different search or inventory tab.</p>
          </div>
        ) : filtered.map((product) => (
          <motion.article
            key={product.id}
            layout
            className={cn(
              "grid grid-cols-[84px_1fr] gap-3 rounded-[1.5rem] border bg-card/95 p-3 shadow-soft dark:border-white/10",
              product.isActive ? "border-white/70" : "border-dashed border-slate-300 opacity-75"
            )}
          >
            <div className="relative aspect-square overflow-hidden rounded-[1.15rem] bg-muted">
              <ProductImage src={product.image} alt={product.name} />
              {!product.isActive && <span className="absolute inset-x-2 bottom-2 rounded-full bg-slate-950/80 py-1 text-center text-[10px] font-black text-white">Inactive</span>}
            </div>
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-black uppercase text-primary">{product.category}</p>
                  <h3 className="line-clamp-2 font-black leading-5">{product.name}</h3>
                  {product.isFeatured && <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-lime-fresh/25 px-2 py-1 text-[10px] font-black text-primary"><Sparkles className="h-3 w-3" /> Featured</p>}
                  <p className="mt-1 text-sm font-bold">{formatCurrency(product.discountPrice ?? product.price)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(product)}
                  title="Edit product"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background/70"
                >
                  <Edit3 className="h-4 w-4 text-primary" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Stock</p>
                  <p className={product.stock <= 15 ? "text-xl font-black text-red-600" : "text-xl font-black text-primary"}>{product.stock}</p>
                </div>
                <div className="flex rounded-2xl border border-border bg-background/70">
                  <button
                    className="flex h-10 w-10 items-center justify-center"
                    type="button"
                    title="Reduce stock"
                    disabled={product.stock <= 0 || isPending}
                    onClick={() => patchProduct(product, { stock: Math.max(0, product.stock - 1) }, "Stock reduced")}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    className="flex h-10 w-10 items-center justify-center"
                    type="button"
                    title="Increase stock"
                    disabled={isPending}
                    onClick={() => patchProduct(product, { stock: product.stock + 1 }, "Stock increased")}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => patchProduct(product, { isActive: !product.isActive }, product.isActive ? "Product hidden" : "Product visible")}
                >
                  {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {product.isActive ? "Hide" : "Show"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => deactivate(product)} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <AnimatePresence>
        {editing && (
          <EditProductModal
            product={editing}
            onClose={() => setEditing(null)}
            onSaved={(nextProduct) => {
              updateLocal(nextProduct.id, nextProduct);
              setEditing(null);
              showToast("Product saved", "success");
              startTransition(() => router.refresh());
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function EditProductModal({
  product,
  onClose,
  onSaved
}: {
  product: AdminProduct;
  onClose: () => void;
  onSaved: (product: AdminProduct) => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: product.name,
    category: product.category,
    price: String(product.price),
    discountPrice: product.discountPrice ? String(product.discountPrice) : "",
    stock: String(product.stock),
    image: product.image ?? "",
    description: product.description,
    unit: product.unit ?? "1 pc",
    isActive: product.isActive,
    isFeatured: product.isFeatured
  });
  const [saving, setSaving] = useState(false);

  function update(name: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      stock: Number(form.stock),
      image: form.image.trim() || undefined
    };
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await readApiResponse<ProductResponse>(response);
    setSaving(false);

    if (!response.ok || !data.product) {
      showToast(data.error ?? "Product could not be saved", "error");
      return;
    }

    onSaved({
      id: product.id,
      slug: data.product.slug ?? product.slug,
      name: payload.name,
      category: payload.category,
      price: payload.price,
      discountPrice: payload.discountPrice,
      stock: payload.stock,
      image: payload.image,
      description: payload.description,
      unit: payload.unit,
      isActive: payload.isActive,
      isFeatured: payload.isFeatured
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[90] bg-slate-950/55 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button type="button" aria-label="Close editor" className="absolute inset-0 h-full w-full" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[2rem] bg-background p-4 shadow-2xl sm:left-auto sm:right-6 sm:top-6 sm:h-[calc(100vh-3rem)] sm:w-[440px] sm:rounded-[2rem]"
      >
        <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-center justify-between border-b border-border bg-background/95 p-4 backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase text-primary">Edit product</p>
            <h3 className="font-display text-2xl font-black">{product.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 grid gap-4">
          <label>
            <span className="text-sm font-bold">Product name</span>
            <Input required value={form.name} onChange={(event) => update("name", event.target.value)} className="mt-2 h-12 rounded-2xl" />
          </label>
          <label>
            <span className="text-sm font-bold">Category</span>
            <Input required value={form.category} onChange={(event) => update("category", event.target.value)} className="mt-2 h-12 rounded-2xl" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="text-sm font-bold">Price</span>
              <Input required type="number" min="1" value={form.price} onChange={(event) => update("price", event.target.value)} className="mt-2 h-12 rounded-2xl" />
            </label>
            <label>
              <span className="text-sm font-bold">Offer price</span>
              <Input type="number" min="1" value={form.discountPrice} onChange={(event) => update("discountPrice", event.target.value)} className="mt-2 h-12 rounded-2xl" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="text-sm font-bold">Stock</span>
              <Input required type="number" min="0" value={form.stock} onChange={(event) => update("stock", event.target.value)} className="mt-2 h-12 rounded-2xl" />
            </label>
            <label>
              <span className="text-sm font-bold">Unit</span>
              <Input value={form.unit} onChange={(event) => update("unit", event.target.value)} className="mt-2 h-12 rounded-2xl" />
            </label>
          </div>
          <label>
            <span className="text-sm font-bold">Image URL</span>
            <Input value={form.image} onChange={(event) => update("image", event.target.value)} className="mt-2 h-12 rounded-2xl" placeholder="Cloudflare/R2 HTTPS URL or leave blank" />
          </label>
          <label>
            <span className="text-sm font-bold">Description</span>
            <Textarea required value={form.description} onChange={(event) => update("description", event.target.value)} className="mt-2 min-h-28 rounded-2xl" />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-border p-4">
            <span className="font-bold">Visible in customer shop</span>
            <input type="checkbox" checked={form.isActive} onChange={(event) => update("isActive", event.target.checked)} className="h-5 w-5 accent-primary" />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-lime-fresh/40 bg-lime-fresh/10 p-4">
            <span className="font-bold">Feature on homepage</span>
            <input type="checkbox" checked={form.isFeatured} onChange={(event) => update("isFeatured", event.target.checked)} className="h-5 w-5 accent-primary" />
          </label>
          <Button disabled={saving} className="h-12 w-full">
            <Save className="h-4 w-4" />
            {saving ? "Saving" : "Save product"}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
