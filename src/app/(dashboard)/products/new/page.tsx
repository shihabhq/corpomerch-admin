import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProductForm } from "@/components/products/ProductForm";
import { requireAdmin } from "@/lib/auth";
import { emptyProduct, getCategoryOptions } from "@/lib/product-form-data";

export const metadata: Metadata = { title: "New product" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getCategoryOptions();

  return (
    <>
      <PageHeader
        title="New product"
        description="Save as a draft at any point — the publish checks only apply when you set the status to Published."
      />
      <ProductForm
        defaultValues={emptyProduct()}
        categories={categories}
        isNew
        storefrontUrl={process.env.STOREFRONT_URL ?? "http://localhost:3000"}
      />
    </>
  );
}
