"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registro silencioso */
      });
    } else {
      // En desarrollo, desregistra cualquier service worker y limpia su caché
      // para evitar servir chunks/páginas obsoletas (rompía la interacción local).
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      if (typeof caches !== "undefined") {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
    }
  }, []);
  return null;
}
