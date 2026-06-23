import { ITEMS_PLANOS, type ItemPlano, type Valor } from "./checklist-schema";
import type { InspeccionInput } from "./validation";

/**
 * Indica si un conjunto de ítems está válido: todos respondidos (SÍ/NO/NA) y todo
 * NO con observación no vacía. Se usa para el gate "Listo para volar" (pre-vuelo)
 * sin depender de zod. No exige observación para NA (es opcional).
 */
export function itemsValidos(
  respuestas: InspeccionInput["respuestas"] | undefined,
  items: Pick<ItemPlano, "id">[],
): boolean {
  if (!respuestas) return false;
  return items.every((it) => {
    const r = respuestas[it.id];
    if (!r?.valor) return false;
    if (r.valor === "NO" && !r.observacion?.trim()) return false;
    return true;
  });
}

export interface FilaResultado extends ItemPlano {
  valor: Valor;
  observacion: string;
}

/** Aplana las respuestas del formulario al orden del formato. */
export function construirFilas(
  respuestas: InspeccionInput["respuestas"],
): FilaResultado[] {
  return ITEMS_PLANOS.map((item) => {
    const r = respuestas[item.id];
    return {
      ...item,
      valor: (r?.valor ?? "NA") as Valor,
      observacion: r?.observacion?.trim() ?? "",
    };
  });
}

/** Reconstruye las filas desde las respuestas guardadas en la BD (para reenviar/exportar). */
export function filasDesdeRespuestas(
  rows: {
    etapa: string;
    seccion: string;
    numero: string;
    item: string;
    valor: Valor;
    observacion: string | null;
  }[],
): FilaResultado[] {
  return rows.map((r) => ({
    id: "",
    etapaId: "", // no se usa al reconstruir desde la BD (el PDF recorre el esquema)
    etapa: r.etapa,
    seccion: r.seccion,
    numero: r.numero,
    texto: r.item,
    valor: r.valor,
    observacion: r.observacion ?? "",
  }));
}

/** Ítems marcados en NO (los que se deben notificar). */
export function itemsEnNo(filas: FilaResultado[]): FilaResultado[] {
  return filas.filter((f) => f.valor === "NO");
}

export interface ResumenInspeccion {
  totalSi: number;
  totalNo: number;
  totalNa: number;
  total: number;
}

export function resumir(filas: FilaResultado[]): ResumenInspeccion {
  return {
    totalSi: filas.filter((f) => f.valor === "SI").length,
    totalNo: filas.filter((f) => f.valor === "NO").length,
    totalNa: filas.filter((f) => f.valor === "NA").length,
    total: filas.length,
  };
}

export type EstadoInspeccion = "COMPLETA_SI" | "CON_OBSERVACIONES";

export function calcularEstado(filas: FilaResultado[]): EstadoInspeccion {
  return filas.some((f) => f.valor === "NO")
    ? "CON_OBSERVACIONES"
    : "COMPLETA_SI";
}

/** Fecha/hora legible en zona horaria de Chile. */
export function formatearFecha(d: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(d);
}

/** Solo fecha (sin hora) legible en zona horaria de Chile. */
export function formatearFechaSolo(d: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "long",
    timeZone: "America/Santiago",
  }).format(d);
}

/** Convierte un input date "YYYY-MM-DD" a Date al mediodía local (evita desfase de zona). */
export function fechaDesdeInput(s: string): Date {
  return new Date(`${s}T12:00:00`);
}

/** Nombre de archivo del PDF: Checklist_<Parque>_<Piloto>_<YYYY-MM-DD_HHmm>.pdf */
export function nombrePdf(
  parque: string,
  piloto: string,
  d: Date,
): string {
  const limpio = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "SIN-DATO";
  const p = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  const stamp = `${get("year")}-${get("month")}-${get("day")}_${get("hour")}${get("minute")}`;
  return `Checklist_${limpio(parque)}_${limpio(piloto)}_${stamp}.pdf`;
}
