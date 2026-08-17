import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Runtime queries go through the Supabase *transaction* pooler (port 6543).
 * Migrations use DIRECT_URL (session pooler, 5432) — see prisma.config.ts.
 *
 * SSL is configured here rather than via `?sslmode=` in the URL on purpose:
 * node-postgres 8.16+ treats `sslmode=require` as `verify-full`, which fails
 * against Supabase's pooler certificate chain with SELF_SIGNED_CERT_IN_CHAIN.
 * The connection is still encrypted; only chain verification is relaxed.
 */
function createClient() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }

  // node-postgres derives its SSL settings from `sslmode` in the URL and that
  // takes precedence over the `ssl` option below, so it has to come out.
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  const connectionString = url.toString();

  const adapter = new PrismaPg({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

// Reuse across hot reloads in dev, or every save leaks a connection pool and
// the pooler starts refusing connections.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
