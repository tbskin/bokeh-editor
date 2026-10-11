import type { Metadata } from "next";
import { Instrument_Serif, Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";

const display = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.trybokeh.com"),
  title: {
    default: "Bokeh: your clips to finished video",
    template: "%s · Bokeh",
  },
  description:
    "Bokeh is your AI co-pilot for short form content. Bring your clips and it edits them into a finished, post-ready reel.",
  applicationName: "Bokeh",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Bokeh",
    url: "https://www.trybokeh.com/",
    title: "Bokeh",
    description: "Your AI co-pilot for short form content.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bokeh",
    description: "Your AI co-pilot for short form content.",
  },
};

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Bokeh",
  legalName: "TourByte Inc.",
  url: "https://www.trybokeh.com",
  logo: "https://www.trybokeh.com/icon.svg",
  description: "Bokeh is an AI co-pilot for short form content.",
};

const appLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Bokeh",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  description: "AI co-pilot that turns raw clips and a voiceover into a finished, captioned vertical reel.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        {children}
        <SiteFooter />
        <JsonLd data={orgLd} />
        <JsonLd data={appLd} />
        {process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === "1" && <Analytics />}
      </body>
    </html>
  );
}
