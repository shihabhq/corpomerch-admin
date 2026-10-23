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
  /** Path under corpomerch-client/public/portfolio/, e.g. "tedx/ted1.png". */
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
    slug: "tedxbup-2026-event-merchandise",
    title: "TEDxBUP 2026 — Custom Event Merchandise & Gift Boxes",
    client: "TEDxBUP",
    eventType: "Conference",
    summary:
      "A complete branded merchandise kit for TEDxBUP 2026: notebooks, custom-shaped acrylic keyrings, printed thermal bottles, UV-printed mugs and gift boxes, all carrying the #BridgesWeBuild artwork.",
    // The year is printed on the badges and pens; the month is not known, so
    // no date is set. Fill it in from the admin panel.
    eventDate: null,
    products: ["notebook-spiral", "custom-keyring", "thermal-flask", "ceramic-mug", "gift-box", "custom-pen"],
    description: `Another big order delivered by CorpoMerch for **TEDxBUP**. For the 2026 edition, themed *#BridgesWeBuild*, the organisers wanted every item in the delegate kit to feel like part of one designed experience, not a pile of logos on random products. We produced the whole set under one roof, so colours and artwork matched across every piece.

**What we supplied**

- **Custom notebooks** printed with the event identity
- **Custom-shaped acrylic keyrings** cut to the TEDx "X" silhouette, a keepsake delegates actually keep
- **Custom printed thermal water bottles** for the speakers and team
- **Custom UV printed ceramic mugs** with a sharp, scratch-resistant TEDxBUP logo
- **Custom gift boxes**, rigid black boxes with the artwork printed on the lid, to present the kit

Every item was checked before bulk production and the full order was delivered ahead of the event.

**Planning a TEDx, conference or corporate summit?** Send us your quantity and date on WhatsApp and we will come back with a firm quotation, usually the same working day.`,
    images: [
      {
        file: "tedx/ted1.png",
        alt: "TEDxBUP custom gift box opened to show a printed ceramic mug and branded participant kit inside foam",
      },
      {
        file: "tedx/ted2.png",
        alt: "TEDxBUP 2026 branded pens with the event logo printed on the barrel",
      },
      {
        file: "tedx/ted3.png",
        alt: "Pile of custom-shaped acrylic X keyrings for TEDxBUP with metal split rings",
      },
      {
        file: "tedx/ted4.png",
        alt: "Custom UV printed white ceramic mug with the TEDxBUP logo",
      },
      {
        file: "tedx/ted5.png",
        alt: "TEDxBUP 2026 participant badge in a clear lanyard holder with the #BridgesWeBuild theme",
      },
      {
        file: "tedx/ted6.png",
        alt: "Custom-shaped acrylic X keyring printed in red and white for TEDxBUP",
      },
      {
        file: "tedx/ted7.png",
        alt: "Black rigid TEDxBUP gift box with the X artwork and #BridgesWeBuild theme printed on the lid",
      },
      {
        file: "tedx/ted9.png",
        alt: "TEDxBUP 2026 stage backdrop printed with the speaker lineup and #BridgesWeBuild theme",
      },
    ],
    seoTitle: "TEDxBUP Custom Merchandise — Keyrings, Mugs & Gift Boxes | CorpoMerch",
    seoDescription:
      "How CorpoMerch supplied TEDxBUP 2026 with custom notebooks, acrylic keyrings, thermal bottles, UV printed mugs and gift boxes. Event merchandise in Dhaka, Bangladesh.",
    sortOrder: 1,
  },

  {
    slug: "raze-bangladesh-custom-fanny-packs",
    title: "RAZE Bangladesh — 1,000 Custom Branded Fanny Packs",
    client: "Marico Bangladesh Ltd. (RAZE)",
    eventType: "Brand Merchandise",
    summary:
      "Around 1,000 custom fanny packs for RAZE, the men's fragrance brand by Marico Bangladesh, handled from product sourcing and quality control to bulk delivery.",
    eventDate: null,
    products: [],
    description: `We delivered around **1,000 custom fanny packs** to **RAZE Bangladesh**, the men's fragrance brand from **Marico Bangladesh**.

Bulk orders like this are won or lost on consistency: the thousandth bag has to look exactly like the first. So we handled the order end to end.

- **Product sourcing.** A durable black mesh bag with a zip and adjustable strap, suited to an active, young audience.
- **Quality control.** Bags were checked for stitching, zips and print placement, and the white RAZE logo was applied cleanly and evenly.
- **Bulk packing and delivery.** Bags were counted, bagged and delivered on schedule so the brand team could move straight to distribution.

Thank you to RAZE Bangladesh for trusting CorpoMerch with this order. We enjoyed working on it.

**Need branded bags, apparel or giveaways in bulk?** Tell us the quantity and deadline and we will quote the same working day.`,
    images: [
      {
        file: "marico-raze/fanny1.png",
        alt: "Black RAZE fanny pack with white printed logo being checked during quality control",
      },
      {
        file: "marico-raze/fanny2.png",
        alt: "Close-up of the RAZE logo printed on a black mesh fanny pack with adjustable strap",
      },
      {
        file: "marico-raze/fanny3.png",
        alt: "Stacks of black RAZE fanny packs bagged in bulk for delivery to Marico Bangladesh",
      },
      {
        file: "marico-raze/fanny4.png",
        alt: "Bulk-packed RAZE fanny packs in clear polybags ready for dispatch",
      },
    ],
    seoTitle: "Custom Fanny Packs in Bulk for RAZE Bangladesh | CorpoMerch",
    seoDescription:
      "CorpoMerch delivered around 1,000 custom branded fanny packs to RAZE Bangladesh, a Marico Bangladesh brand. Sourcing, quality control and bulk delivery in Dhaka.",
    sortOrder: 2,
  },

  {
    slug: "stacked-ventures-branded-merchandise",
    title: "Stacked Ventures — Branded Corporate Merchandise Set",
    client: "Stacked Ventures",
    eventType: "Corporate Branding",
    summary:
      "A cohesive branded set for Stacked Ventures: thermal bottles, pens, notebooks, mugs and lanyards, printed in the company's navy and white identity.",
    eventDate: null,
    products: ["thermal-flask", "custom-pen", "notebook-spiral", "ceramic-mug", "lanyard-ribbon"],
    description: `A strong brand begins with a strong first impression. We are pleased to have delivered branded merchandise for **Stacked Ventures**, and we thank the team for trusting CorpoMerch with their branding.

The set was built around one idea: whatever lands on a client's desk, it should look unmistakably like Stacked Ventures.

- **Thermal bottles** in clean white with the logo printed down the side
- **Metal pens**, individually bagged, ready to hand out
- **Navy wire-bound notebooks** with the logo on the cover
- **Ceramic mugs** printed with the company mark
- **Navy lanyards** with metal swivel hooks for staff and events

Branded merchandise is never a wasted expense. It builds credibility, creates lasting impressions and keeps your brand on people's desks long after the meeting ends. We are always happy to support new ventures as they take their first steps toward a memorable brand.

**Build your brand. Make an impression. Grow with purpose.** Message us on WhatsApp for a quote on your own branded set.`,
    images: [
      {
        file: "stacked/stacked1.png",
        alt: "White Stacked Ventures branded thermal bottles lined up with the printed logo",
      },
      {
        file: "stacked/stacked2.png",
        alt: "Stacked Ventures white metal pens individually bagged with the printed logo",
      },
      {
        file: "stacked/stacked3.png",
        alt: "Navy blue Stacked Ventures spiral-bound notebook with the logo on the cover",
      },
      {
        file: "stacked/stacked4.png",
        alt: "Stack of navy Stacked Ventures wire-bound notebooks showing the white spiral binding",
      },
      {
        file: "stacked/stacked5.png",
        alt: "White ceramic mugs printed with the Stacked Ventures logo",
      },
      {
        file: "stacked/stacked6.png",
        alt: "Navy fabric lanyards with polished metal swivel hooks for Stacked Ventures",
      },
    ],
    seoTitle: "Corporate Branded Merchandise for Stacked Ventures | CorpoMerch",
    seoDescription:
      "CorpoMerch supplied Stacked Ventures with branded thermal bottles, pens, notebooks, mugs and lanyards. Corporate gifts and staff merchandise in Dhaka, Bangladesh.",
    sortOrder: 3,
  },

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
        file: "raze/raze1.jpg",
        alt: "Bundled Raze discount vouchers and black Signature Deo campaign cards, banded in stacks",
      },
      {
        file: "raze/raze2.jpg",
        alt: "Raze campaign discount coupons stacked and counted before delivery",
      },
      {
        file: "raze/raze3.jpg",
        alt: "Close-up of the Raze Signature Deo voucher artwork",
      },
      {
        file: "raze/raze4.jpg",
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
        file: "ttc/ttc1.jpg",
        alt: "Fan Fest 2.0 ticket booklet opened to show a numbered ticket and its counterfoil",
      },
      {
        file: "ttc/ttc2.jpg",
        alt: "Stacks of bound Fan Fest 2.0 ticket booklets during production",
      },
      {
        file: "ttc/ttc3.jpg",
        alt: "One True Sound PVC event ID cards banded in stacks, showing the sponsor panel",
      },
      {
        file: "ttc/ttc4.jpg",
        alt: "One True Sound event badges printed in full colour on PVC",
      },
      {
        file: "ttc/ttc5.jpg",
        alt: "Finished One True Sound ID cards ready for lanyards",
      },
    ],
    seoTitle: "Event Ticket & ID Card Printing for Triple Time Communications",
    seoDescription:
      "Numbered Fan Fest 2.0 ticket booklets and full-colour PVC event badges for One True Sound, produced by CorpoMerch for Triple Time Communications in Dhaka.",
    sortOrder: 20,
  },
];
