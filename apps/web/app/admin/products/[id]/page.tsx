"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  price: number;
  discountPrice: number | null;
  costPrice: number | null;
  brand: string | null;
  gstRate: number | null;
  stock: number;
  unit: string;
  isActive: boolean;
  isFeatured: boolean;
  category: { id: string; name: string };
}

interface CategoryOption {
  id: string;
  name: string;
}

export default function AdminProductEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/admin/products/${id}`),
          fetch(`/api/admin/categories`),
        ]);

        if (!prodRes.ok) {
          setError("Product not found.");
          setLoading(false);
          return;
        }

        const { product: p } = await prodRes.json();
        const { categories: cats } = await catRes.json();

        setProduct(p);
        setCategories(cats || []);

        // Populate form
        setName(p.name || "");
        setDescription(p.description || "");
        setImage(p.image || "");
        setPrice(String(Number(p.price)));
        setDiscountPrice(p.discountPrice ? String(Number(p.discountPrice)) : "");
        setCostPrice(p.costPrice ? String(Number(p.costPrice)) : "");
        setBrand(p.brand || "");
        setGstRate(p.gstRate != null ? String(Number(p.gstRate)) : "");
        setStock(String(p.stock));
        setUnit(p.unit || "");
        setCategory(p.category?.name || "");
        setIsActive(p.isActive);
        setIsFeatured(p.isFeatured);
      } catch {
        setError("Failed to load product.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim(),
        image: image.trim() || undefined,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        unit: unit.trim() || undefined,
        category: category.trim(),
        isActive,
        isFeatured,
      };
      if (discountPrice) body.discountPrice = parseFloat(discountPrice);
      if (costPrice) body.costPrice = parseFloat(costPrice);
      if (brand.trim()) body.brand = brand.trim();
      if (gstRate) body.gstRate = parseFloat(gstRate);

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save product.");
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Deactivate this product? It will be hidden from customers.")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/products");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to deactivate product.");
      }
    } catch {
      setError("Network error.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-lg text-red-600">{error}</p>
        <Link href="/admin/products" className="mt-4 inline-block text-sm text-neutral-600 hover:underline">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Edit Product</p>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{product?.name}</h1>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Deactivate
        </button>
      </div>

      {/* Status messages */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          Product saved successfully.
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <fieldset className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <legend className="px-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">Basic Info</legend>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Name *</label>
              <input id="name" type="text" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Description *</label>
              <textarea id="description" required minLength={10} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Category *</label>
                <input id="category" type="text" required list="category-list" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                <datalist id="category-list">
                  {categories.map((c) => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <div>
                <label htmlFor="brand" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Brand</label>
                <input id="brand" type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
              </div>
            </div>
            <div>
              <label htmlFor="image" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Image URL</label>
              <input id="image" type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
          </div>
        </fieldset>

        {/* Pricing */}
        <fieldset className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <legend className="px-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">Pricing & Stock</legend>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="price" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Price (₹) *</label>
              <input id="price" type="number" required step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
            <div>
              <label htmlFor="discountPrice" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Discount Price (₹)</label>
              <input id="discountPrice" type="number" step="0.01" min="0" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
            <div>
              <label htmlFor="costPrice" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Cost Price (₹)</label>
              <input id="costPrice" type="number" step="0.01" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
            <div>
              <label htmlFor="stock" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Stock *</label>
              <input id="stock" type="number" required min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
            <div>
              <label htmlFor="unit" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Unit</label>
              <input id="unit" type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="1 kg, 500 ml, etc." className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
            <div>
              <label htmlFor="gstRate" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">GST Rate (%)</label>
              <input id="gstRate" type="number" step="0.01" min="0" max="28" value={gstRate} onChange={(e) => setGstRate(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
          </div>
        </fieldset>

        {/* Toggles */}
        <fieldset className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <legend className="px-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">Visibility</legend>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500" />
              Active (visible to customers)
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500" />
              Featured
            </label>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/products" className="rounded-full px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
