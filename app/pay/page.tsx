import type { Metadata } from "next";
import Link from "next/link";
import EmbeddedStripeCheckout from "@/components/payment/EmbeddedStripeCheckout";

export const metadata: Metadata = {
  title: "Book a consultation",
  description: "Complete your payment securely on aegis-labs.pro with Stripe.",
};

export default function PayPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--fg-muted)] hover:text-[var(--accent)] mb-8 transition-colors"
      >
        ← Back to home
      </Link>

      <h1 className="text-2xl font-bold text-[var(--fg)] mb-2">Book a consultation</h1>
      <p className="text-sm text-[var(--fg-muted)] mb-8">
        Pay securely below. Checkout runs on Stripe inside this page—you stay on{" "}
        <strong className="text-[var(--fg)]">aegis-labs.pro</strong> until you finish or cancel.
      </p>

      <EmbeddedStripeCheckout />
    </div>
  );
}
