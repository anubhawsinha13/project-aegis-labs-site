import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  const updated = "March 2026";
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <h1 className="text-2xl font-bold text-[var(--fg)] mb-2">Privacy Policy</h1>
      <p className="text-xs text-[var(--fg-subtle)] mb-10">Last updated: {updated}</p>

      <div style={{ color: "var(--fg-muted)", lineHeight: "1.8" }}>
        <section className="mb-8">
          <h2 className="text-base font-semibold text-[var(--fg)] mb-3">Overview</h2>
          <p>
  Aegis Labs ("we", "us") operates the website at aegis-labs.pro. This page explains what
          data is collected when you visit our site and how it is handled. We take your privacy
          seriously and collect as little data as possible.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-semibold text-[var(--fg)] mb-3">Data We Collect</h2>
          <p>
            This website does not directly collect, store, or process any personal data. There are
            no account registrations, newsletter sign-ups, or contact forms on this site that send
            data to our servers.
          </p>
          <p className="mt-3">
            If you send us an email at{" "}
            <a href="mailto:orion.edge.here@gmail.com" style={{ color: "var(--accent)" }}>
              orion.edge.here@gmail.com
            </a>
            , your message and email address will be received and stored within our email provider.
            We use this information only to respond to your inquiry.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-semibold text-[var(--fg)] mb-3">Payments</h2>
          <p>
            Payments are completed on our{" "}
            <a href="/pay/" style={{ color: "var(--accent)" }}>
              Book a consultation
            </a>{" "}
            page using{" "}
            <a href="https://stripe.com" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
              Stripe
            </a>
            &apos;s embedded checkout. The payment form is served by Stripe while you remain on
            aegis-labs.pro. Aegis Labs never receives, stores, or has access to your full card
            number or payment credentials.
          </p>
          <p className="mt-3">
            A small server-side service (hosted separately from this website) creates a secure
            checkout session with Stripe; it does not store your card data.
          </p>
          <p className="mt-3">
            Stripe's handling of your payment data is governed by{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
              Stripe's Privacy Policy
            </a>
            . Stripe is PCI-DSS Level 1 certified.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-semibold text-[var(--fg)] mb-3">Cookies & Analytics</h2>
          <p>
            This website does not use cookies, tracking pixels, or analytics software. No data about
            your browsing behaviour is collected or shared with third parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-semibold text-[var(--fg)] mb-3">Third-Party Links</h2>
          <p>
            This site may contain links to external websites (e.g., Stripe). We are not responsible
            for the privacy practices of those sites and encourage you to review their privacy policies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-semibold text-[var(--fg)] mb-3">Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Changes will be reflected by updating the
            "last updated" date at the top of this page.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--fg)] mb-3">Contact</h2>
          <p>
            If you have any questions about this privacy policy, please contact us at{" "}
            <a href="mailto:orion.edge.here@gmail.com" style={{ color: "var(--accent)" }}>
              orion.edge.here@gmail.com
            </a>
            .
            .
          </p>
        </section>
      </div>
    </div>
  );
}
