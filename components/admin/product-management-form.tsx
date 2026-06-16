"use client";

import { useState } from "react";
import { ImagePlus, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { categories } from "@/lib/products";

export function ProductManagementForm() {
  const [message, setMessage] = useState("");

  return (
    <form
      className="mt-5 grid gap-4 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5 md:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("Product form is ready for API connection. Prisma product CRUD route is included for production wiring.");
      }}
    >
      <div className="md:col-span-3">
        <h3 className="font-display text-2xl font-black">Add product</h3>
        <p className="mt-1 text-sm text-muted-foreground">Simple fields for staff. Images can be uploaded to R2 or pasted as URLs.</p>
      </div>
      <Input placeholder="Product name" required className="h-12 rounded-2xl" />
      <select className="h-12 rounded-2xl border border-input bg-background px-4 text-sm font-semibold">
        {categories.map((category) => <option key={category}>{category}</option>)}
      </select>
      <Input placeholder="Price" type="number" required className="h-12 rounded-2xl" />
      <Input placeholder="Discount price" type="number" className="h-12 rounded-2xl" />
      <Input placeholder="Stock" type="number" required className="h-12 rounded-2xl" />
      <Input placeholder="Cloudflare R2 image URL" type="url" required className="h-12 rounded-2xl" />
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-primary/40 bg-primary/5 p-4 text-center md:col-span-3">
        <ImagePlus className="h-7 w-7 text-primary" />
        <span className="mt-2 text-sm font-black">Tap to upload product image</span>
        <span className="mt-1 text-xs text-muted-foreground">Uses the Cloudflare R2 upload endpoint</span>
        <input type="file" accept="image/*" className="sr-only" />
      </label>
      <Textarea className="rounded-2xl md:col-span-3" placeholder="Description" required />
      {message && <p className="rounded-2xl bg-muted p-3 text-sm font-medium md:col-span-3">{message}</p>}
      <div className="grid gap-3 md:col-span-3 sm:flex">
        <Button type="button" variant="outline" className="w-full sm:w-auto">
          <Upload className="h-4 w-4" />
          Upload image
        </Button>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add product
        </Button>
      </div>
    </form>
  );
}
