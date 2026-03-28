"use client";

import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-[var(--border)] sticky top-0 z-50" style={{ background: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-[var(--fg)] no-underline">
          <span className="text-lg font-bold tracking-tight">Aegis Labs</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#services" className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Services</a>
          <a href="#about" className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">About</a>
          <a href="/blog/" className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Insights</a>
          <a href="#contact" className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Contact</a>
          <a
            href="/pay/"
            className="px-4 py-1.5 rounded-md text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Get Started
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[var(--fg-muted)] hover:text-[var(--fg)]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border)] px-6 py-4 flex flex-col gap-4 text-sm" style={{ background: "var(--bg)" }}>
          <a href="#services" className="text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => setMenuOpen(false)}>Services</a>
          <a href="#about" className="text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => setMenuOpen(false)}>About</a>
          <a href="/blog/" className="text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => setMenuOpen(false)}>Insights</a>
          <a href="#contact" className="text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => setMenuOpen(false)}>Contact</a>
          <a
            href="/pay/"
            className="px-4 py-2 rounded-md text-white text-sm font-medium text-center transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
            onClick={() => setMenuOpen(false)}
          >
            Get Started
          </a>
        </div>
      )}
    </header>
  );
}
