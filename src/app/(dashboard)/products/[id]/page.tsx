import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, Info } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProductForm } from "@/components/products/ProductForm";
import { requireAdmin } from "@/lib/auth";
import { getCatalogueHealth } from "@/lib/health";
import { getCategoryOptions, getProductFormValues } from "@/lib/product-form-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/products/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const product = await getProductFormValues(id);
  return { title: product?.name ?? "Product" };
}

export default async function EditProductPage(props: PageProps<"/products/[id]">) {
  await requireAdmin();
  const { id } = await props.params;

  const [values, categories, health] = await Promise.all([
    getProductFormValues(id),
    getCategoryOptions(),
    getCatalogueHealth(id),
  ]);

  if (!values) notFound();

  return (
    <>
      <PageHeader title="Edit product" description={values.name} />

      {health.length > 0 ? (
        <ul className="mb-6 space-y-2">
          {health.map((issue, i) => (
            <li
              key={`${issue.kind}-${i}`}
              className={
                issue.severity === "warning"
                  ? "flex items-start gap-2 rounded-lg border border-warning/25 bg-warning-tint px-4 py-2.5 text-xs text-warning"
                  : "flex items-start gap-2 rounded-lg border border-info/20 bg-info-tint px-4 py-2.5 text-xs text-info"
              }
            >
              {issue.severity === "warning" ? (
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              ) : (
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              )}
              {issue.message}
            </li>
          ))}
        </ul>
      ) : null}

      <ProductForm
        defaultValues={values}
        categories={categories}
        isNew={false}
        storefrontUrl={process.env.STOREFRONT_URL ?? "http://localhost:3000"}
      />
    </>
  );
}
