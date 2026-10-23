import type { SeedCategory, SeedProduct } from "./types";

/**
 * Corpomerch Connect Plus — the NFC digital business card.
 *
 * Kept apart from products.ts so it can be loaded on its own with
 *   npm run seed -- --only=connect-plus
 * which touches nothing else in the catalogue (a full seed re-upserts every
 * product and would overwrite edits made through the admin panel).
 *
 * No price is stated: pricing is on request until it is decided, and the SKUs
 * are marked priceOnRequest so the storefront shows "Price on Request".
 */
export const connectCategory: SeedCategory = {
  slug: "smart-cards",
  name: "Smart Cards",
  iconKey: "Nfc",
  sortOrder: 15,
  description: "NFC digital business cards that share your contact details with a single tap.",
};

export const connectPlus: SeedProduct = {
  slug: "connect-plus",
  name: "Connect Plus",
  subtitle: "NFC smart business card",
  shortDescription:
    "A premium PVC business card with a built-in NFC chip and QR code. One tap opens your live digital profile — no app, no reprinting, no subscription.",
  description: `Connect Plus is a customised digital business card built into a premium, splash-resistant PVC card. Tap it on a phone and your profile opens instantly in the browser — your name, role, company, phone, email, website, address and social links, with a one-touch **Save contact** button.

Phones without NFC aren't left out: every card carries a **dynamic QR code on the back** that opens the same profile. The code never expires, supports unlimited scans and taps, and keeps working even after you change your details.

## Why Connect Plus

- **One-time payment.** No monthly or yearly fees.
- **Always up to date.** Change your job title, number or links whenever you like — the card stays the same, the profile updates instantly.
- **No app needed.** The person you meet taps or scans and your profile opens in their web browser.
- **Fully yours.** Both sides of the card are customised with your logo, colours, fonts and branding.
- **Beautiful profile.** Choose from several colour themes, each with light and dark mode.

## Two materials

**White** — a clean, bright finish on splash-resistant premium PVC.
**Black** — a premium black material with a distinctly different look and feel.

## How it works

1. **Order.** Place your order on this site or message us on WhatsApp.
2. **Design.** Send your logo, colours, fonts and branding. Front and back are both customisable, and we handle the artwork.
3. **Activate.** When your card arrives, tap it or scan the QR code, create your account with your email and a password, and verify your email.
4. **Build your profile.** Add your photo, details and links, pick a theme, and save. Your profile is live.

Only you can edit your profile. Everyone else who taps or scans your card simply sees it.

## Frequently asked questions

**Does the other person need an app?**
No. Tapping the card or scanning the QR code opens your profile in their web browser.

**What can I put on my profile?**
Your name, title, company, bio, photo, phone, WhatsApp, email, website, address and any number of social or custom links.

**Do I need more than one card?**
No. One card is enough — your information lives online, so you can update it at any time without replacing the card.

**Which phones work with NFC?**
Most modern smartphones, including iPhone 7 and newer and the majority of recent Android phones. If a phone doesn't support NFC, the QR code on the back does the same job.`,
  specs: [
    { group: "Card", key: "Size", value: "85.5 × 54 × 1.00 mm (standard card size)" },
    { group: "Card", key: "Material", value: "Splash-resistant premium PVC" },
    { group: "Card", key: "Materials available", value: "White, Black (premium black material)" },
    { group: "Technology", key: "NFC", value: "Built-in NFC chip — tap to open your profile" },
    { group: "Technology", key: "QR code", value: "Dynamic QR code on the back — never expires, editable, unlimited scans" },
    { group: "Technology", key: "Compatibility", value: "iPhone 7 and newer, most recent Android phones; QR for everything else" },
    { group: "Profile", key: "Contents", value: "Name, title, company, bio, photo, phone, WhatsApp, email, website, address, social and custom links" },
    { group: "Profile", key: "Themes", value: "5 colour themes, each in light and dark mode" },
    { group: "Profile", key: "Updates", value: "Edit any time after activation; no reprint needed" },
    { group: "Customisation", key: "Printing", value: "Both sides — your logo, colours, fonts and branding" },
    { group: "Pricing", key: "Model", value: "One-time payment. No monthly or yearly fees." },
  ],
  tags: ["nfc card", "digital business card", "smart card", "qr code", "networking", "connect"],
  unit: "PC",
  pricingMode: "ON_REQUEST",
  isFeatured: true,
  badgeText: "New",
  sortOrder: 5,
  categories: ["smart-cards"],
  sharedImages: ["connect-plus1", "connect-plus2", "connect-plus3"],
  options: [
    {
      name: "Material",
      position: 1,
      displayAs: "CHIP",
      helpText: "White is a clean bright finish; Black is a premium black material.",
      values: [
        { label: "White", code: "white", isDefault: true, swatchHex: "#f5f5f5" },
        { label: "Black", code: "black", swatchHex: "#111111" },
      ],
    },
  ],
  skus: [
    { code: "CONNECT-PLUS-WHITE", values: { Material: "white" }, priceOnRequest: true },
    { code: "CONNECT-PLUS-BLACK", values: { Material: "black" }, priceOnRequest: true },
  ],
  seoTitle: "Connect Plus NFC Business Card in Bangladesh — Digital Smart Card",
  seoDescription:
    "Connect Plus is a premium PVC NFC business card with a dynamic QR code. Tap to share your live digital profile — no app, no subscription. Customised on both sides.",
};
