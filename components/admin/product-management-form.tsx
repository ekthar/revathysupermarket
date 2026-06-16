"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { categories } from "@/lib/products";

export function ProductManagementForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function uploadImage(file: File) {
    setIsUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    setIsUploading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Image upload failed. Paste an image URL instead.");
      return;
    }

    setImageUrl(data.url);
    setMessage("Image uploaded. Add the product when the details are ready.");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    setMessage("");
    const formData = new FormData(form);
    const discountPrice = String(formData.get("discountPrice") ?? "").trim();
    const payload = {
      name: String(formData.get("name") ?? ""),
      category: String(formData.get("category") ?? ""),
      price: Number(formData.get("price")),
      ...(discountPrice ? { discountPrice: Number(discountPrice) } : {}),
      stock: Number(formData.get("stock")),
      image: String(formData.get("image") ?? "").trim(),
      description: String(formData.get("description") ?? "")
    };

    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(data.error ?? "Product could not be added. Please check the details.");
      return;
    }

    form.reset();
    setImageUrl("");
    setMessage(`Product added: ${data.product.name}`);
    router.refresh();
  }

  return (
    <form
      className="mt-5 grid gap-4 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5 md:grid-cols-3"
      onSubmit={submit}
    >
      <div className="md:col-span-3">
        <h3 className="font-display text-2xl font-black">Add product</h3>
        <p className="mt-1 text-sm text-muted-foreground">Simple fields for staff. Images can be uploaded to R2 or pasted as URLs.</p>
      </div>
      <Input name="name" placeholder="Product name" required className="h-12 rounded-2xl" />
      <select name="category" className="h-12 rounded-2xl border border-input bg-background px-4 text-sm font-semibold">
        {categories.map((category) => <option key={category}>{category}</option>)}
      </select>
      <Input name="price" placeholder="Price" type="number" min="1" step="1" required className="h-12 rounded-2xl" />
      <Input name="discountPrice" placeholder="Discount price" type="number" min="1" step="1" className="h-12 rounded-2xl" />
      <Input name="stock" placeholder="Stock" type="number" min="0" step="1" required className="h-12 rounded-2xl" />
      <Input name="image" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Cloudflare R2 image URL" type="url" required className="h-12 rounded-2xl" />
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-primary/40 bg-primary/5 p-4 text-center md:col-span-3">
        <ImagePlus className="h-7 w-7 text-primary" />
        <span className="mt-2 text-sm font-black">{isUploading ? "Uploading image" : "Tap to upload product image"}</span>
        <span className="mt-1 text-xs text-muted-foreground">If R2 is not configured, paste an image URL above.</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) uploadImage(file);
          }}
        />
      </label>
      <Textarea name="description" className="rounded-2xl md:col-span-3" placeholder="Description" required />
      {message && <p className="rounded-2xl bg-muted p-3 text-sm font-medium md:col-span-3">{message}</p>}
      <div className="grid gap-3 md:col-span-3 sm:flex">
        <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          {isUploading ? "Uploading" : "Upload image"}
        </Button>
        <Button className="w-full sm:w-auto" disabled={isSubmitting || isUploading}>
          <Plus className="h-4 w-4" />
          {isSubmitting ? "Adding product" : "Add product"}
        </Button>
      </div>
    </form>
  );
}
