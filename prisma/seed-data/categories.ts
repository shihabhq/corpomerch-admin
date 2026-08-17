import type { SeedCategory } from "./types";

/**
 * Two levels maximum — the storefront nav is a two-level mega-menu and a DB
 * trigger rejects anything deeper.
 */
export const categories: SeedCategory[] = [
  {
    slug: "id-cards-lanyards",
    name: "ID Cards & Lanyards",
    iconKey: "IdCard",
    sortOrder: 10,
    description:
      "Event badges, access cards and lanyards — printed, laminated and ready to hand out on registration day.",
  },
  {
    slug: "id-cards",
    name: "ID Cards",
    parent: "id-cards-lanyards",
    iconKey: "CreditCard",
    sortOrder: 11,
    description:
      "Paper, PVC and RFID identity cards in every standard event and office size.",
  },
  {
    slug: "lanyards",
    name: "Lanyards & Ribbons",
    parent: "id-cards-lanyards",
    iconKey: "Ribbon",
    sortOrder: 12,
    description:
      "Custom-printed polyester lanyards with ring, single-hook or double-hook fittings.",
  },

  {
    slug: "drinkware",
    name: "Drinkware",
    iconKey: "CupSoda",
    sortOrder: 20,
    description:
      "Branded bottles, thermal flasks and mugs — the corporate gift people actually keep using.",
  },

  {
    slug: "keyrings-badges",
    name: "Keyrings & Badges",
    iconKey: "KeyRound",
    sortOrder: 30,
    description:
      "Laser-cut wooden and acrylic keyrings, name badges and lapel pins.",
  },

  {
    slug: "print-signage",
    name: "Print & Signage",
    iconKey: "Printer",
    sortOrder: 40,
    description:
      "Everything from a 1,000-copy certificate run to a full step-and-repeat backdrop wall.",
  },
  {
    slug: "large-format",
    name: "Large Format & Signage",
    parent: "print-signage",
    iconKey: "Flag",
    sortOrder: 41,
    description:
      "PVC banners, backdrops, standees and X-banners, priced per square foot.",
  },
  {
    slug: "publications",
    name: "Publications & Print",
    parent: "print-signage",
    iconKey: "BookOpen",
    sortOrder: 42,
    description:
      "Certificates, magazines, annual reports, souvenirs and event tickets.",
  },

  {
    slug: "stationery",
    name: "Stationery & Desk",
    iconKey: "PenLine",
    sortOrder: 50,
    description:
      "Notepads, pens, card holders and desk accessories carrying your logo.",
  },

  {
    slug: "bags-packaging",
    name: "Bags & Packaging",
    iconKey: "ShoppingBag",
    sortOrder: 60,
    description:
      "Paper goody bags, gift boxes and packaging for delegate kits.",
  },

  {
    slug: "corporate-gifts",
    name: "Corporate Gifts",
    iconKey: "Gift",
    sortOrder: 70,
    description:
      "Curated welcome kits and joining gifts, assembled and packed to your brief.",
  },
];
