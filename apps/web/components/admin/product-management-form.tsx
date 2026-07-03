"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/toast-provider";
import { readApiResponse } from "@/lib/client-api";

type ProductFormResponse = { error?: string; product?: { name?: string }; url?: string };

type FormErrors = {
  name?: string;
  price?: string;
  discountPrice?: string;
  description?: string;
  category?: string;
};

type Props = {
  categories: { id: string; name: string }[];
};

export function ProductManagementForm({ categories }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [categorySearch, setCategorySearch] = useState("");

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  function validateField(name: string, value: string, allValues?: { price?: string; discountPrice?: string }) {
    switch (name) {
      case "name":
        return value.trim().length < 2 ? "Name must be at least 2 characters" : undefined;
      case "description":
        return value.trim().length > 0 && value.trim().length < 10 ? "Description must be at least 10 characters" : undefined;
      case "category":
        return value.trim().length < 2 ? "Category is required" : undefined;
      case "price": {
        const priceNum = Number(value);
        if (value && (!Number.isFinite(priceNum) || priceNum <= 0)) return "Price must be greater than 0";
        return undefined;
      }
      case "discountPrice": {
        if (!value) return undefined;
        const discountNum = Number(value);
        if (!Number.isFinite(discountNum) || discountNum <= 0) return "Discount price must be greater than 0";
        const priceStr = allValues?.price ?? "";
        const priceNum = Number(priceStr);
        if (priceStr && Number.isFinite(priceNum) && discountNum >= priceNum) {
          return "Discount price must be less than the selling price";
        }
        return undefined;
      }
      default:
        return undefined;
    }
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    const form = event.target.closest("form");
    const priceInput = form?.querySelector<HTMLInputElement>('[name="price"]');
    const discountInput = form?.querySelector<HTMLInputElement>('[name="discountPrice"]');
    const error = validateField(name, value, {
      price: priceInput?.value ?? "",
      discountPrice: discountInput?.value ?? ""
    });
    setErrors((prev) => ({ ...prev, [name]: error }));
  }

  async function uploadImage(file: File) {
    setIsUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData
    });
    const data = await readApiResponse<ProductFormResponse>(response);
    setIsUploading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Image upload failed. Paste an image URL instead.");
      showToast(data.error ?? "Image upload failed", "error");
      return;
    }

    if (!data.url) {
      setMessage("Image upload did not return a URL. Paste an image URL instead.");
      return;
    }

    setImageUrl(data.url);
    setMessage("Image uploaded. Add the product when the details are ready.");
    showToast("Image uploaded", "success");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    setMessage("");
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");
    const category = String(formData.get("category") ?? "");
    const price = String(formData.get("price") ?? "");
    const discountPrice = String(formData.get("discountPrice") ?? "").trim();
    const description = String(formData.get("description") ?? "");

    // Validate before submit
    const newErrors: FormErrors = {
      name: validateField("name", name),
      category: validateField("category", category),
      price: validateField("price", price),
      discountPrice: validateField("discountPrice", discountPrice, { price, discountPrice }),
      description: validateField("description", description)
    };

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors) {
      setErrors(newErrors);
      setIsSubmitting(false);
      showToast("Please fix the form errors before submitting", "error");
      return;
    }

    const gstRate = String(formData.get("gstRate") ?? "").trim();
    const costPriceValue = String(formData.get("costPrice") ?? "").trim();
    const payload = {
      name,
      category,
      price: Number(price),
      ...(discountPrice ? { discountPrice: Number(discountPrice) } : {}),
      ...(gstRate ? { gstRate: Number(gstRate) } : {}),
      stock: Number(formData.get("stock")),
      image: String(formData.get("image") ?? "").trim() || undefined,
      description,
      isFeatured: formData.get("isFeatured") === "on",
      brand: String(formData.get("brand") ?? "").trim() || undefined,
      costPrice: costPriceValue ? Number(costPriceValue) : undefined,
      unit: String(formData.get("unit") ?? "1 pc").trim() || "1 pc"
    };

    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await readApiResponse<ProductFormResponse>(response);
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(data.error ?? "Product could not be added. Please check the details.");
      showToast(data.error ?? "Product could not be added", "error");
      return;
    }

    form.reset();
    setImageUrl("");
    setCategorySearch("");
    setErrors({});
    setMessage(`Product added: ${data.product?.name ?? payload.name}`);
    showToast(`Product added: ${data.product?.name ?? payload.name}`, "success");
    router.refresh();
  }

  return (
    <form
      className="grid gap-4 rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5 md:grid-cols-3"
      onSubmit={submit}
    >
      <div className="md:col-span-3">
        <h3 className="font-display text-2xl font-black">Add product</h3>
        <p className="mt-1 text-sm text-muted-foreground">Fill in the product details. Images can be uploaded or pasted as any HTTPS URL.</p>
      </div>

      {/* Name */}
      <div className="space-y-1">
        <Input
          name="name"
          placeholder="Product name"
          required
          className="h-12 rounded-2xl"
          onBlur={handleBlur}
        />
        {errors.name && <p className="text-xs font-semibold text-red-600">{errors.name}</p>}
      </div>

      {/* Category - searchable select with datalist */}
      <div className="space-y-1">
        <input
          name="category"
          list="category-options"
          placeholder="Search category..."
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
          onBlur={handleBlur}
          required
          className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <datalist id="category-options">
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
        {errors.category && <p className="text-xs font-semibold text-red-600">{errors.category}</p>}
      </div>

      {/* Price */}
      <div className="space-y-1">
        <Input
          name="price"
          placeholder="Selling price"
          type="number"
          min="1"
          step="0.01"
          required
          className="h-12 rounded-2xl"
          onBlur={handleBlur}
        />
        {errors.price && <p className="text-xs font-semibold text-red-600">{errors.price}</p>}
      </div>

      {/* Discount Price */}
      <div className="space-y-1">
        <Input
          name="discountPrice"
          placeholder="Discount price (optional)"
          type="number"
          min="1"
          step="0.01"
          className="h-12 rounded-2xl"
          onBlur={handleBlur}
        />
        {errors.discountPrice && <p className="text-xs font-semibold text-red-600">{errors.discountPrice}</p>}
      </div>

      {/* Stock */}
      <Input name="stock" placeholder="Stock quantity" type="number" min="0" step="1" required className="h-12 rounded-2xl" />

      {/* Unit with datalist to select or create a new unit */}
      <div className="space-y-1">
        <input
          name="unit"
          list="unit-options"
          placeholder="Unit (e.g. 1 pc, 10 nos)"
          defaultValue="1 pc"
          className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <datalist id="unit-options">
          <option value="1 pc" />
          <option value="10 nos" />
          <option value="1 kg" />
          <option value="500 g" />
          <option value="250 g" />
          <option value="100 g" />
          <option value="1 L" />
          <option value="500 ml" />
          <option value="250 ml" />
          <option value="1 packet" />
          <option value="1 box" />
          <option value="1 bundle" />
        </datalist>
      </div>

      {/* GST Rate select */}
      <div className="space-y-1">
        <select
          name="gstRate"
          defaultValue=""
          className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">Select GST %</option>
          <option value="0">0%</option>
          <option value="3">3%</option>
          <option value="5">5%</option>
          <option value="12">12%</option>
          <option value="18">18%</option>
          <option value="28">28%</option>
          <option value="40">40%</option>
        </select>
      </div>

      {/* Brand */}
      <Input name="brand" placeholder="Brand (optional)" maxLength={100} className="h-12 rounded-2xl" />

      {/* Cost Price */}
      <Input name="costPrice" placeholder="Cost price (optional)" type="number" min="0" step="0.01" className="h-12 rounded-2xl" />

      {/* Image URL with preview */}
      <div className="space-y-2 md:col-span-2">
        <Input
          name="image"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="Image URL (unsplash, imgur, etc.) or upload below"
          type="url"
          className="h-12 rounded-2xl"
        />
        {imageUrl && (
          <div className="flex items-center gap-3">
            <img
              src={imageUrl}
              alt="Preview"
              className="h-14 w-14 rounded-xl border border-border object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="text-xs text-muted-foreground">Image preview</span>
          </div>
        )}
      </div>

      {/* Featured toggle */}
      <label className="flex min-h-12 items-center justify-between rounded-2xl border border-lime-fresh/40 bg-lime-fresh/10 px-4 md:col-span-3">
        <span className="text-sm font-black text-primary">Feature this product on homepage</span>
        <input name="isFeatured" type="checkbox" className="h-5 w-5 accent-primary" />
      </label>

      {/* Image upload area */}
      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-center md:col-span-3">
        <ImagePlus className="h-7 w-7 text-primary" />
        <span className="mt-2 text-sm font-black">{isUploading ? "Uploading image..." : "Tap to upload product image"}</span>
        <span className="mt-1 text-xs text-muted-foreground">Or paste any image URL in the field above.</span>
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

      {/* Description */}
      <div className="space-y-1 md:col-span-3">
        <Textarea
          name="description"
          className="rounded-2xl"
          placeholder="Product description (min 10 characters)"
          required
          onBlur={handleBlur}
        />
        {errors.description && <p className="text-xs font-semibold text-red-600">{errors.description}</p>}
      </div>

      {message && <p className="rounded-2xl bg-muted p-3 text-sm font-medium md:col-span-3">{message}</p>}

      <div className="grid gap-3 md:col-span-3 sm:flex">
        <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload image"}
        </Button>
        <Button className="w-full sm:w-auto" disabled={isSubmitting || isUploading}>
          <Plus className="h-4 w-4" />
          {isSubmitting ? "Adding product..." : "Add product"}
        </Button>
      </div>
    </form>
  );
}
