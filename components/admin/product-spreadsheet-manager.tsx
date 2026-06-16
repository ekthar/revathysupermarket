"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Download, FileSpreadsheet, Filter, Save, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";
import type { AdminProduct } from "@/components/admin/admin-products-client";

type SheetProduct = AdminProduct & { changed?: boolean; rowError?: string };
type FilterMode = "all" | "low" | "inactive" | "missing-image" | "offer" | "featured";
type EditableKey = "name" | "category" | "price" | "discountPrice" | "stock" | "unit" | "image" | "description";
type SheetColumn = {
  key: "isActive" | "isFeatured" | EditableKey | "slug";
  label: string;
  type?: "checkbox" | "number";
  readonly?: boolean;
};

const columns: SheetColumn[] = [
  { key: "isActive", label: "Active", type: "checkbox" },
  { key: "isFeatured", label: "Featured", type: "checkbox" },
  { key: "name", label: "Product Name" },
  { key: "category", label: "Category" },
  { key: "price", label: "Price", type: "number" },
  { key: "discountPrice", label: "Discount Price", type: "number" },
  { key: "stock", label: "Stock", type: "number" },
  { key: "unit", label: "Unit" },
  { key: "image", label: "Image URL" },
  { key: "description", label: "Description" },
  { key: "slug", label: "Slug / ID", readonly: true }
] as const;

export function ProductSpreadsheetManager({ products: initialProducts }: { products: AdminProduct[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<SheetProduct[]>(initialProducts);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [recentlyChanged, setRecentlyChanged] = useState(0);
  const [importPreview, setImportPreview] = useState<Array<{ row: number; product: SheetProduct; errors: string[] }>>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  const changedRows = products.filter((product) => product.changed);
  const invalidRows = products.filter((product) => product.rowError);
  const health = useMemo(() => ({
    total: products.length,
    active: products.filter((product) => product.isActive).length,
    low: products.filter((product) => product.isActive && product.stock <= 15).length,
    inactive: products.filter((product) => !product.isActive).length,
    featured: products.filter((product) => product.isFeatured).length
  }), [products]);

  const filteredProducts = products.filter((product) => {
    if (filter === "low") return product.isActive && product.stock <= 15;
    if (filter === "inactive") return !product.isActive;
    if (filter === "missing-image") return !product.image;
    if (filter === "offer") return Boolean(product.discountPrice);
    if (filter === "featured") return product.isFeatured;
    return true;
  });

  function validate(product: SheetProduct) {
    if (!product.name || product.name.length < 2) return "Name required";
    if (!product.category || product.category.length < 2) return "Category required";
    if (!Number.isFinite(product.price) || product.price <= 0) return "Price must be positive";
    if (product.discountPrice !== undefined && product.discountPrice !== null && product.discountPrice <= 0) return "Discount must be positive";
    if (!Number.isInteger(product.stock) || product.stock < 0) return "Stock must be 0 or above";
    if (!product.description || product.description.length < 10) return "Description too short";
    return "";
  }

  function updateCell(id: string, key: keyof SheetProduct, value: string | number | boolean | undefined) {
    setProducts((current) =>
      current.map((product) => {
        if (product.id !== id) return product;
        const next = { ...product, [key]: value, changed: true };
        return { ...next, rowError: validate(next) };
      })
    );
  }

  async function saveChanges() {
    if (invalidRows.length > 0) {
      showToast("Fix invalid rows before saving", "error");
      return;
    }
    const rows = changedRows.map((product) => ({
      id: product.id,
      slug: product.slug,
      active: product.isActive,
      featured: product.isFeatured,
      name: product.name,
      category: product.category,
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      unit: product.unit,
      image: product.image,
      description: product.description
    }));
    const response = await fetch("/api/admin/products/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows })
    });
    const data = await readApiResponse<{ error?: string; results?: Array<unknown> }>(response);
    if (!response.ok) {
      showToast(data.error ?? "Products could not be saved", "error");
      return;
    }
    setRecentlyChanged(rows.length);
    setProducts((current) => current.map((product) => ({ ...product, changed: false, rowError: "" })));
    showToast(`${rows.length} products saved`, "success");
    startTransition(() => router.refresh());
  }

  async function previewImport(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/products/import", { method: "POST", body: formData });
    const data = await readApiResponse<{ preview?: Array<{ row: number; product: SheetProduct; errors: string[] }>; error?: string }>(response);
    if (!response.ok || !data.preview) {
      showToast(data.error ?? "File could not be previewed", "error");
      return;
    }
    setImportFile(file);
    setImportPreview(data.preview);
    showToast(`${data.preview.length} rows ready for review`, "success");
  }

  async function commitImport() {
    if (!importFile) return;
    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("commit", "true");
    const response = await fetch("/api/admin/products/import", { method: "POST", body: formData });
    const data = await readApiResponse<{ error?: string; results?: Array<unknown> }>(response);
    if (!response.ok) {
      showToast(data.error ?? "Import failed", "error");
      return;
    }
    showToast(`Imported ${data.results?.length ?? 0} products`, "success");
    setImportPreview([]);
    setImportFile(null);
    startTransition(() => router.refresh());
  }

  return (
    <section className="mt-5 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-primary">Spreadsheet mode</p>
          <h3 className="font-display text-2xl font-black">Fast inventory editor</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => { window.location.href = "/api/admin/products/export?format=xlsx"; }}>
            <Download className="h-4 w-4" />
            XLSX
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => { window.location.href = "/api/admin/products/export?format=csv"; }}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => { window.location.href = "/api/admin/products/export?format=xlsx"; }}>
            <FileSpreadsheet className="h-4 w-4" />
            Template
          </Button>
          <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) previewImport(file);
            }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Total", health.total],
          ["Active", health.active],
          ["Low stock", health.low],
          ["Inactive", health.inactive],
          ["Featured", health.featured]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-muted p-3">
            <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {[
          ["all", "All"],
          ["low", "Low stock"],
          ["inactive", "Inactive"],
          ["missing-image", "Missing image"],
          ["offer", "Has offer"],
          ["featured", "Featured"]
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key as FilterMode)}
            className={cn("flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-black", filter === key ? "bg-primary text-white" : "border border-border bg-background")}
          >
            <Filter className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {recentlyChanged > 0 && <p className="mt-4 rounded-2xl bg-lime-fresh/25 p-3 text-sm font-black text-primary">Recently changed: {recentlyChanged} products</p>}

      {importPreview.length > 0 && (
        <div className="mt-4 rounded-[1.35rem] border border-primary/20 bg-primary/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-black">Import preview: {importPreview.length} rows</p>
            <Button type="button" size="sm" onClick={commitImport} disabled={importPreview.some((row) => row.errors.length > 0)}>
              Save imported rows
            </Button>
          </div>
          <div className="mt-3 max-h-48 overflow-auto text-sm">
            {importPreview.slice(0, 8).map((row) => (
              <p key={row.row} className={row.errors.length > 0 ? "text-red-600" : "text-primary"}>
                Row {row.row}: {row.product.name || "Unnamed"} {row.errors.length > 0 ? `- ${row.errors.join(", ")}` : "- ready"}
              </p>
            ))}
          </div>
        </div>
      )}

      {changedRows.length > 0 && (
        <div className="sticky top-20 z-20 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-white/95 p-3 shadow-soft backdrop-blur dark:bg-slate-950/95">
          <p className="text-sm font-black">{changedRows.length} changed rows ready for review</p>
          <Button type="button" size="sm" onClick={saveChanges} disabled={isPending || invalidRows.length > 0}>
            <Save className="h-4 w-4" />
            Save all changes
          </Button>
        </div>
      )}

      <div className="-mx-4 mt-4 max-w-[calc(100vw-1.5rem)] overflow-x-auto rounded-[1.25rem] border border-border sm:mx-0 sm:max-w-full">
        <table className="min-w-[1180px] border-collapse text-sm">
          <thead className="bg-muted text-left text-[11px] uppercase text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="border-b border-border px-3 py-3 font-black">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className={product.changed ? "bg-lime-fresh/10" : "bg-background"}>
                {columns.map((column) => (
                  <td key={column.key} className="border-b border-border px-2 py-2 align-top">
                    {column.type === "checkbox" ? (
                      <input
                        type="checkbox"
                        checked={Boolean(product[column.key as "isActive" | "isFeatured"])}
                        onChange={(event) => updateCell(product.id, column.key as "isActive" | "isFeatured", event.target.checked)}
                        className="h-5 w-5 accent-primary"
                      />
                    ) : column.readonly ? (
                      <span className="block max-w-44 truncate text-xs text-muted-foreground">{product.slug ?? product.id}</span>
                    ) : (
                      <input
                        value={String(product[column.key as EditableKey] ?? "")}
                        type={column.type === "number" ? "number" : "text"}
                        onChange={(event) => {
                          const raw = event.target.value;
                          updateCell(product.id, column.key as EditableKey, column.type === "number" ? (raw === "" ? undefined : Number(raw)) : raw);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") event.currentTarget.blur();
                        }}
                        className={cn("min-h-10 w-full min-w-28 rounded-xl border border-transparent bg-transparent px-2 outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900", product.changed && "bg-lime-fresh/10")}
                      />
                    )}
                    {column.key === "name" && product.rowError && <p className="mt-1 text-xs font-bold text-red-600">{product.rowError}</p>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
