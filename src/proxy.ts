import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts` and the exported function to
 * `proxy`. Runtime is Node.js and is not configurable.
 *
 * This does two things and nothing more:
 *   1. refreshes the Supabase session cookie so it doesn't expire mid-session
 *   2. redirects signed-out visitors to /login
 *
 * It is NOT the authorisation boundary. Membership of `admin_users` is checked
 * by requireAdmin() in every page and server action — see src/lib/auth.ts.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Do not remove: this call is what refreshes an expiring token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/login";

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // `denied=1` means requireAdmin() just rejected this session — it has no
  // active admin_users row. Bouncing it back to `/` here would restart the
  // loop, so let the login page take over: it signs the session out and says
  // why. This is the one case where a signed-in visitor may stay on /login.
  const denied = request.nextUrl.searchParams.get("denied") === "1";

  if (user && isLogin && !denied) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
