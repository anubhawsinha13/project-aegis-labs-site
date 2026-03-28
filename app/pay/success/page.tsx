import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thank you",
  description: "Your payment was submitted.",
};

export default function PaySuccessPage() {
  return (
    <div className="max-w-xl mx-auto px-6 py-20 text-center">
      <h1 className="text-2xl font-bold text-[var(--fg)] mb-4">Thank you</h1>
      <p className="text-sm text-[var(--fg-muted)] mb-8">
        Your payment session completed. If anything looks wrong, email us and include the time you paid.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ background: "var(--accent)" }}
      >
        Back to home
      </Link>
    </div>
  );
}
