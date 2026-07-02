"use client";

import { useRef, useState, useTransition } from "react";
import { Download, FileSpreadsheet, Upload, CheckCircle2, AlertCircle, FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";
import type { AdminProduct } from "@/components/admin/admin-products-client";

type ImportRow = {
  row: number;
  product: AdminProduct;
  errors: string[];
};

export function ProductImportExport() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<ImportRow[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const errorRows = importPreview.filter((r) => r.errors.length > 0);
  const validRows = importPreview.filter((r) => r.errors.length === 0);

  async function previewImport(file: File) {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/products/import", { method: "POST", body: formData });
    const data = await readApiResponse<{ preview?: ImportRow[]; error?: string }>(response);
    setIsUploading(false);
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
    setIsCommitting(true);
    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("commit", "true");
    const response = await fetch("/api/admin/products/import", { method: "POST", body: formData });
    const data = await readApiResponse<{ error?: string; results?: Array<unknown> }>(response);
    setIsCommitting(false);
    if (!response.ok) {
      showToast(data.error ?? "Import failed", "error");
      return;
    }
    showToast(`Imported ${data.results?.length ?? 0} products successfully`, "success");
    setImportPreview([]);
    setImportFile(null);
    startTransition(() => router.refresh());
  }

  function resetImport() {
    setImportPreview([]);
    setImportFile(null);
  }

  return (
    <div className="space-y-6">
      {/* Download Section */}
      <section className="rounded-xl border border-white/70 bg-card/95 p-5 shadow-soft dark:border-white/10">
        <h3 className="font-display text-xl font-black">Download</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Download a blank template to fill in your products, or export all existing products.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Button
            type="button"
            variant="outline"
            className="justify-start gap-2"
            onClick={() => { window.location.href = "/api/admin/products/export?format=template"; }}
          >
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Download Template (XLSX)
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start gap-2"
            onClick={() => { window.location.href = "/api/admin/products/export?format=xlsx"; }}
          >
            <Download className="h-4 w-4" />
            Export All (XLSX)
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start gap-2"
            onClick={() => { window.location.href = "/api/admin/products/export?format=csv"; }}
          >
            <Download className="h-4 w-4" />
            Export All (CSV)
          </Button>
        </div>

        <div className="mt-4 rounded-xl bg-muted/50 p-4">
          <p className="text-sm font-bold">Template columns:</p>
          <p className="mt-1 text-xs text-muted-foreground">
            name, category, price, discountPrice, costPrice, gstRate, stock, unit, brand, image, description
          </p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li><strong>name</strong> - Product name (required, min 2 chars)</li>
            <li><strong>category</strong> - Category name (required, auto-created if new)</li>
            <li><strong>price</strong> - Selling price (required, must be greater than 0)</li>
            <li><strong>discountPrice</strong> - Discounted selling price (optional, must be less than price)</li>
            <li><strong>costPrice</strong> - Your purchase/cost price (optional)</li>
            <li><strong>gstRate</strong> - GST percentage e.g. 5, 12, 18 (optional)</li>
            <li><strong>stock</strong> - Available quantity (required, whole number)</li>
            <li><strong>unit</strong> - Unit label e.g. &quot;1 kg&quot;, &quot;500 ml&quot; (defaults to &quot;1 pc&quot;)</li>
            <li><strong>brand</strong> - Brand name (optional)</li>
            <li><strong>image</strong> - HTTPS image URL (optional, leave blank for default)</li>
            <li><strong>description</strong> - Product description (required, min 10 chars)</li>
          </ul>
        </div>
      </section>

      {/* Import Section */}
      <section className="rounded-xl border border-white/70 bg-card/95 p-5 shadow-soft dark:border-white/10">
        <h3 className="font-display text-xl font-black">Import Products</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload an XLSX or CSV file. Products are matched by name (case-insensitive) - existing products are updated, new ones are created.
        </p>

        {importPreview.length === 0 ? (
          <div className="mt-4">
            <label
              className={cn(
                "flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition",
                isUploading
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              <FileUp className="h-8 w-8 text-primary" />
              <span className="mt-2 text-sm font-black">
                {isUploading ? "Reading file..." : "Drop file here or click to browse"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                Accepts .xlsx and .csv files
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) previewImport(file);
                }}
              />
            </label>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Summary */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-muted p-4">
              <div className="flex items-center gap-2 text-sm font-bold">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {validRows.length} valid rows
              </div>
              {errorRows.length > 0 && (
                <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errorRows.length} rows with errors
                </div>
              )}
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={resetImport}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={commitImport}
                  disabled={isCommitting || validRows.length === 0}
                >
                  <Upload className="h-4 w-4" />
                  {isCommitting ? "Importing..." : `Import ${validRows.length} products`}
                </Button>
              </div>
            </div>

            {/* Error summary */}
            {errorRows.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                <p className="text-sm font-bold text-red-700 dark:text-red-400">Rows with errors (will be skipped):</p>
                <div className="mt-2 max-h-32 overflow-auto space-y-1">
                  {errorRows.map((r) => (
                    <p key={r.row} className="text-xs text-red-600 dark:text-red-400">
                      Row {r.row}: {r.product.name || "Unnamed"} - {r.errors.join(", ")}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Full preview table */}
            <div className="max-h-[50vh] overflow-auto rounded-lg border border-border">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-muted text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="border-b border-border px-3 py-2 font-black">Row</th>
                    <th className="border-b border-border px-3 py-2 font-black">Status</th>
                    <th className="border-b border-border px-3 py-2 font-black">Name</th>
                    <th className="border-b border-border px-3 py-2 font-black">Category</th>
                    <th className="border-b border-border px-3 py-2 font-black">Price</th>
                    <th className="border-b border-border px-3 py-2 font-black">Discount</th>
                    <th className="border-b border-border px-3 py-2 font-black">Cost</th>
                    <th className="border-b border-border px-3 py-2 font-black">GST %</th>
                    <th className="border-b border-border px-3 py-2 font-black">Stock</th>
                    <th className="border-b border-border px-3 py-2 font-black">Brand</th>
                    <th className="border-b border-border px-3 py-2 font-black">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((r) => (
                    <tr key={r.row} className={r.errors.length > 0 ? "bg-red-50/50 dark:bg-red-950/20" : "bg-background"}>
                      <td className="border-b border-border px-3 py-2">{r.row}</td>
                      <td className="border-b border-border px-3 py-2">
                        {r.errors.length > 0 ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </td>
                      <td className="border-b border-border px-3 py-2 font-medium">{r.product.name || "-"}</td>
                      <td className="border-b border-border px-3 py-2">{r.product.category || "-"}</td>
                      <td className="border-b border-border px-3 py-2">{r.product.price || "-"}</td>
                      <td className="border-b border-border px-3 py-2">{r.product.discountPrice || "-"}</td>
                      <td className="border-b border-border px-3 py-2">{r.product.costPrice || "-"}</td>
                      <td className="border-b border-border px-3 py-2">{r.product.gstRate ?? "-"}</td>
                      <td className="border-b border-border px-3 py-2">{r.product.stock ?? "-"}</td>
                      <td className="border-b border-border px-3 py-2">{r.product.brand || "-"}</td>
                      <td className="border-b border-border px-3 py-2 text-xs text-red-600">
                        {r.errors.length > 0 ? r.errors.join("; ") : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
