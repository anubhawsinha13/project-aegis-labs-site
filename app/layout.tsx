import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: { default: "Aegis Labs", template: "%s · Aegis Labs" },
  description: "AI strategy consulting for enterprises and small businesses.",
  metadataBase: new URL("https://aegis-labs.pro"),
  openGraph: {
    siteName: "Aegis Labs",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
