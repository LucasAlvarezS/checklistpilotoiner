// Persistencia local del checklist (autoguardado) y cola de envíos para uso offline.
// Todo vive en localStorage; el envío real va a POST /api/inspecciones.
import type { InspeccionInput } from "./validation";

const KEY_BORRADOR = "iner-checklist-borrador";
const KEY_COLA = "iner-checklist-cola";

const hayStorage = () => typeof window !== "undefined" && !!window.localStorage;

function nuevoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now()) + "-" + Math.random().toString(36).slice(2);
}

// Inspección con clave de idempotencia para el servidor.
type PayloadEnvio = InspeccionInput & { clientId: string };

// ---------- Borrador (progreso en curso) ----------

export interface Borrador {
  values: InspeccionInput;
  paso: number;
  listoParaVolar: boolean;
  // true tras pulsar "Listo para volar" y antes de "Finalizar checklist":
  // muestra la pantalla "Checklist guardado" mientras el piloto opera el vuelo.
  enVuelo: boolean;
  updatedAt: number;
}

export function guardarBorrador(b: Omit<Borrador, "updatedAt">): void {
  if (!hayStorage()) return;
  try {
    const data: Borrador = { ...b, updatedAt: Date.now() };
    window.localStorage.setItem(KEY_BORRADOR, JSON.stringify(data));
  } catch {
    /* almacenamiento lleno o bloqueado: se ignora */
  }
}

export function leerBorrador(): Borrador | null {
  if (!hayStorage()) return null;
  try {
    const raw = window.localStorage.getItem(KEY_BORRADOR);
    return raw ? (JSON.parse(raw) as Borrador) : null;
  } catch {
    return null;
  }
}

export function limpiarBorrador(): void {
  if (!hayStorage()) return;
  try {
    window.localStorage.removeItem(KEY_BORRADOR);
  } catch {
    /* ignore */
  }
}

// ---------- Cola de envíos ----------

interface EnCola {
  id: string;
  payload: PayloadEnvio;
  creadoEn: number;
}

function leerCola(): EnCola[] {
  if (!hayStorage()) return [];
  try {
    const raw = window.localStorage.getItem(KEY_COLA);
    return raw ? (JSON.parse(raw) as EnCola[]) : [];
  } catch {
    return [];
  }
}

function escribirCola(cola: EnCola[]): void {
  if (!hayStorage()) return;
  try {
    window.localStorage.setItem(KEY_COLA, JSON.stringify(cola));
  } catch {
    /* ignore */
  }
}

function encolar(payload: PayloadEnvio): void {
  const cola = leerCola();
  cola.push({ id: nuevoId(), payload, creadoEn: Date.now() });
  escribirCola(cola);
}

/** Cantidad de inspecciones pendientes de envío. */
export function pendientes(): number {
  return leerCola().length;
}

async function postInspeccion(payload: PayloadEnvio): Promise<Response> {
  return fetch("/api/inspecciones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export interface ResultadoEnvio {
  ok: boolean;
  pendiente?: boolean;
  estado?: string;
  correo?: boolean;
}

/**
 * Intenta enviar la inspección. Si no hay conexión o el fetch falla por red,
 * la deja en la cola local y devuelve `{ pendiente: true }`.
 */
export async function enviarInspeccion(
  payload: InspeccionInput,
): Promise<ResultadoEnvio> {
  // clientId estable: si se encola y se reintenta, el servidor lo deduplica.
  const conId: PayloadEnvio = { ...payload, clientId: nuevoId() };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    encolar(conId);
    return { ok: false, pendiente: true };
  }
  try {
    const res = await postInspeccion(conId);
    // 207 = guardada pero correo no enviado; igual cuenta como enviada.
    if (!res.ok && res.status !== 207) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json().catch(() => ({}));
    return {
      ok: true,
      estado: json.estado,
      correo: json.correoEnviado !== false,
    };
  } catch {
    // Fallo de red (puede que el servidor sí la haya recibido): se encola con el
    // mismo clientId, así el reintento no genera un duplicado.
    encolar(conId);
    return { ok: false, pendiente: true };
  }
}

let flushEnCurso = false;

/** Reintenta enviar las inspecciones encoladas. Quita de la cola las exitosas. */
export async function flushCola(): Promise<void> {
  if (flushEnCurso) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  if (leerCola().length === 0) return;
  flushEnCurso = true;
  try {
    let cola = leerCola();
    for (const item of [...cola]) {
      try {
        const res = await postInspeccion(item.payload);
        if (res.ok || res.status === 207) {
          cola = leerCola().filter((c) => c.id !== item.id);
          escribirCola(cola);
        } else if (res.status >= 400 && res.status < 500 && res.status !== 207) {
          // Datos inválidos (no se arregla reintentando): se descarta de la cola.
          cola = leerCola().filter((c) => c.id !== item.id);
          escribirCola(cola);
        }
        // 5xx: se deja en la cola para el próximo intento.
      } catch {
        // Sigue sin conexión: detener y reintentar más tarde.
        break;
      }
    }
  } finally {
    flushEnCurso = false;
  }
}
