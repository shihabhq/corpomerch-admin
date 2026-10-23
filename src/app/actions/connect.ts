"use server";

import { revalidatePath } from "next/cache";
import QRCode from "qrcode";

import type { ActionResult } from "@/app/actions/products";
import { assertAdmin } from "@/lib/auth";
import { connectUrl, RESERVED_SLUGS, SLUG_PATTERN } from "@/lib/connect";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

/**
 * Connect cards. An admin creates the card (and therefore the link) first; the
 * customer claims it later by registering at that link in corpomerch-connect.
 * Nothing here creates a customer account — that only ever happens at the link.
 */

export async function createConnectCard(input: {
  label: string;
  slug?: string;
}): Promise<ActionResult<{ id: string; slug: string; url: string }>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const label = input.label.trim();
  if (!label) return { ok: false, error: "Enter the customer's name.", field: "label" };

  const requested = input.slug?.trim();
  const base = slugify(requested || label);
  if (!base || !SLUG_PATTERN.test(base)) {
    return { ok: false, error: "Use letters, numbers and single hyphens only.", field: "slug" };
  }
  if (RESERVED_SLUGS.has(base)) {
    return { ok: false, error: `"${base}" is reserved. Choose another link.`, field: "slug" };
  }

  // A typed slug must be exactly what was typed. Only an auto-derived one may
  // be suffixed to dodge a collision.
  let slug = base;
  if (requested) {
    if (await prisma.connectCard.findUnique({ where: { slug }, select: { id: true } })) {
      return { ok: false, error: `The link "${slug}" is already taken.`, field: "slug" };
    }
  } else {
    for (let n = 2; await prisma.connectCard.findUnique({ where: { slug }, select: { id: true } }); n++) {
      slug = `${base}-${n}`;
    }
  }

  try {
    const card = await prisma.connectCard.create({
      data: { slug, label, createdBy: auth.session.userId },
      select: { id: true },
    });
    revalidatePath("/connect");
    return { ok: true, data: { id: card.id, slug, url: connectUrl(slug) } };
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { ok: false, error: `The link "${slug}" is already taken.`, field: "slug" };
    }
    throw e;
  }
}

export async function setConnectCardActive(id: string, isActive: boolean): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  await prisma.connectCard.update({ where: { id }, data: { isActive } });
  revalidatePath("/connect");
  return { ok: true, data: undefined };
}

/** Only unclaimed cards: deleting a claimed one would destroy a customer's profile. */
export async function deleteConnectCard(id: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { count } = await prisma.connectCard.deleteMany({ where: { id, ownerId: null } });
  if (count === 0) {
    return { ok: false, error: "This card has been claimed by a customer, so it can only be deactivated." };
  }
  revalidatePath("/connect");
  return { ok: true, data: undefined };
}

/** SVG for on-screen display and a 1024px PNG for the print file. */
export async function getConnectCardQr(
  id: string,
): Promise<ActionResult<{ url: string; svg: string; png: string }>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const card = await prisma.connectCard.findUnique({ where: { id }, select: { slug: true } });
  if (!card) return { ok: false, error: "Card not found." };

  const url = connectUrl(card.slug);
  const opts = { errorCorrectionLevel: "M", margin: 2 } as const;
  const [svg, png] = await Promise.all([
    QRCode.toString(url, { ...opts, type: "svg" }),
    QRCode.toDataURL(url, { ...opts, width: 1024 }),
  ]);
  return { ok: true, data: { url, svg, png } };
}
