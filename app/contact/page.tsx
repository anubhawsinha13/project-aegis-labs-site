import type { Metadata } from "next";
import Link from "next/link";

const CONTACT_EMAIL = "orion.edge.here@gmail.com";

const mailtoHref = `mailto:${CONTACT_EMAIL}?${new URLSearchParams({
  subject: "Inquiry — Aegis Labs",
  body: "Hi Aegis Labs,\n\n",
}).toString()}`;

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Aegis Labs — AI strategy consulting. We typically reply within one business day.",
};

export default function ContactPage() {
  return (
    <div className="max-w-xl mx-auto px-6 py-16 md:py-24">
      <h1 className="text-3xl font-bold text-[var(--fg)] tracking-tight">Contact us</h1>
      <p className="mt-4 text-[var(--fg-muted)] leading-relaxed">
        Questions before you book, or want to discuss a project? Email us anytime—we typically reply
        within one business day.
      </p>

      <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)] mb-2">
          Email
        </p>
        <a
          href={mailtoHref}
          className="text-base font-medium hover:underline break-all"
          style={{ color: "var(--accent)" }}
        >
          {CONTACT_EMAIL}
        </a>
        <p className="mt-4 text-sm text-[var(--fg-muted)]">
          Opens your mail app with a pre-filled subject line—you can edit before sending.
        </p>
      </div>

      <p className="mt-10 text-sm text-[var(--fg-muted)]">
        Prefer context first?{" "}
        <Link href="/" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
          Services &amp; about
        </Link>
        {" · "}
        <Link href="/blog/" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
          Insights
        </Link>
      </p>
    </div>
  );
}
