import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "./components/PwaRegister";

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Checklist Inspecciones Externas · INER",
  description:
    "Digitalización del checklist de inspecciones externas RPA (OPE-PR-01) de INER.",
  applicationName: "Checklist INER",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Checklist INER",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
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
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
