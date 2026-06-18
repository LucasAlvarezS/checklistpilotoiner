import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Estos paquetes deben quedar fuera del bundle de las funciones serverless
  // para que la generación de PDF (Chromium) funcione en Vercel y en local.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "puppeteer"],
};

export default nextConfig;
