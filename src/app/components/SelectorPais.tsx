"use client";

import { useState } from "react";
import Link from "next/link";
import { PAISES, PAIS_POR_DEFECTO, type Pais } from "@/lib/checklist-schema";

/**
 * Selector de país de la vista inicial. El piloto elige el país y entra al
 * checklist correspondiente: el país viaja por la URL (`/checklist?pais=...`).
 */
export function SelectorPais() {
  const [pais, setPais] = useState<Pais>(PAIS_POR_DEFECTO);

  return (
    <div>
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-iner-gray">
        País de la inspección
      </p>
      <div
        role="radiogroup"
        aria-label="País"
        className="mb-3 grid grid-cols-2 gap-2"
      >
        {PAISES.map((p) => {
          const activo = p.id === pais;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => setPais(p.id)}
              className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                activo
                  ? "border-iner-green bg-iner-green-50 text-iner-green"
                  : "border-black/15 bg-white text-foreground hover:bg-black/[.03]"
              }`}
            >
              {p.nombre}
            </button>
          );
        })}
      </div>

      <Link
        href={`/checklist?pais=${pais}`}
        className="btn-primary block w-full text-center"
      >
        Entrar como piloto
      </Link>
      <p className="mt-2 text-center text-xs text-iner-gray">
        Completa el checklist de inspección en terreno.
      </p>
    </div>
  );
}
