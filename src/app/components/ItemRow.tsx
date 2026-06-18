"use client";

import { useFormContext, useWatch } from "react-hook-form";
import type { Item, Valor } from "@/lib/checklist-schema";
import type { InspeccionInput } from "@/lib/validation";

const OPCIONES: { valor: Valor; etiqueta: string }[] = [
  { valor: "SI", etiqueta: "SÍ" },
  { valor: "NO", etiqueta: "NO" },
  { valor: "NA", etiqueta: "N/A" },
];

const estilosBoton: Record<Valor, { on: string; off: string }> = {
  SI: {
    on: "bg-iner-green text-white border-iner-green",
    off: "bg-white text-iner-green border-iner-green/40 hover:bg-iner-green/5",
  },
  NO: {
    on: "bg-iner-amber text-[#3a2a00] border-iner-amber",
    off: "bg-white text-[#9a6200] border-iner-amber/50 hover:bg-iner-amber/10",
  },
  NA: {
    on: "bg-iner-gray text-white border-iner-gray",
    off: "bg-white text-iner-gray border-iner-gray/40 hover:bg-iner-gray/5",
  },
};

export function ItemRow({ item }: { item: Item }) {
  const { control, setValue, register, formState } =
    useFormContext<InspeccionInput>();
  const name = `respuestas.${item.id}` as const;

  const valor = useWatch({ control, name: `${name}.valor` }) as Valor | undefined;

  const errores = formState.errors?.respuestas as
    | Record<string, { valor?: { message?: string }; observacion?: { message?: string } }>
    | undefined;
  const err = errores?.[item.id];

  return (
    <div className="border-b border-black/5 py-3 last:border-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <p className="text-sm leading-snug text-foreground sm:flex-1">{item.texto}</p>
        <div className="flex shrink-0 gap-1.5">
          {OPCIONES.map((op) => {
            const activo = valor === op.valor;
            const s = estilosBoton[op.valor];
            return (
              <button
                key={op.valor}
                type="button"
                onClick={() =>
                  setValue(`${name}.valor`, op.valor, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                className={`min-w-[52px] rounded-md border px-3 py-1.5 text-sm font-semibold transition ${
                  activo ? s.on : s.off
                }`}
                aria-pressed={activo}
              >
                {op.etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      {err?.valor?.message && (
        <p className="mt-1 text-xs font-medium text-red-600">{err.valor.message}</p>
      )}

      {(valor === "NO" || valor === "NA") && (
        <div className="mt-2">
          <textarea
            {...register(`${name}.observacion`)}
            rows={2}
            placeholder={
              valor === "NO"
                ? "Observación (obligatoria): describe el hallazgo…"
                : "Comentario (opcional)…"
            }
            className={`w-full rounded-md border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-iner-green/30 ${
              err?.observacion?.message
                ? "border-red-400 bg-red-50"
                : valor === "NO"
                  ? "border-iner-amber/60 bg-iner-amber-50"
                  : "border-black/15 bg-white"
            }`}
          />
          {err?.observacion?.message && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {err.observacion.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
