/** Sidebar navigation as data, never inline JSX. */
export interface NavItem {
  href: string;
  label: string;
  /** lucide-react export name */
  icon: string;
  /** Show a live count badge fetched by the layout. */
  badge?: "inquiries";
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: "LayoutDashboard" }],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/products", label: "Products", icon: "Package" },
      { href: "/categories", label: "Categories", icon: "FolderTree" },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/inquiries", label: "Inquiries", icon: "Inbox", badge: "inquiries" },
    ],
  },
  {
    title: "Connect",
    items: [{ href: "/connect", label: "Connect cards", icon: "Nfc" }],
  },
  {
    title: "Site content",
    items: [
      { href: "/portfolio", label: "Portfolio", icon: "Images" },
      { href: "/partners", label: "Partners", icon: "Handshake" },
      { href: "/banners", label: "Banners", icon: "GalleryHorizontal" },
      { href: "/testimonials", label: "Testimonials", icon: "Quote" },
      { href: "/faqs", label: "FAQs", icon: "MessagesSquare" },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/settings", label: "Site settings", icon: "Settings" },
      { href: "/users", label: "Admin users", icon: "Users" },
    ],
  },
];

