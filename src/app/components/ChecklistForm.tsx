"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ETAPAS_PREVUELO_LISTA,
  ETAPAS_POSTVUELO_LISTA,
  ITEMS_PLANOS,
  ITEMS_PREVUELO,
  ITEMS_POSTVUELO,
  type Etapa,
  type ItemPlano,
  type Valor,
} from "@/lib/checklist-schema";
import { inspeccionSchema, type InspeccionInput } from "@/lib/validation";
import { itemsValidos } from "@/lib/inspeccion";
import {
  enviarInspeccion,
  guardarBorrador,
  leerBorrador,
  limpiarBorrador,
} from "@/lib/offline";
import { ItemRow } from "./ItemRow";
import { IconCheck } from "./icons";

const PASOS = ["Datos", "Pre-vuelo", "Post-vuelo", "Enviar"] as const;

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
    pilotoNombre: "",
    parqueNombre: "",
    equipoRPA: "",
    respuestas,
  };
}

interface Conteo {
  respondidos: number;
  sies: number;
  noes: number;
  nas: number;
  itemsNo: { seccion: string; numero: string; texto: string }[];
  total: number;
}

function contar(
  respuestas: InspeccionInput["respuestas"] | undefined,
  items: ItemPlano[],
): Conteo {
  let sies = 0,
    noes = 0,
    nas = 0;
  const itemsNo: Conteo["itemsNo"] = [];
  for (const it of items) {
    const v = respuestas?.[it.id]?.valor;
    if (v === "SI") sies++;
    else if (v === "NA") nas++;
    else if (v === "NO") {
      noes++;
      itemsNo.push({ seccion: it.seccion, numero: it.numero, texto: it.texto });
    }
  }
  return { respondidos: sies + noes + nas, sies, noes, nas, itemsNo, total: items.length };
}

export function ChecklistForm() {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [listoParaVolar, setListoParaVolar] = useState(false);
  const [enVuelo, setEnVuelo] = useState(false);
  const [pendiente, setPendiente] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  const metodos = useForm<InspeccionInput>({
    resolver: zodResolver(inspeccionSchema),
    defaultValues: valoresIniciales(),
    mode: "onTouched",
  });

  const { control, handleSubmit, trigger, register, setValue, getValues, reset, formState } =
    metodos;

  // Autoguardado: solo después de restaurar el borrador, para no pisarlo.
  const restaurado = useRef(false);
  useEffect(() => {
    const b = leerBorrador();
    if (b?.values) {
      reset(b.values);
      setPaso(typeof b.paso === "number" ? b.paso : 0);
      setListoParaVolar(Boolean(b.listoParaVolar));
      setEnVuelo(Boolean(b.enVuelo));
    }
    restaurado.current = true;
  }, [reset]);

  const valores = useWatch({ control });
  const respuestas = valores?.respuestas as InspeccionInput["respuestas"] | undefined;

  useEffect(() => {
    if (!restaurado.current) return;
    const t = setTimeout(() => {
      guardarBorrador({ values: getValues(), paso, listoParaVolar, enVuelo });
    }, 500);
    return () => clearTimeout(t);
  }, [valores, paso, listoParaVolar, enVuelo, getValues]);

  const resumenPre = useMemo(() => contar(respuestas, ITEMS_PREVUELO), [respuestas]);
  const resumenPost = useMemo(() => contar(respuestas, ITEMS_POSTVUELO), [respuestas]);
  const resumenTotal = useMemo(() => contar(respuestas, ITEMS_PLANOS), [respuestas]);

  const preVueloOk = useMemo(
    () => itemsValidos(respuestas, ITEMS_PREVUELO),
    [respuestas],
  );

  const irAPrevuelo = async () => {
    const ok = await trigger([
      "fechaInspeccion",
      "pilotoNombre",
      "parqueNombre",
      "equipoRPA",
    ]);
    if (!ok) return;
    setPaso(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmarListoParaVolar = () => {
    if (!preVueloOk) return;
    setListoParaVolar(true);
    setEnVuelo(true); // muestra "Checklist guardado" hasta pulsar "Finalizar checklist"
    setPaso(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finalizarChecklist = () => {
    setEnVuelo(false); // continúa con el checklist post-vuelo (paso 2)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Marca en SÍ los ítems de una fase (sin salir del paso, para poder ajustar).
  const marcarTodoSi = (items: ItemPlano[]) => {
    for (const it of items) {
      setValue(`respuestas.${it.id}.valor`, "SI", { shouldDirty: true });
    }
    setTimeout(() => {
      finRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  const onValid = async (data: InspeccionInput) => {
    setEnviando(true);
    setErrorEnvio(null);
    const r = await enviarInspeccion(data);
    if (r.pendiente) {
      // Sin conexión: se encoló. Mostramos confirmación inline (sin navegar a una
      // ruta del servidor, que no cargaría offline). Se enviará al recuperar la red.
      limpiarBorrador();
      setPendiente(true);
      setEnviando(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (r.ok) {
      limpiarBorrador();
      const params = new URLSearchParams({
        estado: r.estado ?? (resumenTotal.noes > 0 ? "CON_OBSERVACIONES" : "COMPLETA_SI"),
        correo: r.correo === false ? "0" : "1",
      });
      router.push(`/enviado?${params.toString()}`);
      return;
    }
    setErrorEnvio("No se pudo enviar la inspección. Inténtalo nuevamente.");
    setEnviando(false);
  };

  const nuevaInspeccion = () => {
    reset(valoresIniciales());
    setListoParaVolar(false);
    setEnVuelo(false);
    setPendiente(false);
    setPaso(0);
    limpiarBorrador();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onInvalid = () => {
    // Llevar al piloto a la fase donde están los ítems pendientes.
    const preOk = itemsValidos(getValues("respuestas"), ITEMS_PREVUELO);
    setPaso(preOk ? 2 : 1);
    setErrorEnvio(
      "Hay ítems sin responder o sin observación. Revisa los campos marcados.",
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Conteo de la fase actual para la barra de progreso.
  const fase = paso === 1 ? resumenPre : resumenPost;
  const pct = fase.total ? Math.round((fase.respondidos / fase.total) * 100) : 0;

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

        {pendiente && (
          <section className="rounded-xl border border-iner-amber/40 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-iner-amber-50 text-iner-amber">
              <IconCheck size={32} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-iner-green">
              Inspección guardada
            </h2>
            <p className="mt-2 text-sm text-iner-gray">
              No hay conexión en este momento. La inspección quedó guardada en este
              dispositivo y se enviará automáticamente cuando vuelva el internet.
            </p>
            <div className="mt-4 rounded-lg bg-iner-amber-50 px-4 py-2 text-sm font-medium text-[#9a6200]">
              Pendiente de envío. Mantén la app instalada y ábrela cuando tengas señal.
            </div>
            <button
              type="button"
              onClick={nuevaInspeccion}
              className="btn-primary mt-6 w-full"
            >
              Nueva inspección
            </button>
          </section>
        )}

        {/* Pantalla intermedia: pre-vuelo guardado, esperando la operación de vuelo */}
        {!pendiente && enVuelo && (
          <section className="rounded-xl border border-iner-green/30 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-iner-green-50 text-iner-green">
              <IconCheck size={32} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-iner-green">
              Checklist guardado
            </h2>
            <p className="mt-2 text-sm text-iner-gray">
              La inspección pre-vuelo quedó guardada en este dispositivo. Realiza la
              operación de vuelo con tranquilidad: esta pantalla se mantiene aunque
              cierres la app o no tengas conexión.
            </p>
            <div className="mt-4 rounded-lg bg-iner-green-50 px-4 py-2 text-sm font-medium text-iner-green">
              Aeronave lista para volar. Cuando termines la operación, continúa con el
              checklist post-vuelo.
            </div>
            <button
              type="button"
              onClick={finalizarChecklist}
              className="btn-primary mt-6 w-full"
            >
              Finalizar checklist
            </button>
          </section>
        )}

        {!pendiente && !enVuelo && (
        <>
        {/* Pasos */}
        <ol className="mb-6 flex items-center gap-2 text-xs font-semibold">
          {PASOS.map((p, i) => (
            <li key={p} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
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
              onClick={irAPrevuelo}
              className="btn-primary mt-5 w-full"
            >
              Comenzar checklist
            </button>
          </section>
        )}

        {/* PASO 2 — Pre-vuelo (hasta el punto de volar) */}
        {paso === 1 && (
          <section className="space-y-4">
            <div className="rounded-xl border border-iner-green/30 bg-iner-green-50 p-4">
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-iner-green">
                Inspección pre-vuelo
              </p>
              <button
                type="button"
                onClick={() => marcarTodoSi(ITEMS_PREVUELO)}
                className="btn-primary inline-flex w-full items-center justify-center gap-2"
              >
                <IconCheck size={18} />
                Marcar todo en SÍ
              </button>
              <p className="mt-2 text-center text-xs text-iner-gray">
                Completa las etapas previas al vuelo. Cuando todo esté en SÍ/N/A (o NO
                con observación) podrás confirmar <strong>Listo para volar</strong>.
              </p>
            </div>

            <ListaEtapas etapas={ETAPAS_PREVUELO_LISTA} />

            <div ref={finRef} className="space-y-3">
              {preVueloOk ? (
                <div className="flex items-center gap-2 rounded-lg border border-iner-green/30 bg-iner-green-50 p-3 text-sm font-semibold text-iner-green">
                  <IconCheck size={18} />
                  Pre-vuelo completo. La aeronave está lista para volar.
                </div>
              ) : (
                <p className="text-center text-xs text-iner-gray">
                  Responde los {resumenPre.total} ítems pre-vuelo (los NO requieren
                  observación) para habilitar el botón.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaso(0)}
                  className="btn-secondary flex-1"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={confirmarListoParaVolar}
                  disabled={!preVueloOk}
                  className="btn-primary flex-1"
                >
                  Listo para volar
                </button>
              </div>
            </div>
          </section>
        )}

        {/* PASO 3 — Post-vuelo */}
        {paso === 2 && (
          <section className="space-y-4">
            {listoParaVolar && (
              <div className="flex items-center gap-2 rounded-lg border border-iner-green/30 bg-iner-green-50 p-3 text-sm font-semibold text-iner-green">
                <IconCheck size={18} />
                Listo para volar confirmado. Completa el checklist tras la operación.
              </div>
            )}
            <div className="rounded-xl border border-iner-green/30 bg-iner-green-50 p-4">
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-iner-green">
                Inspección post-vuelo
              </p>
              <button
                type="button"
                onClick={() => marcarTodoSi(ITEMS_POSTVUELO)}
                className="btn-primary inline-flex w-full items-center justify-center gap-2"
              >
                <IconCheck size={18} />
                Marcar todo en SÍ
              </button>
              <p className="mt-2 text-center text-xs text-iner-gray">
                Completa las etapas de vuelo, aterrizaje y almacenaje.
              </p>
            </div>

            <ListaEtapas etapas={ETAPAS_POSTVUELO_LISTA} />

            <div ref={finRef} className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="btn-secondary flex-1"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaso(3);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="btn-primary flex-1"
              >
                Ver resumen
              </button>
            </div>
          </section>
        )}

        {/* PASO 4 — Resumen + enviar */}
        {paso === 3 && (
          <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-iner-green">
              Resumen
            </h2>
            <div className="mb-4 grid grid-cols-3 gap-3 text-center">
              <Contador n={resumenTotal.sies} label="SÍ" clase="text-iner-green" />
              <Contador n={resumenTotal.noes} label="NO" clase="text-iner-amber" />
              <Contador n={resumenTotal.nas} label="N/A" clase="text-iner-gray" />
            </div>
            <p className="mb-4 text-sm text-iner-gray">
              Respondidos <strong>{resumenTotal.respondidos}</strong> de{" "}
              {resumenTotal.total} ítems.
            </p>

            {resumenTotal.noes > 0 ? (
              <div className="mb-4 rounded-lg border border-iner-amber/50 bg-iner-amber-50 p-3">
                <p className="mb-2 text-sm font-bold text-[#9a6200]">
                  Ítems marcados en NO
                </p>
                <ul className="space-y-1 text-sm text-foreground">
                  {resumenTotal.itemsNo.map((it, i) => (
                    <li key={i}>
                      <span className="text-iner-gray">{it.numero}. {it.seccion}:</span>{" "}
                      {it.texto}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              resumenTotal.respondidos === resumenTotal.total && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-iner-green/30 bg-iner-green-50 p-3 text-sm font-semibold text-iner-green">
                  <IconCheck size={18} />
                  Todas las casillas marcadas, sin observaciones.
                </div>
              )
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaso(2)}
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

        {/* Barra de progreso fija (durante las fases de checklist) */}
        {(paso === 1 || paso === 2) && (
          <div className="fixed inset-x-0 bottom-0 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto max-w-3xl">
              <div className="mb-1 flex justify-between text-xs font-medium text-iner-gray">
                <span>{paso === 1 ? "Pre-vuelo" : "Post-vuelo"}</span>
                <span>
                  {fase.respondidos}/{fase.total} · {pct}%
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
        </>
        )}
      </div>
    </FormProvider>
  );
}

function ListaEtapas({ etapas }: { etapas: Etapa[] }) {
  return (
    <>
      {etapas.map((etapa) => (
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
    </>
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
