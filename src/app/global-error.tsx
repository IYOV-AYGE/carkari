"use client";

// Last line of defence: a crash in the root layout lands here. It replaces the
// whole document, so it carries its own <html>/<body> and cannot rely on any
// styles or providers from the app.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report from the browser. Fire-and-forget: the user is already seeing an
    // error page, a failed report must not make it worse.
    fetch("/api/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        name: error.name,
        digest: error.digest,
        stack: error.stack?.slice(0, 4000),
        url: typeof location !== "undefined" ? location.href : null,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#16202c",
          color: "#e6ecf4",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 460 }}>
          <p style={{ fontSize: 13, letterSpacing: 2, opacity: 0.5, margin: 0 }}>
            CARKARI
          </p>
          <h1 style={{ fontSize: 26, margin: "1rem 0 0.5rem", fontWeight: 700 }}>
            Une erreur est survenue
          </h1>
          <p style={{ opacity: 0.75, lineHeight: 1.6, margin: 0 }}>
            Nos équipes ont été prévenues automatiquement. Réessayez dans un
            instant.
            <br />
            <span style={{ opacity: 0.7 }}>
              Something went wrong. Our team has been notified — please try
              again in a moment.
            </span>
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.75rem",
              background: "#1668c4",
              color: "#fff",
              border: 0,
              borderRadius: 12,
              padding: "0.8rem 1.6rem",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Réessayer / Try again
          </button>
          {error.digest && (
            <p style={{ marginTop: "1.5rem", fontSize: 12, opacity: 0.4 }}>
              Réf. {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
