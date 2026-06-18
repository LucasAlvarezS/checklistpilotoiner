"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CHECKLIST,
  ITEMS_PLANOS,
  TOTAL_ITEMS,
  type Valor,
} from "@/lib/checklist-schema";
import { inspeccionSchema, type InspeccionInput } from "@/lib/validation";
import { normalizarNumero } from "@/lib/inspeccion";
import { ItemRow } from "./ItemRow";
import { IconCheck } from "./icons";

const PASOS = ["Datos", "Checklist", "Enviar"] as const;

function hoyLocal(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function valoresIniciales(): InspeccionInput {
  const respuestas: InspeccionInput["respuestas"] = {};
  for (const it of ITEMS_PLANOS) {
    respuestas[it.id] = { valor: undefined as unknown as Valor, observacion: "" };
  }
  return {
    fechaInspeccion: hoyLocal(),
    revision: "",
    codigo: "",
    pilotoNombre: "",
    parqueNombre: "",
    equipoRPA: "",
    respuestas,
  };
}

export function ChecklistForm() {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [disp, setDisp] = useState<{ usados: string[]; siguiente: string } | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  const metodos = useForm<InspeccionInput>({
    resolver: zodResolver(inspeccionSchema),
    defaultValues: valoresIniciales(),
    mode: "onTouched",
  });

  const { control, handleSubmit, trigger, register, setValue, getValues, formState } =
    metodos;
  const respuestas = useWatch({ control, name: "respuestas" });
  const revision = useWatch({ control, name: "revision" });
  const codigo = useWatch({ control, name: "codigo" });

  // Consulta los códigos disponibles para la revisión ingresada (debounced).
  useEffect(() => {
    const rev = (revision ?? "").trim();
    if (!/^\d{1,3}$/.test(rev)) {
      setDisp(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/disponibilidad?revision=${rev}`, {
          signal: ctrl.signal,
        });
        const json = await res.json();
        setDisp(json);
        // Pre-rellena el código con el siguiente disponible si está vacío.
        if (!(getValues("codigo") ?? "").trim()) {
          setValue("codigo", json.siguiente);
        }
      } catch {
        /* ignore */
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [revision, getValues, setValue]);

  const codigoNorm = normalizarNumero(codigo ?? "");
  const codigoTomado = Boolean(disp && codigoNorm && disp.usados.includes(codigoNorm));

  const { respondidos, sies, noes, nas, itemsNo } = useMemo(() => {
    let sies = 0,
      noes = 0,
      nas = 0;
    const itemsNo: { seccion: string; numero: string; texto: string }[] = [];
    for (const it of ITEMS_PLANOS) {
      const v = respuestas?.[it.id]?.valor;
      if (v === "SI") sies++;
      else if (v === "NA") nas++;
      else if (v === "NO") {
        noes++;
        itemsNo.push({ seccion: it.seccion, numero: it.numero, texto: it.texto });
      }
    }
    return { respondidos: sies + noes + nas, sies, noes, nas, itemsNo };
  }, [respuestas]);

  const irAChecklist = async () => {
    const ok = await trigger([
      "fechaInspeccion",
      "revision",
      "codigo",
      "pilotoNombre",
      "parqueNombre",
      "equipoRPA",
    ]);
    if (!ok) return;

    // Verificación de disponibilidad EN EL MOMENTO (no depende del estado con debounce).
    const rev = normalizarNumero(getValues("revision"));
    const cod = normalizarNumero(getValues("codigo"));
    try {
      const res = await fetch(`/api/disponibilidad?revision=${rev}`);
      const data = await res.json();
      setDisp(data); // refresca el estado → el aviso inline se actualiza
      if (Array.isArray(data.usados) && data.usados.includes(cod)) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return; // código no disponible → no permite comenzar
      }
    } catch {
      /* si la verificación falla, el servidor igual rechaza con 409 al enviar */
    }

    setPaso(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Marca todos los ítems en SÍ y baja hasta el final del checklist (sin salir del paso,
  // para que el piloto pueda seguir editando cualquier ítem si lo necesita).
  const marcarTodoSi = () => {
    for (const it of ITEMS_PLANOS) {
      setValue(`respuestas.${it.id}.valor`, "SI", { shouldDirty: true });
    }
    setTimeout(() => {
      finRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  const onValid = async (data: InspeccionInput) => {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const res = await fetch("/api/inspecciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.status === 409 && json?.codigoNoDisponible) {
        setEnviando(false);
        setPaso(0);
        setErrorEnvio(json.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (!res.ok && res.status !== 207) {
        throw new Error(json?.error ?? "No se pudo enviar la inspección.");
      }
      const params = new URLSearchParams({
        estado: json.estado ?? (noes > 0 ? "CON_OBSERVACIONES" : "COMPLETA_SI"),
        correo: json.correoEnviado ? "1" : "0",
      });
      router.push(`/enviado?${params.toString()}`);
    } catch (e) {
      setErrorEnvio(
        e instanceof Error ? e.message : "Ocurrió un error al enviar.",
      );
      setEnviando(false);
    }
  };

  const onInvalid = () => {
    setPaso(1);
    setErrorEnvio(
      "Hay ítems sin responder o sin observación. Revisa los campos marcados.",
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pct = Math.round((respondidos / TOTAL_ITEMS) * 100);

  return (
    <FormProvider {...metodos}>
      <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 sm:pt-8">
        {/* Encabezado */}
        <header className="mb-5 flex items-center gap-3">
          <Image src="/logo-iner.png" alt="INER" width={120} height={64} priority />
          <div className="ml-auto text-right">
            <h1 className="text-base font-bold text-iner-green sm:text-lg">
              Checklist Inspecciones Externas
            </h1>
            <p className="text-xs text-iner-gray">Inspección RPA · OPE-PR-01</p>
          </div>
        </header>

        {/* Pasos */}
        <ol className="mb-6 flex items-center gap-2 text-xs font-semibold">
          {PASOS.map((p, i) => (
            <li key={p} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  i <= paso ? "bg-iner-green text-white" : "bg-black/10 text-iner-gray"
                }`}
              >
                {i + 1}
              </span>
              <span className={i <= paso ? "text-iner-green" : "text-iner-gray"}>
                {p}
              </span>
              {i < PASOS.length - 1 && (
                <span className="mx-1 h-px flex-1 bg-black/10" />
              )}
            </li>
          ))}
        </ol>

        {errorEnvio && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorEnvio}
          </div>
        )}

        {/* PASO 1 — Datos */}
        {paso === 0 && (
          <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-iner-green">
              Datos de la inspección
            </h2>
            <div className="grid gap-4">
              <Campo
                label="Fecha de la inspección"
                error={formState.errors.fechaInspeccion?.message}
              >
                <input
                  type="date"
                  {...register("fechaInspeccion")}
                  className="campo"
                />
              </Campo>
              <div className="grid grid-cols-2 gap-4">
                <Campo
                  label="Revisión"
                  error={formState.errors.revision?.message}
                >
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    {...register("revision", {
                      onChange: (e) =>
                        setValue(
                          "revision",
                          e.target.value.replace(/\D/g, "").slice(0, 3),
                        ),
                    })}
                    className="campo"
                    placeholder="Ej: 03"
                  />
                </Campo>
                <Campo
                  label="Código OPE-PR-"
                  error={
                    formState.errors.codigo?.message ??
                    (codigoTomado
                      ? `OPE-PR-${codigoNorm} ya usado en la revisión ${normalizarNumero(
                          revision ?? "",
                        )}. Disponible: OPE-PR-${disp?.siguiente}`
                      : undefined)
                  }
                >
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    {...register("codigo", {
                      onChange: (e) =>
                        setValue(
                          "codigo",
                          e.target.value.replace(/\D/g, "").slice(0, 3),
                        ),
                    })}
                    className="campo"
                    placeholder="Ej: 04"
                  />
                </Campo>
              </div>
              {disp && !codigoTomado && (
                <p className="-mt-2 text-xs text-iner-gray">
                  {disp.usados.length > 0
                    ? `Códigos usados en la revisión ${normalizarNumero(revision ?? "")}: ${disp.usados
                        .map((c) => `OPE-PR-${c}`)
                        .join(", ")}. `
                    : ""}
                  Disponible:{" "}
                  <strong className="text-iner-green">OPE-PR-{disp.siguiente}</strong>
                </p>
              )}
              <Campo
                label="Nombre del piloto"
                error={formState.errors.pilotoNombre?.message}
              >
                <input
                  {...register("pilotoNombre")}
                  className="campo"
                  placeholder="Ej: Juan Pérez"
                  autoComplete="name"
                />
              </Campo>
              <Campo
                label="Nombre del parque"
                error={formState.errors.parqueNombre?.message}
              >
                <input
                  {...register("parqueNombre")}
                  className="campo"
                  placeholder="Ej: Parque Eólico Norte"
                />
              </Campo>
              <Campo
                label="Equipo / RPA"
                error={formState.errors.equipoRPA?.message}
              >
                <input
                  {...register("equipoRPA")}
                  className="campo"
                  placeholder="Ej: DJI Matrice 300"
                />
              </Campo>
              <p className="text-xs text-iner-gray">
                Estos datos se incluirán en el formato PDF del checklist.
              </p>
            </div>
            <button
              type="button"
              onClick={irAChecklist}
              disabled={codigoTomado}
              className="btn-primary mt-5 w-full"
            >
              Comenzar checklist
            </button>
            {codigoTomado && (
              <p className="mt-2 text-center text-xs font-medium text-red-600">
                El código OPE-PR-{codigoNorm} no está disponible para la revisión{" "}
                {normalizarNumero(revision ?? "")}. Usa OPE-PR-{disp?.siguiente}.
              </p>
            )}
          </section>
        )}

        {/* PASO 2 — Checklist */}
        {paso === 1 && (
          <section className="space-y-4">
            <div className="rounded-xl border border-iner-green/30 bg-iner-green-50 p-4">
              <button
                type="button"
                onClick={marcarTodoSi}
                className="btn-primary inline-flex w-full items-center justify-center gap-2"
              >
                <IconCheck size={18} />
                Marcar todo en SÍ
              </button>
              <p className="mt-2 text-center text-xs text-iner-gray">
                Marca todos los ítems en SÍ. Puedes seguir revisando y ajustar cualquier
                ítem antes de continuar.
              </p>
            </div>
            {CHECKLIST.map((etapa) => (
              <div
                key={etapa.id}
                className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm"
              >
                <div className="bg-iner-green px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white">
                  {etapa.titulo}
                </div>
                <div className="px-4">
                  {etapa.subsecciones.map((sub) => (
                    <div key={`${etapa.id}-${sub.numero}-${sub.titulo}`} className="py-2">
                      <h3 className="border-b border-black/10 py-2 text-sm font-bold text-iner-green">
                        <span className="mr-1 text-iner-gray">{sub.numero}.</span>
                        {sub.titulo}
                      </h3>
                      {sub.items.map((item) => (
                        <ItemRow key={item.id} item={item} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={finRef} className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaso(0)}
                className="btn-secondary flex-1"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaso(2);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="btn-primary flex-1"
              >
                Ver resumen
              </button>
            </div>
          </section>
        )}

        {/* PASO 3 — Resumen + enviar */}
        {paso === 2 && (
          <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-iner-green">
              Resumen
            </h2>
            <div className="mb-4 grid grid-cols-3 gap-3 text-center">
              <Contador n={sies} label="SÍ" clase="text-iner-green" />
              <Contador n={noes} label="NO" clase="text-iner-amber" />
              <Contador n={nas} label="N/A" clase="text-iner-gray" />
            </div>
            <p className="mb-4 text-sm text-iner-gray">
              Respondidos <strong>{respondidos}</strong> de {TOTAL_ITEMS} ítems.
            </p>

            {noes > 0 ? (
              <div className="mb-4 rounded-lg border border-iner-amber/50 bg-iner-amber-50 p-3">
                <p className="mb-2 text-sm font-bold text-[#9a6200]">
                  Ítems marcados en NO
                </p>
                <ul className="space-y-1 text-sm text-foreground">
                  {itemsNo.map((it, i) => (
                    <li key={i}>
                      <span className="text-iner-gray">{it.numero}. {it.seccion}:</span>{" "}
                      {it.texto}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              respondidos === TOTAL_ITEMS && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-iner-green/30 bg-iner-green-50 p-3 text-sm font-semibold text-iner-green">
                  <IconCheck size={18} />
                  Todas las casillas marcadas, sin observaciones.
                </div>
              )
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="btn-secondary flex-1"
                disabled={enviando}
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleSubmit(onValid, onInvalid)}
                className="btn-primary flex-1"
                disabled={enviando}
              >
                {enviando ? "Enviando…" : "Enviar inspección"}
              </button>
            </div>
          </section>
        )}

        {/* Barra de progreso fija */}
        {paso === 1 && (
          <div className="fixed inset-x-0 bottom-0 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto max-w-3xl">
              <div className="mb-1 flex justify-between text-xs font-medium text-iner-gray">
                <span>Progreso</span>
                <span>
                  {respondidos}/{TOTAL_ITEMS} · {pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full bg-iner-green transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
}

function Campo({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

function Contador({ n, label, clase }: { n: number; label: string; clase: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-iner-gray-100 py-3">
      <div className={`text-2xl font-bold ${clase}`}>{n}</div>
      <div className="text-xs font-semibold text-iner-gray">{label}</div>
    </div>
  );
}
