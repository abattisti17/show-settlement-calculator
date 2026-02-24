import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";
import { buildPageMetadata } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "GigSettle - Show Settlement Calculator for Venues and Promoters",
    description:
      "Create clean settlement packets, export PDFs, and share links instantly. Built for indie venues and promoters who need defensible payout math.",
    path: "/",
  }),
  metadataBase: new URL("https://show-settlement-calculator.vercel.app"),
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
        <footer className="theme-toggle-footer">
          <ThemeToggle />
        </footer>
      </body>
    </html>
  );
}
