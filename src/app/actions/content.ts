"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { ActionResult } from "@/app/actions/products";

/**
 * CRUD for everything that is not a product: categories, FAQs, partners,
 * banners, testimonials, portfolio entries, admin users and site settings.
 *
 * Same discipline as products: assertAdmin() first, then mutate, then
 * revalidate. Nothing here is heavy enough to need a transaction.
 */

async function notifyStorefront(paths: string[] = ["/"]) {
  const url = process.env.STOREFRONT_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) return;
  try {
    await fetch(`${url}/api/revalidate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ paths }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Cache busting is best-effort; ISR expiry is the backstop.
  }
}

// ─── Site settings ───────────────────────────────────────────────────────────

export async function saveSiteSettings(
  data: Record<string, string | boolean | null>,
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const payload = {
    whatsappNumber: String(data.whatsappNumber ?? "").replace(/\D/g, ""),
    contactEmail: String(data.contactEmail ?? ""),
    contactPhone: String(data.contactPhone ?? ""),
    addressLine: String(data.addressLine ?? ""),
    addressCity: String(data.addressCity ?? ""),
    mapUrl: (data.mapUrl as string) || null,
    facebookUrl: (data.facebookUrl as string) || null,
    instagramUrl: (data.instagramUrl as string) || null,
    linkedinUrl: (data.linkedinUrl as string) || null,
    defaultSeoTitle: (data.defaultSeoTitle as string) || null,
    defaultSeoDescription: (data.defaultSeoDescription as string) || null,
    announcementText: (data.announcementText as string) || null,
    announcementActive: Boolean(data.announcementActive),
  };

  if (!payload.whatsappNumber) {
    return { ok: false, error: "A WhatsApp number is required — it is the only conversion path on the site.", field: "whatsappNumber" };
  }

  await prisma.siteSetting.upsert({
    where: { id: 1 },
    create: { id: 1, ...payload },
    update: payload,
  });

  revalidatePath("/settings");
  await notifyStorefront(["/", "/contact"]);
  return { ok: true, data: undefined };
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function saveCategory(input: {
  id?: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  description?: string | null;
  iconKey?: string | null;
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}): Promise<ActionResult<{ id: string }>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!input.name.trim()) return { ok: false, error: "A name is required." };

  const data = {
    name: input.name.trim(),
    slug: (input.slug?.trim() || slugify(input.name)).toLowerCase(),
    parentId: input.parentId || null,
    description: input.description || null,
    iconKey: input.iconKey || null,
    sortOrder: input.sortOrder,
    status: input.status,
  };

  try {
    const row = input.id
      ? await prisma.category.update({ where: { id: input.id }, data })
      : await prisma.category.create({ data });

    revalidatePath("/categories");
    await notifyStorefront(["/", "/products"]);
    return { ok: true, data: { id: row.id } };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "That slug is already in use.", field: "slug" };
    }
    // The depth trigger raises 23514 when someone nests three levels deep.
    if (error instanceof Error && error.message.includes("2 levels")) {
      return { ok: false, error: "Categories are limited to two levels." };
    }
    console.error("[saveCategory]", error);
    return { ok: false, error: "Could not save that category." };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const [productCount, childCount] = await Promise.all([
    prisma.productCategory.count({ where: { categoryId: id } }),
    prisma.category.count({ where: { parentId: id } }),
  ]);

  if (productCount > 0) {
    return {
      ok: false,
      error: `${productCount} product(s) still use this category. Move them first.`,
    };
  }
  if (childCount > 0) {
    return { ok: false, error: "Remove or re-parent the sub-categories first." };
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/categories");
  await notifyStorefront(["/", "/products"]);
  return { ok: true, data: undefined };
}

// ─── Simple content collections ──────────────────────────────────────────────

export type ContentKind =
  | "faq"
  | "partner"
  | "testimonial"
  | "banner"
  | "portfolio";

type AnyRecord = Record<string, unknown>;

/**
 * One entry point for the five straightforward collections. They share the same
 * shape (a few text fields, a sort order and an active flag), so five
 * near-identical action files would just be five places to fix the same bug.
 */
export async function saveContent(
  kind: ContentKind,
  input: AnyRecord & { id?: string },
): Promise<ActionResult<{ id: string }>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const id = input.id as string | undefined;
  const str = (key: string) => {
    const value = input[key];
    return value === undefined || value === null || value === ""
      ? null
      : String(value);
  };
  const num = (key: string, fallback = 0) => Number(input[key] ?? fallback) || 0;
  const bool = (key: string) => Boolean(input[key]);

  try {
    let rowId: string;

    switch (kind) {
      case "faq": {
        if (!str("question") || !str("answer")) {
          return { ok: false, error: "Question and answer are both required." };
        }
        const data = {
          question: String(input.question),
          answer: String(input.answer),
          category: str("category"),
          sortOrder: num("sortOrder"),
          isActive: bool("isActive"),
        };
        const row = id
          ? await prisma.faq.update({ where: { id }, data })
          : await prisma.faq.create({ data });
        rowId = row.id;
        await notifyStorefront(["/faq", "/"]);
        break;
      }

      case "partner": {
        if (!str("name")) return { ok: false, error: "A name is required." };
        const data = {
          name: String(input.name),
          logoPath: str("logoPath"),
          website: str("website"),
          sortOrder: num("sortOrder"),
          isActive: bool("isActive"),
        };
        const row = id
          ? await prisma.partner.update({ where: { id }, data })
          : await prisma.partner.create({ data });
        rowId = row.id;
        await notifyStorefront(["/partners", "/"]);
        break;
      }

      case "testimonial": {
        if (!str("quote") || !str("authorName")) {
          return { ok: false, error: "A quote and an author are required." };
        }
        const data = {
          quote: String(input.quote),
          authorName: String(input.authorName),
          authorRole: str("authorRole"),
          company: str("company"),
          avatarPath: str("avatarPath"),
          rating: input.rating ? num("rating") : null,
          sortOrder: num("sortOrder"),
          isActive: bool("isActive"),
        };
        const row = id
          ? await prisma.testimonial.update({ where: { id }, data })
          : await prisma.testimonial.create({ data });
        rowId = row.id;
        await notifyStorefront(["/"]);
        break;
      }

      case "banner": {
        if (!str("title") || !str("imagePath") || !str("alt")) {
          return { ok: false, error: "Title, image and alt text are required." };
        }
        const data = {
          title: String(input.title),
          subtitle: str("subtitle"),
          ctaLabel: str("ctaLabel"),
          ctaHref: str("ctaHref"),
          imagePath: String(input.imagePath),
          mobileImagePath: str("mobileImagePath"),
          alt: String(input.alt),
          sortOrder: num("sortOrder"),
          isActive: bool("isActive"),
        };
        const row = id
          ? await prisma.homepageBanner.update({ where: { id }, data })
          : await prisma.homepageBanner.create({ data });
        rowId = row.id;
        await notifyStorefront(["/"]);
        break;
      }

      case "portfolio": {
        if (!str("title")) return { ok: false, error: "A title is required." };
        const data = {
          title: String(input.title),
          slug: (str("slug") ?? slugify(String(input.title))).toLowerCase(),
          client: str("client"),
          eventType: str("eventType"),
          summary: str("summary"),
          description: str("description"),
          eventDate: input.eventDate ? new Date(String(input.eventDate)) : null,
          coverPath: str("coverPath"),
          status: (str("status") ?? "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED",
          sortOrder: num("sortOrder"),
        };
        const row = id
          ? await prisma.portfolioItem.update({ where: { id }, data })
          : await prisma.portfolioItem.create({ data });
        rowId = row.id;
        await notifyStorefront(["/portfolio", "/"]);
        break;
      }
    }

    revalidatePath(`/${kind === "faq" ? "faqs" : `${kind}s`}`);
    return { ok: true, data: { id: rowId } };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "That slug is already in use.", field: "slug" };
    }
    console.error(`[saveContent:${kind}]`, error);
    return { ok: false, error: "Could not save. Please try again." };
  }
}

export async function deleteContent(
  kind: ContentKind,
  id: string,
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  switch (kind) {
    case "faq":
      await prisma.faq.delete({ where: { id } });
      break;
    case "partner":
      await prisma.partner.delete({ where: { id } });
      break;
    case "testimonial":
      await prisma.testimonial.delete({ where: { id } });
      break;
    case "banner":
      await prisma.homepageBanner.delete({ where: { id } });
      break;
    case "portfolio":
      await prisma.portfolioItem.delete({ where: { id } });
      break;
  }

  revalidatePath(`/${kind === "faq" ? "faqs" : `${kind}s`}`);
  await notifyStorefront(["/"]);
  return { ok: true, data: undefined };
}

// ─── Admin users ─────────────────────────────────────────────────────────────

export async function setAdminActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (id === auth.session.userId && !isActive) {
    return { ok: false, error: "You cannot deactivate your own account." };
  }

  await prisma.adminUser.update({ where: { id }, data: { isActive } });
  revalidatePath("/users");
  return { ok: true, data: undefined };
}

/**
 * Links an existing Supabase Auth user to an admin_users row.
 *
 * Creating the auth user itself needs the service-role key, which deliberately
 * does not exist in this app — so the flow is: invite them from the Supabase
 * dashboard, then paste their user id here.
 */
export async function grantAdmin(input: {
  userId: string;
  email: string;
  fullName?: string;
  role: "ADMIN" | "EDITOR";
}): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const uuid = input.userId.trim();
  if (!/^[0-9a-f-]{36}$/i.test(uuid)) {
    return {
      ok: false,
      error: "That doesn't look like a Supabase user id (a 36-character UUID).",
      field: "userId",
    };
  }

  try {
    await prisma.adminUser.upsert({
      where: { id: uuid },
      create: {
        id: uuid,
        email: input.email.trim().toLowerCase(),
        fullName: input.fullName?.trim() || null,
        role: input.role,
        isActive: true,
      },
      update: {
        email: input.email.trim().toLowerCase(),
        fullName: input.fullName?.trim() || null,
        role: input.role,
        isActive: true,
      },
    });
    revalidatePath("/users");
    return { ok: true, data: undefined };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        ok: false,
        error: "No Supabase Auth user has that id. Create them in the Supabase dashboard first.",
        field: "userId",
      };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "That email already belongs to another admin.", field: "email" };
    }
    console.error("[grantAdmin]", error);
    return { ok: false, error: "Could not grant access." };
  }
}
