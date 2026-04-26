"use client";

// Root-level error boundary. Must NOT use Chakra (the provider may have failed).
// Renders its own <html> + <body>.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-GB">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          background: "#09090B",
          color: "#FAFAF9",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 480, padding: "0 24px" }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "#D4AF37",
              marginBottom: 16,
              fontWeight: 500,
            }}
          >
            Critical Error
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: "0 0 16px",
            }}
          >
            We&apos;re unable to render this page.
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "#A1A1AA",
              lineHeight: 1.7,
              margin: "0 0 32px",
            }}
          >
            Our team has been notified. Please try refreshing — or call us on
            <br />
            <a href="tel:+441202129746" style={{ color: "#D4AF37", textDecoration: "none" }}>
              01202 129 746
            </a>{" "}
            if you need help with an active booking.
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 11,
                color: "#71717A",
                marginBottom: 24,
              }}
            >
              ref: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              background: "#D4AF37",
              color: "#09090B",
              border: "none",
              borderRadius: 9999,
              height: 48,
              padding: "0 32px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 0 0 1px rgba(212,175,55,0.4), 0 8px 32px rgba(212,175,55,0.25)",
            }}
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
