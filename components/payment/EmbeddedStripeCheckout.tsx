"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const sessionApiUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_API_URL ?? "";

type EmbeddedCheckoutInstance = {
  mount: (location: string | HTMLElement) => void;
  destroy: () => void;
};

export default function EmbeddedStripeCheckout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<EmbeddedCheckoutInstance | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!publishableKey || !sessionApiUrl) {
      setStatus("error");
      setMessage(
        "Payments are not wired for this build. In GitHub: add repository secrets STRIPE_PUBLISHABLE_KEY (pk_…) and STRIPE_CHECKOUT_API_URL (your Cloudflare Worker URL), then redeploy. Deploy the checkout API from stripe-checkout-worker/ — see README.md there."
      );
      return;
    }

    let cancelled = false;
    setStatus("loading");

    (async () => {
      try {
        const stripe = await loadStripe(publishableKey);
        if (!stripe || cancelled) return;

        const checkout = await stripe.initEmbeddedCheckout({
          fetchClientSecret: async () => {
            const res = await fetch(sessionApiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            });
            if (!res.ok) {
              const text = await res.text();
              throw new Error(text || `Checkout API error (${res.status})`);
            }
            const data = (await res.json()) as { clientSecret?: string };
            if (!data.clientSecret) {
              throw new Error("Missing clientSecret from checkout API");
            }
            return data.clientSecret;
          },
        });

        if (cancelled) {
          checkout.destroy();
          return;
        }

        checkoutRef.current = checkout;
        if (containerRef.current) {
          checkout.mount(containerRef.current);
        }
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Could not start checkout.");
      }
    })();

    return () => {
      cancelled = true;
      checkoutRef.current?.destroy();
      checkoutRef.current = null;
    };
  }, []);

  return (
    <div className="w-full">
      {status === "error" && message && (
        <div
          className="mb-6 p-4 rounded-lg border border-[var(--border)] text-sm text-[var(--fg-muted)]"
          style={{ background: "var(--bg-secondary)" }}
        >
          {message}
        </div>
      )}
      {status === "loading" && (
        <p className="text-sm text-[var(--fg-muted)] mb-4">Loading secure checkout…</p>
      )}
      <div
        ref={containerRef}
        className="min-h-[480px] w-full rounded-lg border border-[var(--border)] overflow-hidden"
        style={{ background: "var(--bg-secondary)" }}
        data-testid="stripe-embedded-checkout"
      />
    </div>
  );
}
