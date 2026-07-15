"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
}

export default function AdminProductNewPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [stock, setStock] = useState("0");
  const [unit, setUnit] = useState("1 pc");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim(),
        image: image.trim() || undefined,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        unit: unit.trim() || "1 pc",
        category: category.trim(),
        isActive,
        isFeatured,
      };
      if (discountPrice) body.discountPrice = parseFloat(discountPrice);
      if (costPrice) body.costPrice = parseFloat(costPrice);
      if (brand.trim()) body.brand = brand.trim();
      if (gstRate) body.gstRate = parseFloat(gstRate);

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create product.");
        return;
      }

      const { product } = await res.json();
      router.push(`/admin/products/${product.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/products"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Catalogue</p>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">New Product</h1>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleCreate} className="space-y-6">
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
            Create Product
          </button>
        </div>
      </form>
    </div>
  );
}
