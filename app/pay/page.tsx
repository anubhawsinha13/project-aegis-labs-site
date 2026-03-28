import type { Metadata } from "next";
import Link from "next/link";
import EmbeddedStripeCheckout from "@/components/payment/EmbeddedStripeCheckout";

const CONTACT_EMAIL = "orion.edge.here@gmail.com";

export const metadata: Metadata = {
  title: "Book a consultation",
  description:
    "Book a consultation, subscribe to the Aegis Labs newsletter, and explore articles—all on aegis-labs.pro.",
};

export default function PayPage() {
  const newsletterHref = `mailto:${CONTACT_EMAIL}?${new URLSearchParams({
    subject: "Newsletter subscription — Aegis Labs",
    body: "Please add me to the Aegis Labs newsletter.\n\nPreferred email (if different from sender):\n\n",
  })}`;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--fg-muted)] hover:text-[var(--accent)] mb-8 transition-colors"
      >
        ← Back to home
      </a>

      <h1 className="text-2xl font-bold text-[var(--fg)] mb-2">Book a consultation</h1>
      <p className="text-sm text-[var(--fg-muted)] mb-6">
        Pay securely below. Checkout runs on Stripe inside this page—you stay on{" "}
        <strong className="text-[var(--fg)]">aegis-labs.pro</strong> until you finish or cancel.
      </p>

      <div
        className="mb-8 p-5 rounded-xl border border-[var(--border)] text-sm"
        style={{ background: "var(--bg-secondary)" }}
      >
        <p className="font-semibold text-[var(--fg)] mb-3">Also on this page</p>
        <ul className="space-y-3 text-[var(--fg-muted)]">
          <li className="flex gap-2">
            <span className="text-[var(--accent)] shrink-0">→</span>
            <span>
              <strong className="text-[var(--fg)]">Newsletter</strong> — get updates on new articles
              and consulting topics.{" "}
              <a href={newsletterHref} className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
                Subscribe by email
              </a>
              ; we’ll add you manually from your message.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--accent)] shrink-0">→</span>
            <span>
              <strong className="text-[var(--fg)]">Consultation prep &amp; articles</strong> — browse
              our Insights library for pieces you can use as background before or after a session.{" "}
              <Link href="/blog/" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
                Open all articles
              </Link>
              .
            </span>
          </li>
        </ul>
      </div>

      <EmbeddedStripeCheckout />
    </div>
  );
}
