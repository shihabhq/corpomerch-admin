import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "hdmonhqhsaomwskzktdm.supabase.co";

const storefront = process.env.STOREFRONT_URL
  ? new URL(process.env.STOREFRONT_URL)
  : null;
const storefrontHost = storefront?.hostname ?? null;
const storefrontProtocol = (storefront?.protocol.replace(":", "") ?? "https") as
  | "http"
  | "https";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
      // Until SUPABASE_SECRET_KEY is set, the seed writes product images into
      // the storefront's /public folder and records them as externalUrl, so the
      // admin has to be able to render them from that host too.
      ...(storefrontHost
        ? [
            {
              protocol: storefrontProtocol,
              hostname: storefrontHost,
              pathname: "/products/**",
            } as const,
          ]
        : []),
    ],
    qualities: [75],
    // Admin thumbnails are already small WebPs; optimising them again costs
    // function invocations for no visible benefit.
    unoptimized: true,
  },

  // `sharp` is a native module; keep it out of the bundler's hands.
  serverExternalPackages: ["sharp"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          // Nothing in an internal admin panel should ever be indexed.
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
