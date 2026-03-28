export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-20">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--fg-subtle)]">
        <span>Aegis Labs · {new Date().getFullYear()}</span>
        <div className="flex flex-wrap justify-center gap-5">
          <a href="mailto:orion.edge.here@gmail.com" className="hover:text-[var(--fg)] transition-colors">Contact</a>
          <a href="/privacy/" className="hover:text-[var(--fg)] transition-colors">Privacy</a>
          <a href="/pay/" className="hover:text-[var(--fg)] transition-colors">
            Pay
          </a>
        </div>
      </div>
    </footer>
  );
}
