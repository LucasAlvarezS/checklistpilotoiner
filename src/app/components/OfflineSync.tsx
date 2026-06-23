"use client";

import { useEffect } from "react";
import { flushCola } from "@/lib/offline";

// Envía las inspecciones encoladas cuando la app está abierta y hay conexión:
// al montar y cada vez que el navegador recupera la red (evento "online").
export function OfflineSync() {
  useEffect(() => {
    flushCola();
    const onOnline = () => flushCola();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);
  return null;
}
