import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display"
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Hangi Şehrin? — Memleketinin lezzetine sahip çık.",
  description:
    "Türkiye'nin yemekleri hangi şehre ait? Oy ver, tartış, sahip çık."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${display.variable} ${body.variable}`}>
      <body className="font-body bg-paper text-ink antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 w-full">{children}</main>
        <footer className="border-t border-line">
          <div className="max-w-wrap mx-auto px-4 py-6 text-xs text-muted flex flex-wrap gap-x-4 gap-y-1">
            <span>Hangi Şehrin?</span>
            <span>Bu bir eğlence platformudur, resmi coğrafi işaret kaydı değildir.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
