import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import { Header } from "@/components/Header";
import { DemoBanner } from "@/components/DemoBanner";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz", "SOFT"] });

export const metadata: Metadata = {
  title: { default: "Freehand", template: "%s | Freehand" },
  description:
    "Walls need art. Artists need walls. Freehand matches emerging artists with local businesses in Greater Boston.",
};

export const viewport: Viewport = {
  themeColor: "#fbf7f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-cream text-ink">
        <Header />
        <DemoBanner />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-6 sm:px-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
