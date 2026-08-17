import { Sidebar } from "@/components/layout/Sidebar";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  // proxy.ts only redirects signed-out visitors. THIS is the authorisation
  // check: a Supabase session without an active admin_users row lands back
  // on /login.
  const session = await requireAdmin();

  const newInquiries = await prisma.inquiry.count({ where: { status: "NEW" } });

  return (
    <div className="min-h-dvh">
      <Sidebar
        session={{
          email: session.email,
          fullName: session.fullName,
          role: session.role,
        }}
        counts={{ inquiries: newInquiries }}
      />
      <div className="lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
