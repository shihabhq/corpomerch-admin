/**
 * Quick-add specification templates.
 *
 * Consistent spec keys across a category are what make the storefront's spec
 * tables scannable — and stop three different people writing "GSM", "gsm" and
 * "Paper weight" for the same field.
 */
export const SPEC_TEMPLATES: {
  name: string;
  rows: { group: string; key: string; value: string }[];
}[] = [
  {
    name: "Print job",
    rows: [
      { group: "Print", key: "Size", value: "" },
      { group: "Print", key: "Paper", value: "" },
      { group: "Print", key: "GSM", value: "" },
      { group: "Print", key: "Colours", value: "4-colour, both sides" },
      { group: "Print", key: "Finish", value: "" },
      { group: "Print", key: "Binding", value: "" },
      { group: "Artwork", key: "Accepted files", value: "AI, PDF, PSD or CDR at 300 DPI with 3 mm bleed." },
      { group: "Delivery", key: "Turnaround", value: "" },
    ],
  },
  {
    name: "ID card",
    rows: [
      { group: "Card", key: "Size", value: "" },
      { group: "Card", key: "Material", value: "" },
      { group: "Card", key: "Printing", value: "Full colour, both sides" },
      { group: "Card", key: "Finish", value: "" },
      { group: "Card", key: "Punch", value: "" },
      { group: "Options", key: "Variable data", value: "Names, designations and QR codes" },
      { group: "Delivery", key: "Turnaround", value: "" },
    ],
  },
  {
    name: "Drinkware",
    rows: [
      { group: "Product", key: "Capacity", value: "" },
      { group: "Product", key: "Material", value: "" },
      { group: "Product", key: "Lid", value: "" },
      { group: "Branding", key: "Method", value: "" },
      { group: "Branding", key: "Print area", value: "" },
      { group: "Care", key: "Washing", value: "" },
      { group: "Delivery", key: "Turnaround", value: "" },
    ],
  },
  {
    name: "Large format",
    rows: [
      { group: "Banner", key: "Material", value: "" },
      { group: "Printing", key: "Resolution", value: "High-resolution solvent, full colour" },
      { group: "Printing", key: "Weather", value: "UV and rain resistant" },
      { group: "Finishing", key: "Hems", value: "Heat-welded on all four sides" },
      { group: "Finishing", key: "Eyelets", value: "Brass eyelets at approx. 2 ft intervals" },
      { group: "Sizing", key: "Pricing", value: "Charged per square foot (width × height)" },
      { group: "Delivery", key: "Turnaround", value: "" },
    ],
  },
  {
    name: "Gift / merchandise",
    rows: [
      { group: "Product", key: "Size", value: "" },
      { group: "Product", key: "Material", value: "" },
      { group: "Branding", key: "Method", value: "" },
      { group: "Branding", key: "Print area", value: "" },
      { group: "Packing", key: "Standard", value: "" },
      { group: "Delivery", key: "Turnaround", value: "" },
    ],
  },
];
