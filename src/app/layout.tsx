import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../styles/globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F1F3EE",
};

export const metadata: Metadata = {
  title: "Ledger",
  description: "Single-owner Udhaar credit ledger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={plusJakarta.variable}>
      <body className={`${plusJakarta.className} bg-[var(--paper)] text-[var(--ink)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
