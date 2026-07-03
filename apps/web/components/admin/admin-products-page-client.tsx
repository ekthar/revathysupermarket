"use client";

import { Package, PlusCircle, FileSpreadsheet, LayoutGrid } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductManagementForm } from "@/components/admin/product-management-form";
import { ProductSpreadsheetManager } from "@/components/admin/product-spreadsheet-manager";
import { ProductImportExport } from "@/components/admin/product-import-export";
import { AdminProductsClient, type AdminProduct } from "@/components/admin/admin-products-client";

type Props = {
  products: AdminProduct[];
  categories: { id: string; name: string }[];
};

export function AdminProductsPageClient({ products, categories }: Props) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display text-3xl font-black">Products</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage inventory, add new products, or bulk import/export.
        </p>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="w-full flex-wrap sm:w-auto">
          <TabsTrigger value="inventory" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" />
            Visual Inventory
          </TabsTrigger>
          <TabsTrigger value="spreadsheet" className="gap-1.5">
            <Package className="h-4 w-4" />
            Spreadsheet Editor
          </TabsTrigger>
          <TabsTrigger value="add-product" className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            Add Product
          </TabsTrigger>
          <TabsTrigger value="import-export" className="gap-1.5">
            <FileSpreadsheet className="h-4 w-4" />
            Import / Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <AdminProductsClient products={products} />
        </TabsContent>

        <TabsContent value="spreadsheet">
          <ProductSpreadsheetManager products={products} />
        </TabsContent>

        <TabsContent value="add-product">
          <ProductManagementForm categories={categories} />
        </TabsContent>

        <TabsContent value="import-export">
          <ProductImportExport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
