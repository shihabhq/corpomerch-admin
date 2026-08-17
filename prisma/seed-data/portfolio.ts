/**
 * Portfolio case studies.
 *
 * Source content (client, description, image list) came from the business.
 * Everything else — slug, title, event type, summary, product links, SEO — is
 * written here, and anything inferred rather than supplied is called out in a
 * comment so it can be corrected rather than silently trusted.
 *
 * Structure follows the source: one entry per client. Triple Time covers two
 * separate jobs (Fan Fest tickets and One True Sound badges) in a single case
 * study because that is how the business framed it.
 */

export interface SeedPortfolioImage {
  /** Filename in corpomerch-client/public/portfolio/ (no extension). */
  file: string;
  alt: string;
}

export interface SeedPortfolioItem {
  slug: string;
  title: string;
  client: string;
  eventType: string;
  summary: string;
  /** Markdown. */
  description: string;
  /** ISO date, or null when we genuinely do not know it. */
  eventDate: string | null;
  /** Product slugs shown as "what we supplied". */
  products: string[];
  images: SeedPortfolioImage[];
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
}

export const portfolioItems: SeedPortfolioItem[] = [
  {
    slug: "marico-raze-campaign-coupons",
    title: "Raze Signature Deo — Campaign Discount Coupons",
    client: "Marico Bangladesh Ltd.",
    eventType: "Brand Activation",
    summary:
      "Two-design discount voucher run for the Raze Signature Deo campus activation — produced, bundled and delivered on a tight deadline.",
    // Inferred from the artwork itself: the vouchers are printed
    // "VALID TILL: 13 AUG 2026 AT NSU BOOTH". Correct it if the activation ran
    // on a different date.
    eventDate: "2026-08-13",
    products: ["event-tickets"],
    description: `We've successfully delivered another order of Discount Coupons for Raze Bangladesh. Honoured to have the trust of **Marico Bangladesh Ltd.**

The run covered two voucher designs — a flat ৳120 off and an up-to-55% off — printed alongside the black Raze *Signature Deo Body Spray* campaign cards carrying the "Amar Hishab Alada" line. Each voucher carries its own validity line and redemption point so the activation team could control redemption at the booth.

Coupons were counted, banded into equal bundles and delivered ready to hand out, so nothing had to be sorted on site.

Please note: these coupons were produced for a specific event and are not available for public use or purchase.

**Need a customised merchandise solution on a tight deadline? We've got you covered.**`,
    images: [
      {
        file: "raze1",
        alt: "Bundled Raze discount vouchers and black Signature Deo campaign cards, banded in stacks",
      },
      {
        file: "raze2",
        alt: "Raze campaign discount coupons stacked and counted before delivery",
      },
      {
        file: "raze3",
        alt: "Close-up of the Raze Signature Deo voucher artwork",
      },
      {
        file: "raze4",
        alt: "Finished Raze coupon bundles ready to hand over to the activation team",
      },
    ],
    seoTitle: "Discount Coupon Printing for Marico Bangladesh — CorpoMerch",
    seoDescription:
      "CorpoMerch produced campaign discount vouchers for Raze Signature Deo, a Marico Bangladesh brand — two designs, bundled and delivered to deadline for a campus activation.",
    sortOrder: 10,
  },

  {
    slug: "triple-time-communications-event-print",
    title: "Triple Time Communications — Event Tickets & ID Cards",
    client: "Triple Time Communications",
    eventType: "Event Production",
    summary:
      "Serially numbered ticket booklets for Fan Fest 2.0 and full-colour PVC crew badges for One True Sound, produced for one of Dhaka's busiest event agencies.",
    // No date is visible on any of the artwork and none was supplied, so this
    // stays null rather than being guessed. Fill it in from the admin panel.
    eventDate: null,
    products: ["event-tickets", "id-card-3r-pvc"],
    description: `A large batch of event tickets, delivered successfully. Thanks to **Triple Time Communications** for trusting CorpoMerch with your event supplies — we love being a small part of making great events happen.

**Fan Fest 2.0 — entry tickets.** Full-colour tickets bound into counterfoil booklets, each carrying a unique sequential number and a "ticket for one person only, one entry only" line, so the gate count reconciles against the stubs at the end of the night. The layout carried the full sponsor wall — Exora Cup, Honor, Coca-Cola, Free Fire and the rest — at a size that still reads on a torn stub.

**One True Sound — crew and access badges.** We're also pleased to have supplied ID Cards for Triple Time Communications: full-colour PVC badges organised by Yamaha Music Bangladesh and Triple Time Communications, with the sponsor panel printed in and a double top punch so they hang flat on a lanyard all day.

Thank you to the team at TTC for trusting CorpoMerch with your requirements.`,
    images: [
      {
        file: "ttc1",
        alt: "Fan Fest 2.0 ticket booklet opened to show a numbered ticket and its counterfoil",
      },
      {
        file: "ttc2",
        alt: "Stacks of bound Fan Fest 2.0 ticket booklets during production",
      },
      {
        file: "ttc3",
        alt: "One True Sound PVC event ID cards banded in stacks, showing the sponsor panel",
      },
      {
        file: "ttc4",
        alt: "One True Sound event badges printed in full colour on PVC",
      },
      {
        file: "ttc5",
        alt: "Finished One True Sound ID cards ready for lanyards",
      },
    ],
    seoTitle: "Event Ticket & ID Card Printing for Triple Time Communications",
    seoDescription:
      "Numbered Fan Fest 2.0 ticket booklets and full-colour PVC event badges for One True Sound, produced by CorpoMerch for Triple Time Communications in Dhaka.",
    sortOrder: 20,
  },
];
