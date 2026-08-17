"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: catches failures in the root layout itself, which the
 * per-route error.tsx cannot reach.
 *
 * It REPLACES the root layout, so it has to render its own <html> and <body>,
 * and it cannot rely on the app's fonts or Tailwind theme being applied —
 * hence the inline styles. Keep it dependency-free for the same reason.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin:global]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafafa",
          color: "#3f3f46",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "26rem",
            padding: "2rem",
            textAlign: "center",
            background: "#fff",
            border: "1px solid #e4e4e7",
            borderRadius: "0.75rem",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.125rem", color: "#0a0a0a" }}>
            The admin panel failed to start
          </h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", lineHeight: 1.6 }}>
            This is a fault in the application shell rather than in any one
            screen. Reloading usually clears it; if it persists, check the server
            logs.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              height: "2.25rem",
              padding: "0 1rem",
              background: "#d12429",
              color: "#fff",
              border: 0,
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          {error.digest ? (
            <p
              style={{
                marginTop: "1.25rem",
                fontSize: "0.6875rem",
                color: "#a1a1aa",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
              }}
            >
              error {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
