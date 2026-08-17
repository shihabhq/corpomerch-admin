/**
 * Site content seed.
 *
 * `partners` and `portfolio_items` are deliberately NOT seeded. Real client
 * logos are visible in the supplied backdrop artwork, but naming them as
 * CorpoMerch clients without confirmation would be fabricating a reference
 * list. Both have full admin CRUD — add them once the client confirms.
 *
 * `homepage_banners` is also empty on purpose: every supplied asset is a square
 * 1000×1000 product shot, which is the wrong shape for a hero slide. The
 * storefront hero is a designed component that renders a typographic panel with
 * a rotating square product image, and switches to a slider automatically once
 * real banner artwork is uploaded here.
 */

export const siteSettings = {
  id: 1,
  whatsappNumber: "8801612170202",
  contactEmail: "backstageltd.int@gmail.com",
  contactPhone: "+880 1612-170202",
  addressLine: "Shop 128, 68-69 Concept Tower, Greenroad, Panthapath",
  addressCity: "Dhaka 1205, Bangladesh",
  mapUrl: "https://maps.google.com/?q=Concept+Tower+Green+Road+Panthapath+Dhaka",
  facebookUrl: null as string | null,
  instagramUrl: null as string | null,
  linkedinUrl: null as string | null,
  defaultSeoTitle: "CorpoMerch — Custom Corporate Merchandise & Print in Dhaka",
  defaultSeoDescription:
    "CorpoMerch by Backstage supplies customised corporate merchandise and print across Bangladesh — ID cards, lanyards, drinkware, pens, bags, certificates, banners and complete event kits. Bulk pricing, low MOQs, quotes on WhatsApp.",
  announcementText:
    "Bulk pricing on every product — send your quantity on WhatsApp for a same-day quote.",
  announcementActive: true,
};

export const faqs: {
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}[] = [
  {
    category: "ordering",
    sortOrder: 10,
    question: "What is the minimum order quantity?",
    answer:
      "It varies by product and is shown on every product page. Some items start at a single piece — business card holders and X-banner standees, for example — while printed items like certificates and goody bags start at 100. If your quantity falls below the listed MOQ, still send the inquiry: we can often make it work, especially if you are ordering several items together.",
  },
  {
    category: "ordering",
    sortOrder: 20,
    question: "How does the pricing work?",
    answer:
      "Every product is priced in quantity bands. The more you order, the lower the per-piece price, and the exact rate for your quantity is shown on the product page as you type it in. The price you see is the unit price for that band; there is no hidden setup or plate charge on standard orders.",
  },
  {
    category: "ordering",
    sortOrder: 30,
    question: "How do I place an order?",
    answer:
      "There is no checkout on this site by design. Configure what you need, then press Send Inquiry — it opens WhatsApp with your product, options and quantity already written out. You can also add several products to the cart and send the whole list in one message. We reply with a confirmed quote, usually within a couple of hours during business days.",
  },
  {
    category: "ordering",
    sortOrder: 40,
    question: "Can I see a sample before committing to a full run?",
    answer:
      "Yes. For most merchandise we can supply a single branded sample before the main production run, charged at the 1-piece rate. For print, we provide a digital proof free of charge and a physical proof on request. Nothing goes to production until you have approved the proof in writing.",
  },
  {
    category: "printing",
    sortOrder: 50,
    question: "What artwork format should I send?",
    answer:
      "Vector files are best — AI, EPS, PDF or CDR. If you only have a raster file, send it at 300 DPI at final print size. Include 3 mm bleed on anything that prints to the edge, and convert text to outlines so fonts do not substitute. If you do not have print-ready artwork, our design team can prepare it for you.",
  },
  {
    category: "printing",
    sortOrder: 60,
    question: "Can you design the artwork for us?",
    answer:
      "Yes. We handle design in-house for everything we print — certificates, ID card layouts, banner artwork, magazine layout and full delegate-kit branding. Send us your logo, brand colours and a rough brief, and we will send back a mock-up before anything is produced.",
  },
  {
    category: "printing",
    sortOrder: 70,
    question: "Will the printed colour exactly match my brand colour?",
    answer:
      "We match as closely as the process allows. CMYK printing cannot reproduce every screen colour exactly, and the same file prints slightly differently on 220 GSM textured paper than on PVC or a powder-coated bottle. If a colour is critical, tell us the Pantone reference and we will proof it on the actual material before the run.",
  },
  {
    category: "delivery",
    sortOrder: 80,
    question: "How long does production take?",
    answer:
      "Turnaround is listed on each product page and runs from 1–2 working days for PVC banners to 14–21 days for assembled gift boxes. The clock starts at artwork approval, not at the inquiry. If you have a hard event date, say so in your first message — we schedule around fixed dates and can expedite most items.",
  },
  {
    category: "delivery",
    sortOrder: 90,
    question: "Do you deliver outside Dhaka?",
    answer:
      "Yes, we deliver nationwide. Delivery inside Dhaka is arranged directly by us. For outside Dhaka we use standard courier services, and the cost depends on weight and destination — it is quoted with your order rather than built into the unit price.",
  },
  {
    category: "payment",
    sortOrder: 100,
    question: "What are the payment terms?",
    answer:
      "Standard terms are 50% advance to start production and the balance before delivery. We accept bank transfer, bKash and Nagad. For registered corporate and institutional clients we can work against a purchase order with agreed credit terms — ask us when you send your inquiry.",
  },
];
