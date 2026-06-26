"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconAlert,
  IconCheck,
  IconDocument,
  IconDownload,
  IconMail,
  IconTrash,
} from "@/app/components/icons";
import { PAISES, nombrePais, type Pais } from "@/lib/checklist-schema";

interface Item {
  id: string;
  pais: Pais;
  fechaInspeccion: string;
  creadoEn: string;
  pilotoNombre: string;
  parqueNombre: string;
  equipoRPA: string;
  estado: "COMPLETA_SI" | "CON_OBSERVACIONES";
  tienePdf: boolean;
  totalNo: number;
}

interface Filtros {
  parque: string;
  piloto: string;
  pais: string;
  desde: string;
  hasta: string;
}

const FILTROS_VACIOS: Filtros = {
  parque: "",
  piloto: "",
  pais: "",
  desde: "",
  hasta: "",
};

function fmtFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeZone: "America/Santiago",
  }).format(new Date(iso));
}

function toQuery(f: Filtros): string {
  const p = new URLSearchParams();
  if (f.parque) p.set("parque", f.parque);
  if (f.piloto) p.set("piloto", f.piloto);
  if (f.pais) p.set("pais", f.pais);
  if (f.desde) p.set("desde", f.desde);
  if (f.hasta) p.set("hasta", f.hasta);
  return p.toString();
}

export function Historial() {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [items, setItems] = useState<Item[]>([]);
  const [parques, setParques] = useState<string[]>([]);
  const [pilotos, setPilotos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [reenviando, setReenviando] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const cargar = useCallback(async (f: Filtros) => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/inspecciones?${toQuery(f)}`);
      if (!res.ok) throw new Error("No se pudo cargar el historial.");
      const json = await res.json();
      setItems(json.items);
      setParques(json.parques);
      setPilotos(json.pilotos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(FILTROS_VACIOS);
  }, [cargar]);

  const aplicar = (e: React.FormEvent) => {
    e.preventDefault();
    cargar(filtros);
  };

  const limpiar = () => {
    setFiltros(FILTROS_VACIOS);
    cargar(FILTROS_VACIOS);
  };

  const reenviar = async (id: string) => {
    setReenviando(id);
    setAviso(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/inspecciones/${id}/reenviar`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "No se pudo reenviar.");
      setAviso("Correo reenviado correctamente al supervisor.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al reenviar.");
    } finally {
      setReenviando(null);
    }
  };

  const eliminar = async (item: Item) => {
    const ok = window.confirm(
      `¿Eliminar definitivamente la inspección de ${item.parqueNombre} (${item.pilotoNombre})? Se borrará el informe y todas sus respuestas. Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    setEliminando(item.id);
    setAviso(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/inspecciones/${item.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "No se pudo eliminar.");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setAviso("Inspección eliminada correctamente.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar.");
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div>
      {/* Filtros */}
      <form
        onSubmit={aplicar}
        className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6"
      >
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-iner-gray">Parque</span>
          <input
            list="lista-parques"
            value={filtros.parque}
            onChange={(e) => setFiltros({ ...filtros, parque: e.target.value })}
            className="campo"
            placeholder="Todos"
          />
          <datalist id="lista-parques">
            {parques.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-iner-gray">Piloto</span>
          <input
            list="lista-pilotos"
            value={filtros.piloto}
            onChange={(e) => setFiltros({ ...filtros, piloto: e.target.value })}
            className="campo"
            placeholder="Todos"
          />
          <datalist id="lista-pilotos">
            {pilotos.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-iner-gray">País</span>
          <select
            value={filtros.pais}
            onChange={(e) => setFiltros({ ...filtros, pais: e.target.value })}
            className="campo"
          >
            <option value="">Todos</option>
            {PAISES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-iner-gray">Desde</span>
          <input
            type="date"
            value={filtros.desde}
            onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
            className="campo"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-iner-gray">Hasta</span>
          <input
            type="date"
            value={filtros.hasta}
            onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
            className="campo"
          />
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary flex-1 py-2.5">
            Filtrar
          </button>
          <button type="button" onClick={limpiar} className="btn-secondary py-2.5">
            Limpiar
          </button>
        </div>
      </form>

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-iner-gray">
          {cargando ? "Cargando…" : `${items.length} inspección(es)`}
        </p>
        <a
          href={`/api/admin/inspecciones/export?${toQuery(filtros)}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-iner-green/30 px-3 py-1.5 text-xs font-semibold text-iner-green transition hover:bg-iner-green-50"
        >
          <IconDownload size={14} />
          Exportar CSV
        </a>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {aviso && (
        <div className="mb-3 rounded-lg border border-iner-green/30 bg-iner-green-50 px-4 py-2 text-sm text-iner-green">
          {aviso}
        </div>
      )}

      {/* Tabla (desktop) */}
      <div className="hidden overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="bg-iner-gray-100 text-left text-xs uppercase text-iner-gray">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">País</th>
              <th className="px-4 py-3">Piloto</th>
              <th className="px-4 py-3">Parque</th>
              <th className="px-4 py-3">Equipo / RPA</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-black/5">
                <td className="px-4 py-3 whitespace-nowrap">{fmtFecha(i.fechaInspeccion)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{nombrePais(i.pais)}</td>
                <td className="px-4 py-3">{i.pilotoNombre}</td>
                <td className="px-4 py-3">{i.parqueNombre}</td>
                <td className="px-4 py-3">{i.equipoRPA}</td>
                <td className="px-4 py-3">
                  <EstadoBadge estado={i.estado} totalNo={i.totalNo} />
                </td>
                <td className="px-4 py-3">
                  <Acciones
                    item={i}
                    reenviando={reenviando === i.id}
                    eliminando={eliminando === i.id}
                    onReenviar={reenviar}
                    onEliminar={eliminar}
                  />
                </td>
              </tr>
            ))}
            {!cargando && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-iner-gray">
                  No hay inspecciones para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tarjetas (móvil) */}
      <div className="space-y-3 md:hidden">
        {items.map((i) => (
          <div key={i.id} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{i.parqueNombre}</p>
                <p className="text-sm text-iner-gray">{i.pilotoNombre}</p>
              </div>
              <EstadoBadge estado={i.estado} totalNo={i.totalNo} />
            </div>
            <p className="mt-2 text-xs text-iner-gray">
              {fmtFecha(i.fechaInspeccion)} · {nombrePais(i.pais)} · {i.equipoRPA}
            </p>
            <div className="mt-3">
              <Acciones
                item={i}
                reenviando={reenviando === i.id}
                eliminando={eliminando === i.id}
                onReenviar={reenviar}
                onEliminar={eliminar}
              />
            </div>
          </div>
        ))}
        {!cargando && items.length === 0 && (
          <p className="py-8 text-center text-iner-gray">No hay inspecciones.</p>
        )}
      </div>
    </div>
  );
}

function EstadoBadge({
  estado,
  totalNo,
}: {
  estado: Item["estado"];
  totalNo: number;
}) {
  if (estado === "CON_OBSERVACIONES") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-iner-amber-50 px-2.5 py-1 text-xs font-semibold text-[#9a6200]">
        <IconAlert size={13} />
        {totalNo} en NO
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-iner-green-50 px-2.5 py-1 text-xs font-semibold text-iner-green">
      <IconCheck size={13} />
      Conforme
    </span>
  );
}

function Acciones({
  item,
  reenviando,
  eliminando,
  onReenviar,
  onEliminar,
}: {
  item: Item;
  reenviando: boolean;
  eliminando: boolean;
  onReenviar: (id: string) => void;
  onEliminar: (item: Item) => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {item.tienePdf ? (
        <a
          href={`/api/admin/inspecciones/${item.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-iner-green/30 px-3 py-1.5 text-xs font-semibold text-iner-green transition hover:bg-iner-green-50"
        >
          <IconDocument size={14} />
          Ver PDF
        </a>
      ) : (
        <span className="rounded-md border border-black/10 px-3 py-1.5 text-xs text-iner-gray">
          Sin PDF
        </span>
      )}
      <button
        type="button"
        onClick={() => onReenviar(item.id)}
        disabled={reenviando || eliminando || !item.tienePdf}
        className="inline-flex items-center gap-1.5 rounded-md border border-iner-green/30 px-3 py-1.5 text-xs font-semibold text-iner-green transition hover:bg-iner-green-50 disabled:opacity-50"
      >
        <IconMail size={14} />
        {reenviando ? "Enviando…" : "Reenviar"}
      </button>
      <button
        type="button"
        onClick={() => onEliminar(item)}
        disabled={eliminando || reenviando}
        className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        <IconTrash size={14} />
        {eliminando ? "Eliminando…" : "Eliminar"}
      </button>
    </div>
  );
}
