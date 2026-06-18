import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Checklist Inspecciones Externas · INER",
  description:
    "Digitalización del checklist de inspecciones externas RPA (OPE-PR-01) de INER.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#044245",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
