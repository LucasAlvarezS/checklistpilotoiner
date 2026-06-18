import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Estos paquetes deben quedar fuera del bundle de las funciones serverless
  // para que la generación de PDF (Chromium) funcione en Vercel y en local.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "puppeteer"],
  // Incluye el binario de Chromium (carpeta bin/.br) en la función que genera el PDF;
  // sin esto Vercel no copia esos archivos y falla con "input directory ... /bin does not exist".
  outputFileTracingIncludes: {
    "/api/inspecciones": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
};

export default nextConfig;
