import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Aegis Labs — AI Strategy Consulting",
  description: "AI strategy consulting for enterprises and small businesses. We help you navigate AI adoption, build intelligent systems, and create lasting competitive advantage.",
};

const CONTACT_EMAIL = "orion.edge.here@gmail.com";

const services = [
  {
    icon: "◈",
    title: "AI Strategy & Roadmapping",
    description:
      "Define a clear, actionable AI strategy aligned with your business goals. We assess your current capabilities, identify high-impact opportunities, and build a phased roadmap for adoption.",
  },
  {
    icon: "⬡",
    title: "Enterprise AI Integration",
    description:
      "Seamlessly integrate AI into your existing workflows and systems. From LLM-powered tooling to intelligent automation, we handle architecture, implementation, and change management.",
  },
  {
    icon: "◇",
    title: "Small Business AI Enablement",
    description:
      "Practical, affordable AI solutions for small and growing businesses. Cut costs, automate repetitive work, and compete with larger players using the right tools for your scale.",
  },
  {
    icon: "△",
    title: "Team Training & Upskilling",
    description:
      "Equip your team to work effectively alongside AI. We run workshops and training programs tailored to your industry, from prompt engineering to responsible AI practices.",
  },
  {
    icon: "○",
    title: "AI Vendor & Tool Selection",
    description:
      "Navigate the crowded AI vendor landscape with confidence. We evaluate, test, and recommend the right platforms and tools for your specific needs — without the sales pitch.",
  },
  {
    icon: "▷",
    title: "Ongoing Advisory",
    description:
      "Retain expert AI guidance as your needs evolve. Monthly advisory sessions, architecture reviews, and strategic check-ins to keep your AI initiatives on track.",
  },
];

const process = [
  { step: "01", title: "Discovery", desc: "We start with a deep-dive into your business, goals, and current technology landscape." },
  { step: "02", title: "Strategy", desc: "We deliver a clear AI strategy with prioritized initiatives and a realistic roadmap." },
  { step: "03", title: "Execution", desc: "Hands-on support through implementation — architecture, integrations, and team enablement." },
  { step: "04", title: "Iteration", desc: "Ongoing advisory to refine, scale, and adapt as AI capabilities and your needs evolve." },
];

export default async function HomePage() {
  const insightPosts = getAllPosts().slice(0, 12);

  return (
    <>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <div
          className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-6 border border-[var(--border)]"
          style={{ color: "var(--accent)", background: "var(--accent-light)" }}
        >
          AI Strategy Consulting
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-[var(--fg)] leading-tight mb-6 max-w-3xl mx-auto">
          Turn AI from a buzzword into a{" "}
          <span style={{ color: "var(--accent)" }}>business advantage</span>
        </h1>
        <p className="text-lg text-[var(--fg-muted)] max-w-2xl mx-auto mb-10">
          Aegis Labs helps enterprises and small businesses design and execute AI strategies that
          deliver real results — not just experiments.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/pay/"
            className="px-8 py-3 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 inline-block text-center"
            style={{ background: "var(--accent)" }}
          >
            Book a Consultation
          </Link>
          <a
            href="#services"
            className="px-8 py-3 rounded-lg text-sm font-semibold border border-[var(--border)] text-[var(--fg)] hover:border-[var(--accent)] transition-colors"
          >
            See What We Do
          </a>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="border-y border-[var(--border)]" style={{ background: "var(--bg-secondary)" }}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap justify-center gap-8 text-sm text-[var(--fg-muted)]">
          <span>Enterprise & SMB clients</span>
          <span className="text-[var(--border)]">|</span>
          <span>End-to-end AI strategy</span>
          <span className="text-[var(--border)]">|</span>
          <span>Vendor-neutral advice</span>
          <span className="text-[var(--border)]">|</span>
          <span>Practical, not theoretical</span>
        </div>
      </div>

      {/* Services */}
      <section id="services" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--fg)] mb-3">What We Do</h2>
          <p className="text-[var(--fg-muted)] max-w-xl mx-auto">
            From strategy to execution, we cover the full spectrum of AI adoption for your business.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.title}
              className="p-6 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
              style={{ background: "var(--bg-secondary)" }}
            >
              <div className="text-2xl mb-3" style={{ color: "var(--accent)" }}>{s.icon}</div>
              <h3 className="font-semibold text-[var(--fg)] mb-2">{s.title}</h3>
              <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-[var(--border)]" style={{ background: "var(--bg-secondary)" }}>
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--fg)] mb-3">How We Work</h2>
            <p className="text-[var(--fg-muted)] max-w-xl mx-auto">
              A structured, four-phase engagement that delivers clarity and results.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {process.map((p) => (
              <div key={p.step} className="text-center">
                <div
                  className="text-3xl font-bold mb-3 block"
                  style={{ color: "var(--accent)" }}
                >
                  {p.step}
                </div>
                <h3 className="font-semibold text-[var(--fg)] mb-2">{p.title}</h3>
                <p className="text-sm text-[var(--fg-muted)]">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-5xl mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--fg)] mb-6">About Aegis Labs</h2>
          <p className="text-[var(--fg-muted)] leading-relaxed mb-5">
          Aegis Labs is a specialized AI strategy consultancy helping organizations at every scale
          cut through the noise and implement AI that actually works. We bring hands-on experience
          in enterprise AI systems, LLM integration, and technology leadership — not just theory.
          </p>
          <p className="text-[var(--fg-muted)] leading-relaxed">
            Whether you're a Fortune 500 navigating a company-wide AI transformation or a small
            business looking to automate your first workflow, we meet you where you are and build
            a path forward that fits your resources and goals.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--border)]" style={{ background: "var(--accent-light)" }}>
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--fg)] mb-4">
            Ready to get started?
          </h2>
          <p className="text-[var(--fg-muted)] mb-8 max-w-xl mx-auto">
            Book a consultation session and let's explore what AI can do for your business.
            Payments are processed securely via Stripe.
          </p>
          <Link
            href="/pay/"
            className="inline-block px-10 py-3.5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Book a Consultation
          </Link>
          <p className="mt-4 text-xs text-[var(--fg-subtle)]">
            Secure payment via Stripe · Funds go directly to Aegis Labs
          </p>
        </div>
      </section>

      {/* Thought Leadership */}
      <section id="insights" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--fg)] mb-3">Insights & Research</h2>
          <p className="text-[var(--fg-muted)] max-w-xl mx-auto">
            Technical articles on AI systems, LLMs, and enterprise engineering — published here on Aegis Labs.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {insightPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}/`}
              className="group p-5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] transition-colors flex flex-col gap-3"
              style={{ background: "var(--bg-secondary)" }}
            >
              <div className="flex gap-2 flex-wrap">
                {(post.tags ?? []).slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--fg-subtle)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-sm font-semibold text-[var(--fg)] leading-snug group-hover:text-[var(--accent)] transition-colors">
                {post.title}
              </h3>
              <p className="text-xs text-[var(--fg-muted)] leading-relaxed flex-1">
                {post.description}
              </p>
              <span className="text-xs font-medium mt-1" style={{ color: "var(--accent)" }}>
                Read article →
              </span>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/blog/"
            className="inline-block px-6 py-2.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--fg)] hover:border-[var(--accent)] transition-colors"
          >
            View all insights →
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-[var(--fg)] mb-4">Get in touch</h2>
        <p className="text-[var(--fg-muted)] mb-6">
          Questions before you book? Email us anytime—we typically reply within one business day.
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--accent)" }}
        >
          {CONTACT_EMAIL}
        </a>
      </section>
    </>
  );
}
