"use client";

import { useEffect } from "react";
import { flushCola } from "@/lib/offline";

// Envía las inspecciones encoladas en cuanto hay conexión, de forma fiable:
// al montar, al volver el evento "online", al recuperar foco/visibilidad y con un
// reintento periódico (porque navigator.onLine y el evento "online" no siempre
// disparan). Así la cola se vacía sola y no se acumulan envíos.
export function OfflineSync() {
  useEffect(() => {
    let cancelado = false;
    const intentar = () => {
      if (!cancelado) flushCola();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") intentar();
    };

    intentar(); // al montar
    window.addEventListener("online", intentar);
    window.addEventListener("focus", intentar);
    document.addEventListener("visibilitychange", onVisible);
    // Reintento periódico: drena la cola poco después de recuperar conexión
    // aunque el evento "online" no se dispare. flushCola no hace nada si la cola
    // está vacía o no hay conexión, así que es barato.
    const id = window.setInterval(intentar, 20000);

    return () => {
      cancelado = true;
      window.removeEventListener("online", intentar);
      window.removeEventListener("focus", intentar);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(id);
    };
  }, []);
  return null;
}
