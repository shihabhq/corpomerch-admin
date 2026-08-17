"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import * as Icons from "lucide-react";
import { Circle, LogOut, Menu, X } from "lucide-react";

import { NAV } from "@/config/nav";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Resolved =
    (Icons as unknown as Record<string, React.ElementType>)[name] || Circle;
  return <Resolved className={className} aria-hidden />;
}

export function Sidebar({
  session,
  counts,
}: {
  session: { email: string; fullName: string | null; role: string };
  counts: { inquiries: number };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 scrollbar-thin">
      {NAV.map((group) => (
        <div key={group.title}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const badgeCount =
                item.badge === "inquiries" ? counts.inquiries : 0;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-tint text-brand"
                        : "text-body hover:bg-surface hover:text-ink",
                    )}
                  >
                    <NavIcon name={item.icon} className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {badgeCount > 0 ? (
                      <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
          {(session.fullName ?? session.email).charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink">
            {session.fullName ?? session.email}
          </p>
          <p className="truncate text-[10px] uppercase tracking-wide text-faint">
            {session.role}
          </p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="rounded-lg p-1.5 text-faint transition-colors hover:bg-surface hover:text-brand"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-ml-1 rounded-lg p-2 text-ink hover:bg-surface"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>
        <span className="text-sm font-semibold text-ink">
          CorpoMerch <span className="text-brand">Admin</span>
        </span>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-14 shrink-0 items-center border-b border-line px-5">
          <Link href="/" className="text-sm font-semibold text-ink">
            CorpoMerch <span className="text-brand">Admin</span>
          </Link>
        </div>
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
              <span className="text-sm font-semibold text-ink">
                CorpoMerch <span className="text-brand">Admin</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-ink hover:bg-surface"
                aria-label="Close navigation"
              >
                <X className="size-4" />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      ) : null}
    </>
  );
}
