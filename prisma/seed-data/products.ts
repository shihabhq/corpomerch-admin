import type { SeedProduct } from "./types";

/**
 * The launch catalogue.
 *
 * PRICES ARE VERBATIM from the supplied price list. Nothing here is estimated,
 * interpolated or uplifted. Where the list gave no price the SKU is marked
 * `priceOnRequest` and reported in docs/missing-prices.json — it is never
 * filled in with a guess.
 *
 * A variant axis exists ONLY where the price list supplies a distinct price
 * curve per value (keyring material, pen model, certificate print, banner
 * material, flask lid, bottle material). Everything else is a plain product
 * with a gallery, so no pricing is implied that the business did not state.
 *
 * Descriptions and specifications are written content — the spec fragments the
 * list did supply (GSM, dimensions, binding, hook type) are reproduced word for
 * word; the rest is derived from the product photography.
 */

const ARTWORK_SPEC = {
  group: "Artwork",
  key: "Accepted files",
  value: "AI, PDF, PSD or CDR at 300 DPI with 3 mm bleed. We can also design for you.",
};

export const products: SeedProduct[] = [
  // ───────────────────────────────────────────────────────────── ID CARDS ──
  {
    slug: "id-card-regular",
    name: "ID Card (Regular)",
    subtitle: "Printed paper event badge",
    shortDescription:
      "Full-colour printed paper ID card for conferences, fairs and registration desks. Pairs with a plastic sleeve and lanyard.",
    description: `The workhorse of event registration. Printed full colour on both sides of 300 GSM art card and matte laminated so it survives a long day of being handled, clipped and stuffed into a pocket.

Use it for delegate badges, volunteer passes, crew IDs and visitor cards. Add a clear PVC sleeve and a printed lanyard and the whole set arrives collated, ready to hand out in registration order.

Names, designations, QR codes and sequential numbering can all be variable-printed at no extra plate cost, so every card in the run can be different.`,
    specs: [
      { group: "Card", key: "Size", value: "2R — 64 × 89 mm (portrait or landscape)" },
      { group: "Card", key: "Material", value: "300 GSM art card" },
      { group: "Card", key: "Printing", value: "4-colour offset, both sides" },
      { group: "Card", key: "Finish", value: "Matte lamination both sides" },
      { group: "Card", key: "Punch", value: "Single top slot, reinforced" },
      { group: "Options", key: "Variable data", value: "Names, designations, QR codes and serial numbers" },
      { group: "Options", key: "Accessories", value: "PVC sleeve and printed lanyard available separately" },
      ARTWORK_SPEC,
      { group: "Delivery", key: "Turnaround", value: "2–3 working days after artwork approval" },
    ],
    tags: ["id card", "event badge", "delegate pass", "conference", "registration"],
    unit: "PC",
    moq: 50,
    leadTimeDaysMin: 2,
    leadTimeDaysMax: 3,
    isFeatured: true,
    sortOrder: 10,
    categories: ["id-cards"],
    sharedImages: [
      "Normal-paper-id-card",
      "regular-id-card-with-ribbon",
      "Id-card-with-Plastic-Cover",
      "plastic-id-card-with-ribbon",
    ],
    skus: [
      {
        code: "IDC-REG",
        moq: 50,
        tiers: [
          { minQty: 50, unitPrice: 15 },
          { minQty: 100, unitPrice: 12 },
        ],
      },
    ],
    seoTitle: "ID Card Price in Bangladesh — Custom Event Badges from ৳12",
    seoDescription:
      "Custom printed ID cards and event badges in Dhaka from ৳12 per piece at 100 pcs. 300 GSM art card, full colour both sides, matte laminated. MOQ 50.",
  },

  {
    slug: "id-card-rfid",
    name: "ID Card (RFID)",
    subtitle: "Contactless PVC access card",
    shortDescription:
      "Contactless RFID/NFC PVC card for office access control, attendance and cashless event payments.",
    description: `A proper credit-card-grade PVC card with an embedded RFID antenna and chip, printed edge to edge in full colour.

Built as a six-layer laminate — printed core, antenna inlay and clear overlays either side — which is why it reads reliably and does not delaminate the way cheaper cards do after a few months on a lanyard.

Used for office access control, staff attendance, gym and club membership, and cashless payment at large events. We can supply blank-encoded or pre-encoded to your card numbers, and print employee photos and details as variable data.`,
    specs: [
      { group: "Card", key: "Size", value: "CR80 — 85.6 × 54 mm (standard credit card)" },
      { group: "Card", key: "Thickness", value: "0.76 mm, 6-layer PVC laminate" },
      { group: "Chip", key: "Frequency options", value: "125 KHz (EM4100 / TK4100) or 13.56 MHz (MIFARE Classic 1K)" },
      { group: "Chip", key: "Encoding", value: "Blank or pre-encoded to your card number series" },
      { group: "Card", key: "Printing", value: "Full colour, both sides, edge to edge" },
      { group: "Card", key: "Finish", value: "Glossy laminate" },
      { group: "Options", key: "Variable data", value: "Photo, name, employee ID and barcode" },
      { group: "Options", key: "Punch", value: "Slot punch on request (portrait or landscape)" },
      ARTWORK_SPEC,
      { group: "Delivery", key: "Turnaround", value: "5–7 working days after artwork approval" },
    ],
    tags: ["rfid card", "nfc card", "access control", "pvc card", "attendance"],
    unit: "PC",
    moq: 20,
    leadTimeDaysMin: 5,
    leadTimeDaysMax: 7,
    isFeatured: true,
    sortOrder: 20,
    categories: ["id-cards"],
    sharedImages: ["RFID id card", "RFID-ID-card"],
    skus: [
      {
        code: "IDC-RFID",
        moq: 20,
        tiers: [
          { minQty: 20, unitPrice: 50 },
          { minQty: 50, unitPrice: 40 },
          { minQty: 100, unitPrice: 30 },
        ],
      },
    ],
    seoTitle: "RFID Card Price in Bangladesh — Custom NFC Access Cards from ৳30",
    seoDescription:
      "Custom RFID and NFC PVC access cards in Dhaka from ৳30 per piece at 100 pcs. CR80, 6-layer laminate, EM4100 or MIFARE. MOQ 20.",
  },

  {
    slug: "id-card-3r-pvc",
    name: "3R PVC ID Card",
    subtitle: "Large-format event badge with lanyard",
    shortDescription:
      "Oversized 3R PVC event badge supplied with a 2 cm single-hook lanyard — readable across a crowded hall.",
    description: `When a badge needs to be read from across the room, 2R is too small. The 3R format gives you room for a large name, a role colour band and a sponsor logo without crowding.

Printed on solid PVC rather than laminated paper, so it stays flat all day and does not curl in Dhaka humidity. Supplied complete with a 2 cm printed polyester lanyard and single swivel hook.

Standard on career fairs, convocations, sports events and multi-day conferences where badges double as access control for different zones.`,
    specs: [
      { group: "Card", key: "Size", value: "3R — 89 × 127 mm" },
      { group: "Card", key: "Material", value: "Solid PVC" },
      { group: "Card", key: "Printing", value: "Full colour, both sides" },
      { group: "Card", key: "Finish", value: "Glossy PVC" },
      { group: "Card", key: "Punch", value: "Reinforced top slot" },
      { group: "Lanyard", key: "Width", value: "2 cm" },
      { group: "Lanyard", key: "Fitting", value: "Single hook" },
      { group: "Lanyard", key: "Material", value: "Printed polyester" },
      { group: "Options", key: "Variable data", value: "Names, roles, zone colours and QR codes" },
      ARTWORK_SPEC,
      { group: "Delivery", key: "Turnaround", value: "3–5 working days after artwork approval" },
    ],
    tags: ["3r id card", "pvc badge", "event pass", "lanyard", "career fair"],
    unit: "PC",
    moq: 20,
    leadTimeDaysMin: 3,
    leadTimeDaysMax: 5,
    isFeatured: true,
    sortOrder: 30,
    categories: ["id-cards"],
    sharedImages: ["3R-PVC-ID-Card", "3r-id-card-with-double-hook"],
    skus: [
      {
        code: "IDC-3R-PVC",
        moq: 20,
        tiers: [
          { minQty: 20, unitPrice: 80 },
          { minQty: 50, unitPrice: 70 },
          { minQty: 100, unitPrice: 60 },
        ],
      },
    ],
    seoTitle: "3R PVC ID Card Price in Bangladesh — Event Badge with Lanyard from ৳60",
    seoDescription:
      "3R PVC event ID cards with 2 cm single-hook lanyard, from ৳60 per piece at 100 pcs. Full colour both sides. MOQ 20. Delivered across Dhaka.",
  },

  // ──────────────────────────────────────────────────────────── LANYARDS ──
  {
    slug: "lanyard-ribbon",
    name: "Custom Lanyard / Ribbon",
    subtitle: "Printed polyester neck ribbon",
    shortDescription:
      "Custom-printed polyester lanyards with ring, single-hook or double-hook fittings. Price depends on width, print coverage and quantity.",
    description: `Sublimation-printed polyester ribbon, so the artwork is dyed into the weave rather than sitting on top of it — it will not crack or peel the way screen-printed lanyards do.

Choose the fitting to match how the badge is worn. A **ring** is cheapest and fine for a one-day event. A **single hook** swivels so the card always faces forward. A **double hook** holds a large 3R card flat against the chest and stops it spinning, which is why it is the usual choice for convocations and press passes.

Repeat-logo, single-centre-logo and full-bleed pattern layouts are all possible at the same price. A safety breakaway clip can be added.`,
    specs: [
      { group: "Ribbon", key: "Material", value: "Polyester webbing, dye-sublimation printed" },
      { group: "Ribbon", key: "Widths", value: "2 cm and 2.5 cm" },
      { group: "Ribbon", key: "Length", value: "90 cm total (45 cm drop), adjustable on request" },
      { group: "Ribbon", key: "Print", value: "Full colour, one or both sides" },
      { group: "Fittings", key: "Options", value: "Split ring, single swivel hook, double hook" },
      { group: "Fittings", key: "Finish", value: "Nickel-plated metal" },
      { group: "Options", key: "Safety", value: "Breakaway neck clip available" },
      ARTWORK_SPEC,
      { group: "Delivery", key: "Turnaround", value: "7–10 working days after artwork approval" },
    ],
    tags: ["lanyard", "ribbon", "neck strap", "id card holder", "event"],
    unit: "PC",
    moq: 50,
    pricingMode: "ON_REQUEST",
    leadTimeDaysMin: 7,
    leadTimeDaysMax: 10,
    sortOrder: 40,
    categories: ["lanyards", "id-cards"],
    options: [
      {
        name: "Hook Type",
        position: 1,
        displayAs: "IMAGE",
        helpText: "Changes how the card hangs — and how flat it stays.",
        values: [
          {
            label: "Split Ring",
            code: "ring",
            isDefault: true,
            description: "Simplest and cheapest. Card can spin.",
            images: ["Ribbon-regular"],
          },
          {
            label: "Single Hook",
            code: "single-hook",
            description: "Swivel hook keeps the card facing forward.",
            images: ["Ribbon-single-hook"],
          },
          {
            label: "Double Hook",
            code: "double-hook",
            description: "Holds a large card flat. Best for 3R badges.",
            images: ["Ribbon-double-hook"],
          },
        ],
      },
      {
        name: "Width",
        position: 2,
        displayAs: "CHIP",
        values: [
          { label: "2 cm", code: "20mm", isDefault: true },
          { label: "2.5 cm", code: "25mm" },
        ],
      },
    ],
    skus: [
      { code: "LNY-RING-20", values: { "Hook Type": "ring", Width: "20mm" }, priceOnRequest: true },
      { code: "LNY-RING-25", values: { "Hook Type": "ring", Width: "25mm" }, priceOnRequest: true },
      { code: "LNY-SGL-20", values: { "Hook Type": "single-hook", Width: "20mm" }, priceOnRequest: true },
      { code: "LNY-SGL-25", values: { "Hook Type": "single-hook", Width: "25mm" }, priceOnRequest: true },
      { code: "LNY-DBL-20", values: { "Hook Type": "double-hook", Width: "20mm" }, priceOnRequest: true },
      { code: "LNY-DBL-25", values: { "Hook Type": "double-hook", Width: "25mm" }, priceOnRequest: true },
    ],
    seoTitle: "Custom Lanyard Price in Bangladesh — Printed Ribbons with Hooks",
    seoDescription:
      "Custom dye-sublimation printed lanyards in Dhaka. 2 cm and 2.5 cm widths with ring, single-hook or double-hook fittings. MOQ 50. Request a quote on WhatsApp.",
  },

  // ──────────────────────────────────────────────────────────── KEYRINGS ──
  {
    slug: "custom-keyring",
    name: "Custom Keyring",
    subtitle: "Laser-cut wood or acrylic",
    shortDescription:
      "Laser-cut keyrings in natural wood or coloured acrylic, engraved or UV printed with your logo. Cut to any outline.",
    description: `Cut to your logo's actual outline rather than dropped into a generic circle — which is what makes a keyring look commissioned instead of bought.

**Wood** is laser-engraved, so the mark is burnt into the grain and will not wear off. It has weight and warmth, and suits heritage brands, universities and anniversary gifts.

**Acrylic** is UV printed in full colour and can be clear, frosted or solid. It carries gradients and photographs that wood cannot, and it is the better choice for a colourful event logo.

Both come with a nickel split ring fitted. Popular as delegate kit fillers, joining gifts and merchandise-table stock.`,
    specs: [
      { group: "Keyring", key: "Typical size", value: "50 × 50 mm — cut to your outline" },
      { group: "Keyring", key: "Wood", value: "3 mm laser-engraved plywood, natural finish" },
      { group: "Keyring", key: "Acrylic", value: "3 mm cast acrylic, UV printed full colour" },
      { group: "Keyring", key: "Shape", value: "Custom die-free laser cut, any outline" },
      { group: "Keyring", key: "Fitting", value: "Nickel-plated split ring" },
      { group: "Options", key: "Printing", value: "Single or double sided" },
      { group: "Options", key: "Packing", value: "Individual poly bag on request" },
      ARTWORK_SPEC,
      { group: "Delivery", key: "Turnaround", value: "4–6 working days after artwork approval" },
    ],
    tags: ["keyring", "keychain", "wooden keyring", "acrylic keyring", "corporate gift"],
    unit: "PC",
    moq: 20,
    leadTimeDaysMin: 4,
    leadTimeDaysMax: 6,
    isFeatured: true,
    sortOrder: 50,
    categories: ["keyrings-badges", "corporate-gifts"],
    options: [
      {
        name: "Material",
        position: 1,
        displayAs: "SWATCH",
        helpText: "Wood is engraved; acrylic is printed in full colour.",
        values: [
          {
            label: "Wood",
            code: "wood",
            swatchHex: "#B07A47",
            isDefault: true,
            description: "Laser-engraved plywood.",
            images: ["Wooden-keyring"],
          },
          {
            label: "Acrylic",
            code: "acrylic",
            swatchHex: "#E3E8EF",
            description: "UV printed full colour.",
            images: ["Acrelic-keyring"],
          },
        ],
      },
    ],
    skus: [
      {
        code: "KEY-WOOD",
        values: { Material: "wood" },
        moq: 20,
        tiers: [
          { minQty: 20, unitPrice: 50 },
          { minQty: 50, unitPrice: 45 },
          { minQty: 100, unitPrice: 35 },
        ],
      },
      {
        code: "KEY-ACRYLIC",
        values: { Material: "acrylic" },
        moq: 50,
        tiers: [
          { minQty: 50, unitPrice: 45 },
          { minQty: 100, unitPrice: 40 },
        ],
      },
    ],
    seoTitle: "Custom Keyring Price in Bangladesh — Wooden & Acrylic from ৳35",
    seoDescription:
      "Laser-cut custom keyrings in Dhaka. Engraved wood from ৳35 at 100 pcs, UV-printed acrylic from ৳40. Cut to your logo outline. MOQ 20.",
  },

  // ─────────────────────────────────────────────────────────── DRINKWARE ──
  {
    slug: "water-bottle",
    name: "Water Bottle",
    subtitle: "Plastic or stainless steel",
    shortDescription:
      "Branded reusable water bottles in BPA-free plastic or vacuum-grade stainless steel. The corporate gift with the longest shelf life.",
    description: `The gift people keep. A branded bottle sits on a desk for years, which makes it one of the few pieces of merchandise with genuinely repeated impressions.

**Plastic** is light, cheap at volume and takes a large full-colour wrap — the right call for delegate kits, fun runs and student events where you are handing out hundreds.

**Stainless steel** is single-wall food-grade steel with a laser-etched or printed mark. Heavier, quieter, and appropriate as a joining gift or client gift where the plastic version would undersell you.

Both have leak-proof screw caps and are sized to fit a standard car cup holder.`,
    specs: [
      { group: "Bottle", key: "Capacity", value: "750 ml" },
      { group: "Bottle", key: "Plastic", value: "BPA-free PET, food grade" },
      { group: "Bottle", key: "Steel", value: "Single-wall 304 stainless steel" },
      { group: "Bottle", key: "Cap", value: "Leak-proof screw cap with carry loop" },
      { group: "Branding", key: "Plastic method", value: "Full-colour wrap or screen print" },
      { group: "Branding", key: "Steel method", value: "Laser etch or UV print" },
      { group: "Branding", key: "Print area", value: "Approx. 180 × 90 mm" },
      { group: "Care", key: "Washing", value: "Hand wash recommended" },
      { group: "Delivery", key: "Turnaround", value: "7–10 working days after artwork approval" },
    ],
    tags: ["water bottle", "drink bottle", "corporate gift", "reusable bottle", "branded bottle"],
    unit: "PC",
    moq: 20,
    leadTimeDaysMin: 7,
    leadTimeDaysMax: 10,
    isFeatured: true,
    sortOrder: 60,
    categories: ["drinkware", "corporate-gifts"],
    options: [
      {
        name: "Material",
        position: 1,
        displayAs: "CHIP",
        values: [
          {
            label: "Plastic",
            code: "plastic",
            isDefault: true,
            description: "BPA-free, full-colour wrap.",
            images: ["Plastic-water-bottle"],
          },
          {
            label: "Stainless Steel",
            code: "steel",
            description: "304 steel, laser etched.",
            images: ["Metal-water-bottle"],
          },
        ],
      },
    ],
    skus: [
      {
        code: "BTL-PLASTIC",
        values: { Material: "plastic" },
        moq: 20,
        tiers: [
          { minQty: 50, unitPrice: 250 },
          { minQty: 100, unitPrice: 200 },
          { minQty: 200, unitPrice: 170 },
          { minQty: 500, unitPrice: 140 },
        ],
      },
      {
        code: "BTL-STEEL",
        values: { Material: "steel" },
        moq: 20,
        priceOnRequest: true,
      },
    ],
    seoTitle: "Custom Water Bottle Price in Bangladesh — Branded Bottles from ৳140",
    seoDescription:
      "Branded reusable water bottles in Dhaka from ৳140 per piece at 500 pcs. BPA-free plastic with full-colour wrap or stainless steel with laser etching. MOQ 20.",
  },

  {
    slug: "thermal-flask",
    name: "Thermal Water Bottle",
    subtitle: "Vacuum flask, with or without temperature display",
    shortDescription:
      "Double-wall vacuum flask in matte black, optionally with a smart lid that shows the drink temperature at a touch.",
    description: `Double-wall vacuum insulation holds a drink hot for around 12 hours and cold for around 24 — the difference between a gift that gets used and one that goes in a drawer.

The **temperature display** lid has a touch-sensitive LED that shows the contents' temperature in Celsius. It reads as expensive, and it is the version people photograph and show colleagues, which is exactly what you want from an executive gift or a raffle prize.

The **standard lid** version is the same flask and the same insulation, without the electronics — better value when you are buying fifty for a whole department.

Both are matte black powder-coated steel with your logo laser-etched to a clean silver mark.`,
    specs: [
      { group: "Flask", key: "Capacity", value: "500 ml" },
      { group: "Flask", key: "Construction", value: "Double-wall vacuum insulated 304 stainless steel" },
      { group: "Flask", key: "Heat retention", value: "Approx. 12 hours hot / 24 hours cold" },
      { group: "Flask", key: "Finish", value: "Matte black powder coat" },
      { group: "Lid", key: "Display version", value: "Touch-sensitive LED temperature readout in °C" },
      { group: "Lid", key: "Standard version", value: "Sealed screw lid, no electronics" },
      { group: "Branding", key: "Method", value: "Laser etch (silver mark) or UV print" },
      { group: "Branding", key: "Print area", value: "Approx. 150 × 70 mm" },
      { group: "Delivery", key: "Turnaround", value: "7–10 working days after artwork approval" },
    ],
    tags: ["thermal flask", "vacuum bottle", "insulated bottle", "executive gift", "temperature display"],
    unit: "PC",
    moq: 10,
    leadTimeDaysMin: 7,
    leadTimeDaysMax: 10,
    isFeatured: true,
    badgeText: "Popular gift",
    sortOrder: 70,
    categories: ["drinkware", "corporate-gifts"],
    options: [
      {
        name: "Lid Type",
        position: 1,
        displayAs: "CHIP",
        helpText: "The display lid shows the drink temperature when tapped.",
        values: [
          {
            label: "With Temperature Display",
            code: "thermometer",
            isDefault: true,
            images: ["Thermal-water-bottle-with-termometer"],
          },
          {
            label: "Standard Lid",
            code: "standard",
            images: ["Thermal-water-bottle-without-termometer"],
          },
        ],
      },
    ],
    skus: [
      {
        code: "FLK-THERMO",
        values: { "Lid Type": "thermometer" },
        moq: 10,
        tiers: [
          { minQty: 10, unitPrice: 350 },
          { minQty: 20, unitPrice: 330 },
          { minQty: 50, unitPrice: 310 },
        ],
      },
      {
        code: "FLK-PLAIN",
        values: { "Lid Type": "standard" },
        moq: 10,
        tiers: [
          { minQty: 10, unitPrice: 330 },
          { minQty: 20, unitPrice: 310 },
          { minQty: 50, unitPrice: 290 },
        ],
      },
    ],
    seoTitle: "Thermal Flask Price in Bangladesh — Branded Vacuum Bottles from ৳290",
    seoDescription:
      "Custom branded thermal flasks in Dhaka from ৳290 at 50 pcs. Double-wall vacuum steel, matte black, optional LED temperature display lid. MOQ 10.",
  },

  {
    slug: "ceramic-mug",
    name: "Ceramic Mug",
    subtitle: "Full-colour sublimation printed",
    shortDescription:
      "Classic 11 oz ceramic mug printed edge to edge in full colour. The desk-side gift that never goes out of use.",
    description: `Sublimation printing bonds the ink into the glaze, so the design survives dishwashers and years of tea. Screen-printed mugs fade; these do not.

The full wrap area means you are not limited to a logo — team photos, campaign artwork, quotes and full-bleed patterns all work. Inside-colour and coloured-handle versions are available if the brand needs it.

Standard for onboarding kits, office anniversaries, departmental gifts and merchandise tables. Individual gift-box packing is available for pieces that will be handed over one at a time.`,
    specs: [
      { group: "Mug", key: "Capacity", value: "11 oz (325 ml)" },
      { group: "Mug", key: "Material", value: "AAA-grade white ceramic" },
      { group: "Printing", key: "Method", value: "Dye sublimation, full colour" },
      { group: "Printing", key: "Coverage", value: "Full wrap, approx. 200 × 85 mm" },
      { group: "Options", key: "Variations", value: "Coloured inner and handle available" },
      { group: "Care", key: "Dishwasher", value: "Dishwasher and microwave safe" },
      { group: "Packing", key: "Standard", value: "White carton per piece" },
      { group: "Packing", key: "Optional", value: "Printed gift box" },
      { group: "Delivery", key: "Turnaround", value: "5–7 working days after artwork approval" },
    ],
    tags: ["mug", "coffee mug", "ceramic mug", "corporate gift", "sublimation"],
    unit: "PC",
    moq: 20,
    leadTimeDaysMin: 5,
    leadTimeDaysMax: 7,
    sortOrder: 80,
    categories: ["drinkware", "corporate-gifts"],
    sharedImages: ["Mug"],
    skus: [
      {
        code: "MUG-CERAMIC",
        moq: 20,
        tiers: [
          { minQty: 50, unitPrice: 250 },
          { minQty: 100, unitPrice: 200 },
          { minQty: 200, unitPrice: 170 },
          { minQty: 500, unitPrice: 140 },
        ],
      },
    ],
    seoTitle: "Custom Mug Printing Price in Bangladesh — Branded Mugs from ৳140",
    seoDescription:
      "Full-colour sublimation printed ceramic mugs in Dhaka from ৳140 at 500 pcs. 11 oz, dishwasher safe, full wrap print. MOQ 20.",
  },

  // ────────────────────────────────────────────────────── CORPORATE GIFTS ──
  {
    slug: "umbrella",
    name: "Corporate Umbrella",
    subtitle: "Branded folding umbrella",
    shortDescription:
      "Wind-resistant folding umbrella with panel-printed branding. A genuinely useful gift six months of the year in Dhaka.",
    description: `Monsoon runs half the year here, which makes an umbrella one of the few corporate gifts that gets used the day it is handed over.

Fibreglass-reinforced ribs flex instead of inverting in a gust, and the pongee canopy has a water-repellent coating that shakes dry. Folds down to fit a laptop bag.

Branding is screen printed on one or more panels — a logo on alternating panels reads best from a distance. Full-canopy printing is possible for a bolder statement. Popular with banks, insurers, real estate and any brand doing outdoor client visits.`,
    specs: [
      { group: "Umbrella", key: "Type", value: "3-fold, manual open" },
      { group: "Umbrella", key: "Canopy diameter", value: "Approx. 98 cm open" },
      { group: "Umbrella", key: "Folded length", value: "Approx. 30 cm" },
      { group: "Umbrella", key: "Canopy fabric", value: "190T pongee with water-repellent coating" },
      { group: "Umbrella", key: "Frame", value: "8 fibreglass-reinforced ribs, wind resistant" },
      { group: "Branding", key: "Method", value: "Screen print, 1–4 panels" },
      { group: "Branding", key: "Options", value: "Full-canopy print available" },
      { group: "Packing", key: "Standard", value: "Matching sleeve pouch per piece" },
      { group: "Delivery", key: "Turnaround", value: "10–14 working days after artwork approval" },
    ],
    tags: ["umbrella", "corporate gift", "monsoon", "branded umbrella", "folding umbrella"],
    unit: "PC",
    moq: 20,
    leadTimeDaysMin: 10,
    leadTimeDaysMax: 14,
    sortOrder: 90,
    categories: ["corporate-gifts"],
    sharedImages: ["umbrella"],
    skus: [
      {
        code: "UMB-3FOLD",
        moq: 20,
        tiers: [{ minQty: 20, unitPrice: 280 }],
      },
    ],
    seoTitle: "Custom Umbrella Price in Bangladesh — Branded Umbrellas ৳280",
    seoDescription:
      "Branded folding umbrellas in Dhaka at ৳280 per piece. Wind-resistant fibreglass ribs, water-repellent pongee canopy, screen-printed panels. MOQ 20.",
  },

  {
    slug: "gift-box",
    name: "Corporate Gift Box",
    subtitle: "Curated welcome kit, assembled to your brief",
    shortDescription:
      "A complete branded welcome kit — notebook, pen, flask, umbrella and more — sourced, printed, assembled and boxed by us.",
    description: `Rather than shipping five suppliers' boxes to your office for someone to pack by hand, we assemble the whole kit and deliver it ready to hand over.

Tell us the budget per head and the occasion — onboarding, conference delegate kit, client Eid gift, long-service award — and we will propose a combination and mock it up before anything is printed.

Everything inside is branded to the same artwork, so the kit reads as one designed thing. The presentation box itself is printed too, with an optional insert tray, ribbon and a personalised card.

Contents and price depend on the mix, which is why this one is quoted rather than listed.`,
    specs: [
      { group: "Kit", key: "Typical contents", value: "Notepad, pen, flask or bottle, keyring, umbrella, lanyard, USB" },
      { group: "Kit", key: "Box", value: "Printed rigid box with foam or card insert tray" },
      { group: "Kit", key: "Personalisation", value: "Individual name cards and recipient labels" },
      { group: "Service", key: "Included", value: "Sourcing, branding, assembly, packing and delivery" },
      { group: "Service", key: "Mock-up", value: "Digital mock-up before production, physical sample on request" },
      { group: "Service", key: "Budget", value: "Built to a per-head budget you set" },
      { group: "Delivery", key: "Turnaround", value: "14–21 working days depending on contents" },
    ],
    tags: ["gift box", "welcome kit", "onboarding kit", "delegate kit", "corporate gift"],
    unit: "SET",
    moq: 20,
    pricingMode: "ON_REQUEST",
    leadTimeDaysMin: 14,
    leadTimeDaysMax: 21,
    isFeatured: true,
    badgeText: "Made to brief",
    sortOrder: 100,
    categories: ["corporate-gifts", "bags-packaging"],
    sharedImages: ["Box"],
    skus: [{ code: "GFT-BOX-KIT", priceOnRequest: true, moq: 20 }],
    seoTitle: "Corporate Gift Box in Bangladesh — Custom Welcome Kits",
    seoDescription:
      "Custom corporate gift boxes and welcome kits in Dhaka. Sourced, branded, assembled and delivered to a per-head budget. MOQ 20. Request a quote on WhatsApp.",
  },

  // ─────────────────────────────────────────────────────────── STATIONERY ──
  {
    slug: "card-holder",
    name: "Business Card Holder",
    subtitle: "Leather and steel, laser engraved",
    shortDescription:
      "Slim leather-and-steel business card case, laser engraved with your logo. Holds around 20 cards.",
    description: `A small executive gift that survives the "will they actually use this" test — anyone who still exchanges cards carries one.

Brushed stainless steel body with a leather front panel and a spring-loaded hinge that snaps shut cleanly. The interior holds roughly twenty cards without bowing them.

Your logo is laser engraved into the leather to a clean debossed mark, or etched into the steel back. Because the MOQ is a single piece, this is the one item on the list that works for a one-off award or an individual client gift as well as a bulk order.`,
    specs: [
      { group: "Case", key: "Size", value: "Approx. 95 × 60 × 10 mm" },
      { group: "Case", key: "Body", value: "Brushed stainless steel" },
      { group: "Case", key: "Front panel", value: "PU leather, available in red, black and brown" },
      { group: "Case", key: "Capacity", value: "Approx. 20 business cards" },
      { group: "Case", key: "Closure", value: "Spring-loaded hinge" },
      { group: "Branding", key: "Method", value: "Laser engraving on leather or steel" },
      { group: "Branding", key: "Print area", value: "Approx. 50 × 30 mm" },
      { group: "Packing", key: "Standard", value: "Individual gift box" },
      { group: "Delivery", key: "Turnaround", value: "5–7 working days after artwork approval" },
    ],
    tags: ["card holder", "business card case", "executive gift", "leather", "laser engraved"],
    unit: "PC",
    moq: 1,
    leadTimeDaysMin: 5,
    leadTimeDaysMax: 7,
    sortOrder: 110,
    categories: ["stationery", "corporate-gifts"],
    sharedImages: ["Card-holder", "Card-holder-backside"],
    skus: [
      {
        code: "CRD-HOLDER",
        moq: 1,
        tiers: [
          { minQty: 1, unitPrice: 400 },
          { minQty: 10, unitPrice: 280 },
          { minQty: 20, unitPrice: 260 },
          { minQty: 50, unitPrice: 240 },
        ],
      },
    ],
    seoTitle: "Business Card Holder Price in Bangladesh — Engraved Cases from ৳240",
    seoDescription:
      "Laser-engraved leather and steel business card holders in Dhaka from ৳240 at 50 pcs. Single-piece orders welcome — MOQ 1.",
  },

  {
    slug: "custom-pen",
    name: "Custom Pen",
    subtitle: "Regular and premium metal finishes",
    shortDescription:
      "Branded ballpoint pens in a budget plastic body or a weighted metal premium finish. The highest-volume giveaway there is.",
    description: `The default conference giveaway, and the cheapest way to put your name on a desk.

**Regular** is a lightweight plastic-barrel ballpoint, printed with your logo. At 500 pieces it is the lowest cost-per-impression item in the catalogue — right for delegate bags, registration desks and student events.

**Premium Black** and **Premium White** are weighted metal-barrel pens with a lacquered finish, chrome trim and a smooth-write refill. They feel substantially more expensive than they cost, which makes them the sensible pick for signing ceremonies, boardroom sets and client-facing kits.

All three take a laser-engraved or screen-printed logo along the barrel or on the clip.`,
    specs: [
      { group: "Pen", key: "Type", value: "Retractable ballpoint" },
      { group: "Pen", key: "Regular body", value: "Lightweight plastic barrel" },
      { group: "Pen", key: "Premium body", value: "Weighted metal barrel, lacquered finish with chrome trim" },
      { group: "Pen", key: "Ink", value: "Blue or black, 0.7 mm" },
      { group: "Branding", key: "Regular method", value: "Screen print on barrel" },
      { group: "Branding", key: "Premium method", value: "Laser engraving on barrel or clip" },
      { group: "Branding", key: "Print area", value: "Approx. 45 × 6 mm" },
      { group: "Packing", key: "Optional", value: "Individual velvet sleeve for premium models" },
      { group: "Delivery", key: "Turnaround", value: "5–8 working days after artwork approval" },
    ],
    tags: ["pen", "ballpoint pen", "branded pen", "metal pen", "giveaway"],
    unit: "PC",
    moq: 100,
    leadTimeDaysMin: 5,
    leadTimeDaysMax: 8,
    isFeatured: true,
    sortOrder: 120,
    categories: ["stationery", "corporate-gifts"],
    options: [
      {
        name: "Model",
        position: 1,
        displayAs: "CHIP",
        values: [
          {
            label: "Regular",
            code: "regular",
            isDefault: true,
            description: "Plastic barrel, screen printed.",
            // No photograph supplied — reported in docs/missing-images.json.
            // The storefront falls back to the shared gallery for this value.
          },
          {
            label: "Premium Black",
            code: "premium-black",
            description: "Weighted metal barrel, laser engraved.",
            images: ["Pen-premium-black"],
          },
          {
            label: "Premium White",
            code: "premium-white",
            description: "Weighted metal barrel, laser engraved.",
            images: ["Pen-Premium-white"],
          },
        ],
      },
    ],
    skus: [
      {
        code: "PEN-REGULAR",
        values: { Model: "regular" },
        moq: 100,
        tiers: [
          { minQty: 100, unitPrice: 18 },
          { minQty: 200, unitPrice: 16 },
          { minQty: 500, unitPrice: 14 },
        ],
      },
      {
        code: "PEN-PREM-BLACK",
        values: { Model: "premium-black" },
        moq: 100,
        tiers: [
          { minQty: 100, unitPrice: 28 },
          { minQty: 200, unitPrice: 26 },
          { minQty: 500, unitPrice: 24 },
        ],
      },
      {
        code: "PEN-PREM-WHITE",
        values: { Model: "premium-white" },
        moq: 100,
        tiers: [
          { minQty: 100, unitPrice: 27 },
          { minQty: 200, unitPrice: 25 },
          { minQty: 500, unitPrice: 23 },
        ],
      },
    ],
    seoTitle: "Custom Pen Price in Bangladesh — Branded Pens from ৳14",
    seoDescription:
      "Custom printed and laser-engraved pens in Dhaka from ৳14 per piece at 500 pcs. Plastic and premium metal barrels. MOQ 100.",
  },

  {
    slug: "notepad-a5",
    name: "A5 Spiral Notepad",
    subtitle: "50 pages, 4-colour cover",
    shortDescription:
      "A5 spiral-bound notepad with a full-colour 300 GSM cover and 50 pages of 70 GSM paper. The delegate-kit staple.",
    description: `Sized to sit next to a laptop without taking the desk over, and spiral bound so it folds flat and stays open during a session — which is the whole point at a conference.

The 300 GSM cover is printed in four colours and can carry a full-bleed design, sponsor logos on the back, and an agenda or contact block on the inside. Fifty pages of 70 GSM paper take ballpoint and gel ink without ghosting.

Inner pages can be plain, ruled, dotted or pre-printed with your own session template. Standard for conference kits, training programmes, onboarding packs and university orientation.`,
    specs: [
      { group: "Notepad", key: "Size", value: "A5 — 148 × 210 mm" },
      { group: "Notepad", key: "Pages", value: "50 pages" },
      { group: "Cover", key: "Paper", value: "300 GSM" },
      { group: "Cover", key: "Printing", value: "4-colour" },
      { group: "Inner", key: "Paper", value: "70 GSM" },
      { group: "Inner", key: "Layout", value: "Plain, ruled, dotted or custom pre-printed" },
      { group: "Binding", key: "Type", value: "Spiral binding — folds flat" },
      { group: "Options", key: "Extras", value: "Matte lamination, back-cover sponsor block, inside agenda print" },
      ARTWORK_SPEC,
      { group: "Delivery", key: "Turnaround", value: "5–7 working days after artwork approval" },
    ],
    tags: ["notepad", "notebook", "a5 notebook", "conference kit", "spiral notebook"],
    unit: "PC",
    moq: 50,
    leadTimeDaysMin: 5,
    leadTimeDaysMax: 7,
    isFeatured: true,
    sortOrder: 130,
    categories: ["stationery", "corporate-gifts"],
    sharedImages: ["Notepad"],
    skus: [
      {
        code: "NPD-A5-SPIRAL",
        moq: 50,
        tiers: [{ minQty: 50, unitPrice: 80 }],
      },
    ],
    seoTitle: "A5 Notepad Printing Price in Bangladesh — Custom Notebooks ৳80",
    seoDescription:
      "Custom A5 spiral notepads in Dhaka at ৳80 per piece. 50 pages of 70 GSM paper, 4-colour 300 GSM cover. MOQ 50.",
  },

  // ─────────────────────────────────────────────────────── BAGS/PACKAGING ──
  {
    slug: "goody-bag",
    name: "Paper Goody Bag",
    subtitle: "150 GSM, 9″ × 13″ × 3″",
    shortDescription:
      "Full-colour printed paper carry bag with rope handles. Holds a delegate kit without the handles tearing.",
    description: `The bag everything else goes in — and the one piece of the kit that walks around the venue all day advertising you.

Printed on 150 GSM art paper with a 3-inch gusset, so a notepad, bottle and folder fit without the bag splitting at the base. Twisted-rope handles are eyeleted rather than glued flat, which is the usual failure point on cheap event bags.

At 9″ × 13″ it takes an A4 folder upright. Full-colour printing both sides means front branding and back-panel sponsor logos, which is often how the bag pays for itself.`,
    specs: [
      { group: "Bag", key: "Size", value: '9″ × 13″ × 3″' },
      { group: "Bag", key: "Paper", value: "150 GSM art paper" },
      { group: "Bag", key: "Gusset", value: "3 inch base and sides" },
      { group: "Bag", key: "Handles", value: "Twisted rope, eyeleted" },
      { group: "Printing", key: "Method", value: "4-colour offset, both sides" },
      { group: "Options", key: "Finish", value: "Matte or gloss lamination" },
      { group: "Options", key: "Capacity", value: "Fits an A4 folder upright" },
      ARTWORK_SPEC,
      { group: "Delivery", key: "Turnaround", value: "5–8 working days after artwork approval" },
    ],
    tags: ["goody bag", "paper bag", "shopping bag", "event bag", "delegate bag"],
    unit: "PC",
    moq: 100,
    leadTimeDaysMin: 5,
    leadTimeDaysMax: 8,
    sortOrder: 140,
    categories: ["bags-packaging"],
    sharedImages: ["Goody-bag"],
    skus: [
      {
        code: "BAG-GOODY-150",
        moq: 100,
        tiers: [
          { minQty: 100, unitPrice: 60 },
          { minQty: 250, unitPrice: 45 },
          { minQty: 500, unitPrice: 38 },
        ],
      },
    ],
    seoTitle: "Paper Bag Printing Price in Bangladesh — Goody Bags from ৳38",
    seoDescription:
      "Custom printed paper goody bags in Dhaka from ৳38 at 500 pcs. 150 GSM, 9″ × 13″ × 3″, rope handles, full colour both sides. MOQ 100.",
  },

  // ───────────────────────────────────────────────────────── PUBLICATIONS ──
  {
    slug: "certificate",
    name: "Certificate",
    subtitle: "220 GSM textured paper",
    shortDescription:
      "Award and participation certificates on 220 GSM textured paper, in black-and-white or full colour.",
    description: `Printed on 220 GSM textured stock — heavy enough that it does not flop when handed over on stage, and toothy enough to take a signature in ink without feathering.

**Black and white** is the economical option for participation and attendance certificates in large runs, where the design is a printed border and a seal.

**Full colour** carries logos, gradients, sponsor bands and photographic backgrounds, and is the right choice for awards, convocations and anything that will be framed.

Names, dates, roll numbers and certificate serials are variable printed from your spreadsheet, so a thousand certificates arrive personalised and in order. Gold and silver foiling, embossed seals and A4 or A3 sizes are available.`,
    specs: [
      { group: "Certificate", key: "Size", value: "A4 — 210 × 297 mm (A3 available)" },
      { group: "Certificate", key: "Paper", value: "220 GSM textured (ambush) paper" },
      { group: "Certificate", key: "Orientation", value: "Portrait or landscape" },
      { group: "Printing", key: "Options", value: "Black and white, or full colour" },
      { group: "Printing", key: "Sides", value: "Single sided (double sided on request)" },
      { group: "Personalisation", key: "Variable data", value: "Names, dates, roll numbers and serials from your spreadsheet" },
      { group: "Options", key: "Finishing", value: "Gold or silver foiling, embossed seal, presentation folder" },
      ARTWORK_SPEC,
      { group: "Delivery", key: "Turnaround", value: "3–5 working days after artwork approval" },
    ],
    tags: ["certificate", "award certificate", "participation certificate", "convocation", "printing"],
    unit: "PC",
    moq: 100,
    leadTimeDaysMin: 3,
    leadTimeDaysMax: 5,
    isFeatured: true,
    sortOrder: 150,
    categories: ["publications"],
    options: [
      {
        name: "Print",
        position: 1,
        displayAs: "CHIP",
        values: [
          {
            label: "Black & White",
            code: "bw",
            isDefault: true,
            description: "Economical for large participation runs.",
            images: ["Certificate-black-and-white"],
          },
          {
            label: "Full Colour",
            code: "colour",
            description: "Logos, gradients and photographic backgrounds.",
            images: ["Certificate-4-color"],
          },
        ],
      },
    ],
    skus: [
      {
        code: "CRT-BW",
        values: { Print: "bw" },
        moq: 100,
        tiers: [
          { minQty: 100, unitPrice: 15 },
          { minQty: 300, unitPrice: 12 },
          { minQty: 1000, unitPrice: 8 },
        ],
      },
      {
        code: "CRT-COLOUR",
        values: { Print: "colour" },
        moq: 100,
        tiers: [
          { minQty: 100, unitPrice: 23 },
          { minQty: 300, unitPrice: 18 },
          { minQty: 1000, unitPrice: 12 },
        ],
      },
    ],
    seoTitle: "Certificate Printing Price in Bangladesh — from ৳8 per Copy",
    seoDescription:
      "Certificate printing in Dhaka on 220 GSM textured paper from ৳8 per copy at 1,000 pcs. Black and white or full colour, with variable-data names. MOQ 100.",
  },

  {
    slug: "magazine",
    name: "Magazine / Annual Report",
    subtitle: "Perfect-bound, full colour",
    shortDescription:
      "Perfect-bound magazines, annual reports, souvenirs and yearbooks printed in full colour throughout.",
    description: `Annual reports, event souvenirs, university yearbooks and club magazines — anything that needs a spine and a shelf life.

Perfect binding gives a flat printed spine that looks finished on a shelf and takes a title, which saddle-stitching cannot. Covers are 300 GSM with matte lamination; inner pages are 100 GSM art paper printed in four colours throughout.

We handle page imposition, colour proofing and the pre-press work, so what you approve on screen is what comes off the press. Layout and design can be done in-house if you only have the raw content.

Page count, paper and binding all move the price, so tell us the spec and we will quote exactly.`,
    specs: [
      { group: "Publication", key: "Size", value: "A4 — 210 × 297 mm (custom sizes available)" },
      { group: "Publication", key: "Typical extent", value: "32–120 pages" },
      { group: "Cover", key: "Paper", value: "300 GSM art card" },
      { group: "Cover", key: "Finish", value: "Matte lamination, spot UV available" },
      { group: "Inner", key: "Paper", value: "100 GSM art paper" },
      { group: "Inner", key: "Printing", value: "4-colour throughout" },
      { group: "Binding", key: "Type", value: "Perfect binding (saddle stitch for lower page counts)" },
      { group: "Service", key: "Included", value: "Imposition, colour proofing and pre-press" },
      { group: "Service", key: "Optional", value: "Full design and layout" },
      { group: "Delivery", key: "Turnaround", value: "7–12 working days after artwork approval" },
    ],
    tags: ["magazine", "annual report", "souvenir", "yearbook", "perfect binding"],
    unit: "PC",
    moq: 100,
    leadTimeDaysMin: 7,
    leadTimeDaysMax: 12,
    sortOrder: 160,
    categories: ["publications"],
    sharedImages: ["Magazine", "Magazine-inside"],
    skus: [
      {
        code: "MAG-PERFECT",
        moq: 100,
        tiers: [{ minQty: 100, unitPrice: 140 }],
      },
    ],
    seoTitle: "Magazine & Annual Report Printing in Bangladesh — from ৳140",
    seoDescription:
      "Perfect-bound magazine, souvenir and annual report printing in Dhaka from ৳140 per copy at 100 pcs. Full colour, 300 GSM cover, 100 GSM inner. MOQ 100.",
  },

  {
    slug: "event-tickets",
    name: "Event Ticket Booklet",
    subtitle: "Numbered and perforated",
    shortDescription:
      "Serially numbered, perforated event tickets bound into counterfoil booklets. Price depends on size, numbering and finish.",
    description: `Tickets that can actually be controlled at a gate. Each ticket carries a unique serial number and tears along a perforation, leaving the numbered counterfoil in the booklet — so the stub count reconciles against the gate count at the end of the night.

Bound in books of 50 or 100 with a stiff back board. Optional security features include a foil strip, microtext, a UV-reactive mark and a scannable QR code unique to each ticket.

Used for concerts, fairs, raffles, food coupons and paid entry events. Different ticket classes can be colour coded in the same run.

Quoted rather than listed, because numbering, perforation and security features change the price considerably.`,
    specs: [
      { group: "Ticket", key: "Typical size", value: "180 × 70 mm with counterfoil" },
      { group: "Ticket", key: "Paper", value: "250 GSM art card" },
      { group: "Ticket", key: "Printing", value: "Full colour, both sides" },
      { group: "Control", key: "Numbering", value: "Unique sequential serial on ticket and counterfoil" },
      { group: "Control", key: "Perforation", value: "Tear-off line between ticket and stub" },
      { group: "Control", key: "Optional security", value: "Foil strip, microtext, UV mark, unique QR code" },
      { group: "Binding", key: "Booklets", value: "Books of 50 or 100 with back board" },
      { group: "Options", key: "Classes", value: "Colour-coded ticket classes in one run" },
      { group: "Delivery", key: "Turnaround", value: "5–8 working days after artwork approval" },
    ],
    tags: ["event tickets", "raffle tickets", "coupon", "numbered tickets", "printing"],
    unit: "PC",
    moq: 100,
    pricingMode: "ON_REQUEST",
    leadTimeDaysMin: 5,
    leadTimeDaysMax: 8,
    sortOrder: 170,
    categories: ["publications"],
    sharedImages: ["Tickets"],
    skus: [{ code: "TKT-BOOKLET", priceOnRequest: true, moq: 100 }],
    seoTitle: "Event Ticket Printing in Bangladesh — Numbered & Perforated",
    seoDescription:
      "Serially numbered, perforated event ticket booklets printed in Dhaka. Foil, UV and QR security options. MOQ 100. Request a quote on WhatsApp.",
  },

  // ───────────────────────────────────────────────────────── LARGE FORMAT ──
  {
    slug: "pvc-banner",
    name: "PVC Banner",
    subtitle: "Priced per square foot",
    shortDescription:
      "Outdoor-grade PVC flex banner printed at high resolution and priced per square foot. Eyelets and hemming included.",
    description: `The standard banner for shop fronts, gates, stage sides and roadside promotion. Printed on solid PVC flex at high resolution, heat-welded at the hems and fitted with brass eyelets every two feet so it can be tied off without tearing.

**White PVC** is the everyday backing — bright, opaque and the most economical.

**Black PVC** has a black backing layer that blocks light bleed, so artwork does not ghost through when the banner is lit from behind or hung in front of a window. It also reads richer at night under floodlight.

Priced by area, so tell us the width and height and the calculator on this page works out the square footage for you.`,
    specs: [
      { group: "Banner", key: "Material", value: "PVC flex, outdoor grade" },
      { group: "Banner", key: "Backing options", value: "White PVC or light-blocking Black PVC" },
      { group: "Printing", key: "Resolution", value: "High-resolution solvent, full colour" },
      { group: "Printing", key: "Weather", value: "UV and rain resistant, suitable for outdoor use" },
      { group: "Finishing", key: "Hems", value: "Heat-welded on all four sides" },
      { group: "Finishing", key: "Eyelets", value: "Brass eyelets at approx. 2 ft intervals" },
      { group: "Sizing", key: "Pricing", value: "Charged per square foot (width × height)" },
      { group: "Sizing", key: "Maximum width", value: "10 ft in a single seamless piece" },
      ARTWORK_SPEC,
      { group: "Delivery", key: "Turnaround", value: "1–2 working days after artwork approval" },
    ],
    tags: ["pvc banner", "flex banner", "outdoor banner", "signage", "banner price per sqft"],
    unit: "SQFT",
    unitLabel: "sq.ft.",
    moq: 100,
    leadTimeDaysMin: 1,
    leadTimeDaysMax: 2,
    isFeatured: true,
    badgeText: "Next-day print",
    sortOrder: 180,
    categories: ["large-format"],
    sharedImages: ["Banner"],
    options: [
      {
        name: "Material",
        position: 1,
        displayAs: "SWATCH",
        helpText:
          "Black PVC blocks light bleed — use it for backlit positions and night events.",
        values: [
          { label: "White PVC", code: "white-pvc", swatchHex: "#FFFFFF", isDefault: true },
          { label: "Black PVC", code: "black-pvc", swatchHex: "#111111" },
        ],
      },
    ],
    skus: [
      {
        code: "BNR-PVC-WHITE",
        values: { Material: "white-pvc" },
        moq: 100,
        tiers: [
          { minQty: 100, unitPrice: 18 },
          { minQty: 500, unitPrice: 14 },
          { minQty: 1000, unitPrice: 13 },
        ],
      },
      {
        code: "BNR-PVC-BLACK",
        values: { Material: "black-pvc" },
        moq: 100,
        tiers: [
          { minQty: 100, unitPrice: 20 },
          { minQty: 500, unitPrice: 16 },
          { minQty: 1000, unitPrice: 15 },
        ],
      },
    ],
    seoTitle: "PVC Banner Price per Sqft in Bangladesh — from ৳13",
    seoDescription:
      "PVC flex banner printing in Dhaka from ৳13 per square foot at 1,000 sqft. White or light-blocking black PVC, hemmed with brass eyelets. Next-day print.",
  },

  {
    slug: "backdrop",
    name: "Step & Repeat Backdrop",
    subtitle: "Press wall and photo backdrop",
    shortDescription:
      "Full-height step-and-repeat backdrop wall with frame — the branded surface every photo from your event ends up in front of.",
    description: `Every photograph taken at the event is a photograph of this wall, which is why sponsors care about it more than almost anything else you print.

Printed on wrinkle-resistant fabric or matte PVC — matte, because a glossy backdrop throws camera flash straight back and ruins the shot. Supplied with a demountable aluminium truss frame that two people can put up in about twenty minutes and pack into a bag afterwards.

Logo repeat spacing is laid out so that no matter where someone stands, at least one complete sponsor logo lands in frame beside them. We set that grid for you from the sponsor list.

Priced per square foot with the frame quoted separately, so size, material and frame choice all matter — tell us the dimensions and we will price it.`,
    specs: [
      { group: "Backdrop", key: "Typical size", value: "8 ft × 10 ft, 8 ft × 12 ft or made to measure" },
      { group: "Backdrop", key: "Material", value: "Wrinkle-resistant fabric or matte PVC" },
      { group: "Backdrop", key: "Finish", value: "Matte — avoids camera flash glare" },
      { group: "Printing", key: "Method", value: "High-resolution full colour" },
      { group: "Layout", key: "Logo grid", value: "Repeat spacing set so a full logo lands in every frame" },
      { group: "Frame", key: "Type", value: "Demountable aluminium truss, quoted separately" },
      { group: "Frame", key: "Setup", value: "Approx. 20 minutes, two people, no tools" },
      { group: "Frame", key: "Transport", value: "Packs into a carry bag" },
      { group: "Delivery", key: "Turnaround", value: "3–5 working days after artwork approval" },
    ],
    tags: ["backdrop", "step and repeat", "press wall", "photo backdrop", "event branding"],
    unit: "SQFT",
    unitLabel: "sq.ft.",
    moq: 60,
    pricingMode: "ON_REQUEST",
    leadTimeDaysMin: 3,
    leadTimeDaysMax: 5,
    isFeatured: true,
    sortOrder: 190,
    categories: ["large-format"],
    sharedImages: ["Banner-Large", "Banner-small"],
    skus: [{ code: "BDP-STEPREPEAT", priceOnRequest: true, moq: 60 }],
    seoTitle: "Step & Repeat Backdrop in Bangladesh — Event Press Walls",
    seoDescription:
      "Custom step-and-repeat photo backdrops and press walls in Dhaka. Matte fabric or PVC with demountable aluminium frame. Request a quote on WhatsApp.",
  },

  {
    slug: "x-banner",
    name: "X Banner with Stand",
    subtitle: "Portable standee, complete with frame",
    shortDescription:
      "Lightweight X-frame standee supplied complete with the printed panel. Sets up in under a minute, no tools.",
    description: `The standee you put beside a registration desk, a stall entrance or a stage door. Complete with the frame, not just the print.

The X-shaped fibreglass frame clips into four grommets at the panel corners and tensions the print flat. Setup takes under a minute and it collapses into a slim carry bag, which matters when the same banner travels to six events.

Printed on 340 GSM matte PVC — matte rather than gloss so overhead venue lighting does not wash it out.

At a 1-piece minimum this is the one large-format item you can order a single unit of, though the price drops sharply at five and ten.`,
    specs: [
      { group: "Standee", key: "Panel size", value: "60 × 160 cm (24″ × 63″)" },
      { group: "Standee", key: "Panel material", value: "340 GSM matte PVC" },
      { group: "Standee", key: "Printing", value: "High-resolution full colour, single sided" },
      { group: "Frame", key: "Type", value: "X-frame, fibreglass rods with adjustable centre" },
      { group: "Frame", key: "Fixing", value: "Four corner grommets" },
      { group: "Frame", key: "Setup", value: "Under 1 minute, no tools" },
      { group: "Frame", key: "Transport", value: "Slim carry bag included" },
      { group: "Options", key: "Replacement", value: "Reprint panels for an existing frame" },
      ARTWORK_SPEC,
      { group: "Delivery", key: "Turnaround", value: "2–3 working days after artwork approval" },
    ],
    tags: ["x banner", "standee", "roll up banner", "display stand", "event signage"],
    unit: "SET",
    moq: 1,
    leadTimeDaysMin: 2,
    leadTimeDaysMax: 3,
    sortOrder: 200,
    categories: ["large-format"],
    sharedImages: ["x-banner"],
    skus: [
      {
        code: "XBN-STAND",
        moq: 1,
        tiers: [
          { minQty: 1, unitPrice: 800 },
          { minQty: 5, unitPrice: 650 },
          { minQty: 10, unitPrice: 550 },
        ],
      },
    ],
    seoTitle: "X Banner Stand Price in Bangladesh — Standee with Print from ৳550",
    seoDescription:
      "X-banner standees in Dhaka from ৳550 each at 10 pcs, complete with frame and printed panel. 60 × 160 cm matte PVC. Single units available.",
  },
];
