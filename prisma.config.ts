import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 moved connection URLs out of schema.prisma and into this file.
 *
 * Migrations point at DIRECT_URL — the Supabase *session* pooler (port 5432).
 * The transaction pooler (6543) cannot hold the advisory locks or prepared
 * statements the migration engine relies on, so pointing this at DATABASE_URL
 * fails in confusing ways. Runtime queries use DATABASE_URL via the pg driver
 * adapter in src/lib/prisma.ts instead.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
