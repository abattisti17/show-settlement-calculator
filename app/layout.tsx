import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Show Settlement Calculator",
  description: "Quickly calculate artist and venue payouts for a live show. For small venues and indie promoters who are tired of broken spreadsheets. Plug in your show numbers and get a clean, consistent settlement breakdown.",
  openGraph: {
    title: "Show Settlement Calculator",
    description: "Free · No login · Just math",
    url: "https://show-settlement-calculator.vercel.app",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Show Settlement Calculator",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
