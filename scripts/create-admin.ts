/**
 * Bootstrap the first administrator.
 *
 *   npx tsx scripts/create-admin.ts <email> [full name]
 *
 * Creating a Supabase Auth user normally needs the service-role key, which
 * deliberately does not exist in the app. This script uses the ordinary public
 * sign-up endpoint instead, then inserts the matching `admin_users` row through
 * Prisma — which is the part that actually grants access.
 *
 * After the first admin exists, add the rest from the Users screen in the
 * panel; this script is only for chicken-and-egg bootstrap.
 *
 * If SUPABASE_SECRET_KEY is set, it is used instead so the account is created
 * pre-confirmed and can sign in immediately.
 */

import "dotenv/config";

import { randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = new URL(process.env.DIRECT_URL!);
url.searchParams.delete("sslmode");
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
  }),
});

function strongPassword() {
  // 24 url-safe characters, plus a guaranteed symbol/digit/upper for policies.
  return `${randomBytes(18).toString("base64url")}aA1!`;
}

async function main() {
  const email = process.argv[2];
  const fullName = process.argv.slice(3).join(" ") || null;

  if (!email?.includes("@")) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> [full name]");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!supabaseUrl || !anonKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY are not set.");
    process.exit(1);
  }

  const password = strongPassword();
  let userId: string | undefined;
  let needsConfirmation = false;

  if (secretKey) {
    const admin = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false },
    });
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      console.error("Could not create the auth user:", error.message);
      process.exit(1);
    }
    userId = data.user?.id;
  } else {
    const anon = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    });
    const { data, error } = await anon.auth.signUp({ email, password });
    if (error) {
      console.error("Sign-up failed:", error.message);
      console.error(
        "\nIf sign-ups are disabled for this project, either enable them briefly in\n" +
          "Supabase → Authentication → Providers, or set SUPABASE_SECRET_KEY in .env\n" +
          "and re-run this script.",
      );
      process.exit(1);
    }
    userId = data.user?.id;
    // With "Confirm email" on, the session is null until they click the link.
    needsConfirmation = !data.session;
  }

  if (!userId) {
    console.error("Supabase did not return a user id.");
    process.exit(1);
  }

  await prisma.adminUser.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: email.toLowerCase(),
      fullName,
      role: "ADMIN",
      isActive: true,
    },
    update: { email: email.toLowerCase(), fullName, isActive: true },
  });

  console.log("\n\x1b[32m✓ Administrator created\x1b[0m");
  console.log("  email:    ", email);
  console.log("  password: ", password);
  console.log("  user id:  ", userId);
  console.log("\n  \x1b[2mChange this password after your first sign-in.\x1b[0m");

  if (needsConfirmation) {
    console.log(
      "\n\x1b[33m!\x1b[0m Email confirmation is enabled on this project — click the link in\n" +
        "  the confirmation email before signing in, or turn confirmation off in\n" +
        "  Supabase → Authentication → Providers → Email.",
    );
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
