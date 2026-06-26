/**
 * Fuente única de verdad del formato OPE-PR-01 "Checklist Inspecciones Externas".
 * Extraído tal cual de los documentos originales (no se agregan ni quitan ítems).
 * Estructura: País -> Etapa -> Subsección (N° + título) -> ítems.
 *
 * Los ids se generan de forma determinística según la posición, de modo que
 * sirven como nombre estable de cada campo del formulario. Cada inspección es de
 * un solo país, por lo que aunque los ids coincidan entre países no hay colisión
 * dentro de un mismo envío.
 */

export type Valor = "SI" | "NO" | "NA";

/** Países habilitados. El piloto elige uno en la vista inicial. */
export type Pais = "CHILE" | "ARGENTINA";

export const PAISES: { id: Pais; nombre: string }[] = [
  { id: "CHILE", nombre: "Chile" },
  { id: "ARGENTINA", nombre: "Argentina" },
];

export const PAIS_POR_DEFECTO: Pais = "ARGENTINA";

export function esPaisValido(x: unknown): x is Pais {
  return x === "CHILE" || x === "ARGENTINA";
}

/** Nombre legible del país (para UI/PDF). */
export function nombrePais(pais: Pais): string {
  return PAISES.find((p) => p.id === pais)?.nombre ?? pais;
}

export interface Item {
  id: string;
  texto: string;
  /** Ítem crítico (regulatorio): se resalta en rojo en el informe, como en el original. */
  critico?: boolean;
}

export interface Subseccion {
  numero: string;
  titulo: string;
  items: Item[];
}

export interface Etapa {
  id: string;
  titulo: string;
  subsecciones: Subseccion[];
}

type RawSub = { numero: string; titulo: string; items: string[] };
type RawEtapa = { id: string; titulo: string; subsecciones: RawSub[] };

// ─────────────────────────────────────────────────────────────────────────────
// ARGENTINA — checklist vigente (autoridad ANAC; incluye TORNILLOS y MOVIMIENTO AXIAL).
// ─────────────────────────────────────────────────────────────────────────────
const RAW_ARGENTINA: RawEtapa[] = [
  {
    id: "preparacion",
    titulo: "PREPARACIÓN DEL VUELO",
    subsecciones: [
      {
        numero: "1",
        titulo: "PERMISOS Y PLANES DE VUELO",
        items: [
          "Orden de vuelo emanada por Gerente Operaciones",
          "Credencial de los Operadores RPAs",
          "Tarjeta de Registro del RPA",
          "Res. Exc. Seguro Aprobado por la JAC",
          "Autorización de Operación otorgada por la ANAC",
          "Autorización Entidad Estatal",
        ],
      },
      {
        numero: "2",
        titulo: "CONDICIONES METEOROLÓGICAS",
        items: [
          "METAR aeródromo más cercano, verificar NOTAM",
          "Sin presencia de neblina, lluvia o condiciones deficientes",
          "Velocidad del viento y Temperatura ambiente adecuada",
        ],
      },
    ],
  },
  {
    id: "prevuelo",
    titulo: "PREVUELO",
    subsecciones: [
      {
        numero: "1",
        titulo: "COMPROBACIÓN VISUAL DEL FUSELAJE",
        items: [
          "Motores girando Manual y correctamente",
          "Baterías bien sujetas y con carga suficiente",
          "Conexiones estables y Cables en buen estado",
          "Antenas en correcta posición",
        ],
      },
      {
        numero: "2",
        titulo: "HÉLICES",
        items: ["Sin grietas o desgaste aparente", "Montaje correcto y ajustado"],
      },
      {
        numero: "3",
        titulo: "ESTACIÓN TERRESTRE DE CARGA",
        items: [
          "Generador conectado correctamente (si no tiene, elimina)",
          "Alargador(es) en buen estado",
          "Cargadores conectados y disponibles",
          "Sin señales de sobrecalentamiento en los equipos",
        ],
      },
      {
        numero: "4",
        titulo: "RADIO CONTROL",
        items: [
          "Antenas en correcta posición",
          "Palancas en buen estado y movimiento libre, sin trabas",
          "Ajuste modo de vuelo",
          "Baterías bien sujetas y con carga suficiente",
          "Pantalla en correcta posición y asegurada",
        ],
      },
      {
        numero: "5",
        titulo: "TARJETA SD",
        items: ["Mantiene espacio suficiente disponible", "Correctamente instalada"],
      },
      {
        numero: "6",
        titulo: "ÁREA DE DESPEGUE Y ATERRIZAJE",
        items: [
          "Área delimitada de seguridad con conos",
          "Libre de obstáculos, horizontal y verticalmente",
          "Señalización preventiva del área de operación",
        ],
      },
      {
        numero: "7",
        titulo: "PERSONAL EN TIERRA",
        items: [
          "Uso de equipos y elementos de seguridad",
          "Condiciones físicas y mentales óptimas de operadores",
        ],
      },
      {
        numero: "8",
        titulo: "TORNILLOS",
        items: [
          "Inspeccionar visualmente la tornillería, verificando que todos los tornillos estén presentes y con su marca de apriete.",
        ],
      },
      {
        numero: "9",
        titulo: "MOVIMIENTO AXIAL",
        items: [
          "Revisar manualmente el motor, confirmando que no presente juego axial perceptible.",
        ],
      },
      {
        numero: "10",
        titulo: "CÁMARA Y ACCESORIOS",
        items: [
          "Lente de cámara sin grietas o manchas aparentes",
          "Fijación adecuada de cámara (chequeo de Gimbal)",
        ],
      },
      {
        numero: "11",
        titulo: "CONDICIONES OPERACIONALES",
        items: [
          "Todos los equipos encendidos correctamente",
          "Se estableció la condición RTH (chequeo RTH de retorno)",
          "Se estableció altura máxima de vuelo",
          "Satélites disponibles mayor o igual a 10",
          "Señal óptima de control y RPA",
          "Sensores de obstáculo libre",
          "Ninguna señal de emergencia en pantalla",
          "Calibración correcta de Gimbal",
          "Calibración de control, IMU, brújula y cualquiera otra",
          "Paracaídas (Si corresponde)",
        ],
      },
    ],
  },
  {
    id: "despegue",
    titulo: "DESPEGUE",
    subsecciones: [
      {
        numero: "1",
        titulo: "VUELO ESTACIONARIO (a 2 mts)",
        items: [
          "Todos los elementos se visualizan fijos y ajustados",
          "Vuelo estable del RPA",
          "Verifique Comandos de Vuelo antes de salir",
          "Despegue contra el viento",
        ],
      },
    ],
  },
  {
    id: "vuelo",
    titulo: "VUELO",
    subsecciones: [
      {
        numero: "2",
        titulo: "CONDICIÓN VISUAL DEL RPA",
        items: ["Condición Segura, siempre en condición VLOS"],
      },
      {
        numero: "3",
        titulo: "OBSTÁCULOS EN LA ZONA DE OPERACIÓN",
        items: [
          "Libre paso de la aeronave",
          "Existe presencia de otro RPAs en la zona de operación",
          "Existe presencia de algún objeto en zona de operación.",
        ],
      },
    ],
  },
  {
    id: "aterrizaje",
    titulo: "ATERRIZAJE",
    subsecciones: [
      {
        numero: "1",
        titulo: "ÁREA DE ATERRIZAJE",
        items: [
          "Libre de obstáculos, horizontal y verticalmente",
          "Presencia elementos puedan interferir la operación",
          "Señalización preventiva del área",
        ],
      },
      {
        numero: "2",
        titulo: "VUELO ESTACIONARIO (a 2 mts)",
        items: [
          "Todos los elementos se visualizan fijos y ajustados",
          "Vuelo estable del RPA",
        ],
      },
      {
        numero: "3",
        titulo: "MODO DE VUELO PARA EL ATERRIZAJE DEL RPA",
        items: [
          "Selección de modo manual para el aterrizaje del RPA",
          "Selección de modo automático para aterrizaje del RPA",
          "Selección de modo asistido para el aterrizaje del RPA",
        ],
      },
      {
        numero: "4",
        titulo: "ATERRIZAJE",
        items: [
          "Detención total de las hélices",
          "Desconexión de energía del RPA",
          "Apagado de todos los equipos y accesorios",
        ],
      },
      {
        numero: "5",
        titulo: "POST ATERRIZAJE",
        items: [
          "El RPA mantiene condiciones iniciales antes de vuelo",
          "Remoción e inspección de baterías en forma segura",
          "Verificar Temperatura de la batería",
          "Avisar a ANAC término de Operación",
        ],
      },
    ],
  },
  {
    id: "almacenaje",
    titulo: "ALMACENAJE",
    subsecciones: [
      {
        numero: "1",
        titulo: "INSPECCIÓN VISUAL",
        items: [
          "Cámara",
          "Motores del RPA",
          "Hélices del RPA",
          "Baterías del RPA",
          "Control Remoto",
          "Tren de aterrizaje",
          "Almacenaje General del RPA",
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CHILE — checklist del documento OPE-PR-01, Anexo 1 (páginas 11–14).
// Autoridad DGAC; menciona JAC y DAN 151. Sin secciones TORNILLOS ni MOVIMIENTO AXIAL.
// ─────────────────────────────────────────────────────────────────────────────
const RAW_CHILE: RawEtapa[] = [
  {
    id: "preparacion",
    titulo: "PREPARACIÓN DEL VUELO",
    subsecciones: [
      {
        numero: "1",
        titulo: "PERMISOS Y PLANES DE VUELO",
        items: [
          "Orden de vuelo emanada por Gerente Operaciones",
          "Credencial de los Operadores RPAs",
          "Tarjeta de Registro del RPA",
          "Res. Exc. Seguro Aprobado por la JAC",
          "Autorización de Operación otorgada por la DGAC (Avisar DGAC)",
          "Autorización Entidad Estatal en caso vuelo DAN 151",
        ],
      },
      {
        numero: "2",
        titulo: "CONDICIONES METEOROLÓGICAS",
        items: [
          "METAR aeródromo más cercano, verificar NOTAM",
          "Sin presencia de neblina, lluvia o condiciones deficientes",
          "Velocidad del viento y Temperatura ambiente adecuada",
        ],
      },
    ],
  },
  {
    id: "prevuelo",
    titulo: "PREVUELO",
    subsecciones: [
      {
        numero: "1",
        titulo: "COMPROBACIÓN VISUAL DEL FUSELAJE",
        items: [
          "Motores girando Manual y correctamente",
          "Baterías bien sujetas y con carga suficiente",
          "Conexiones estables y Cables en buen estado",
          "Antenas en correcta posición",
        ],
      },
      {
        numero: "2",
        titulo: "HÉLICES",
        items: ["Sin grietas o desgaste aparente", "Montaje correcto y ajustado"],
      },
      {
        numero: "3",
        titulo: "ESTACIÓN TERRESTRE DE CARGA",
        items: [
          "Generador conectado correctamente (si no tiene, elimina)",
          "Alargador(es) en buen estado",
          "Cargadores conectados y disponibles",
          "Sin señales de sobrecalentamiento en los equipos",
        ],
      },
      {
        numero: "4",
        titulo: "RADIO CONTROL",
        items: [
          "Antenas en correcta posición",
          "Palancas en buen estado y movimiento libre, sin trabas",
          "Ajuste modo de vuelo",
          "Baterías bien sujetas y con carga suficiente",
          "Pantalla en correcta posición y asegurada",
        ],
      },
      {
        numero: "5",
        titulo: "TARJETA SD",
        items: ["Mantiene espacio suficiente disponible", "Correctamente instalada"],
      },
      {
        numero: "6",
        titulo: "ÁREA DE DESPEGUE Y ATERRIZAJE",
        items: [
          "Área delimitada de seguridad con conos",
          "Libre de obstáculos, horizontal y verticalmente",
          "Señalización preventiva del área de operación",
        ],
      },
      {
        numero: "7",
        titulo: "PERSONAL EN TIERRA",
        items: [
          "Uso de equipos y elementos de seguridad",
          "Condiciones físicas y mentales óptimas de operadores",
        ],
      },
      {
        numero: "8",
        titulo: "CÁMARA Y ACCESORIOS",
        items: [
          "Lente de cámara sin grietas o manchas aparentes",
          "Fijación adecuada de cámara (chequeo de Gimbal)",
        ],
      },
      {
        numero: "9",
        titulo: "CONDICIONES OPERACIONALES",
        items: [
          "Todos los equipos encendidos correctamente",
          "Se estableció la condición RTH (chequeo RTH de retorno)",
          "Se estableció altura máxima de vuelo",
          "Satélites disponibles mayor o igual a 10",
          "Señal óptima de control y RPA",
          "Sensores de obstáculo libre",
          "Ninguna señal de emergencia en pantalla",
          "Calibración correcta de Gimbal",
          "Calibración de control, IMU, brújula y cualquiera otra",
          "Paracaídas DAN 151 (Si corresponde)",
        ],
      },
    ],
  },
  {
    id: "despegue",
    titulo: "DESPEGUE",
    subsecciones: [
      {
        numero: "1",
        titulo: "VUELO ESTACIONARIO (a 2 mts)",
        items: [
          "Todos los elementos se visualizan fijos y ajustados",
          "Vuelo estable del RPA",
          "Verifique Comandos de Vuelo antes de salir",
          "Despegue contra el viento",
        ],
      },
    ],
  },
  {
    id: "vuelo",
    titulo: "VUELO",
    subsecciones: [
      {
        numero: "2",
        titulo: "CONDICIÓN VISUAL DEL RPA",
        items: ["Condición Segura, siempre en condición VLOS"],
      },
      {
        numero: "3",
        titulo: "OBSTÁCULOS EN LA ZONA DE OPERACIÓN",
        items: [
          "Libre paso de la aeronave, DAN 151",
          "Existe presencia de otro RPAs en la zona de operación",
          "Existe presencia de algún objeto en zona de operación.",
        ],
      },
    ],
  },
  {
    id: "aterrizaje",
    titulo: "ATERRIZAJE",
    subsecciones: [
      {
        numero: "1",
        titulo: "ÁREA DE ATERRIZAJE",
        items: [
          "Libre de obstáculos, horizontal y verticalmente",
          "Presencia elementos puedan interferir la operación",
          "Señalización preventiva del área",
        ],
      },
      {
        numero: "2",
        titulo: "VUELO ESTACIONARIO (a 2 mts)",
        items: [
          "Todos los elementos se visualizan fijos y ajustados",
          "Vuelo estable del RPA",
        ],
      },
      {
        numero: "3",
        titulo: "MODO DE VUELO PARA EL ATERRIZAJE DEL RPA",
        items: [
          "Selección de modo manual para el aterrizaje del RPA",
          "Selección de modo automático para aterrizaje del RPA",
          "Selección de modo asistido para el aterrizaje del RPA",
        ],
      },
      {
        numero: "4",
        titulo: "ATERRIZAJE",
        items: [
          "Detención total de las hélices",
          "Desconexión de energía del RPA",
          "Apagado de todos los equipos y accesorios",
        ],
      },
      {
        numero: "5",
        titulo: "POST ATERRIZAJE",
        items: [
          "El RPA mantiene condiciones iniciales antes de vuelo",
          "Remoción e inspección de baterías en forma segura",
          "Verificar Temperatura de la batería",
          "Avisar a DGAC término de Operación",
        ],
      },
    ],
  },
  {
    id: "almacenaje",
    titulo: "ALMACENAJE",
    subsecciones: [
      {
        numero: "1",
        titulo: "INSPECCIÓN VISUAL",
        items: [
          "Cámara",
          "Motores del RPA",
          "Hélices del RPA",
          "Baterías del RPA",
          "Control Remoto",
          "Tren de aterrizaje",
          "Almacenaje General del RPA",
        ],
      },
    ],
  },
];

const RAW_POR_PAIS: Record<Pais, RawEtapa[]> = {
  ARGENTINA: RAW_ARGENTINA,
  CHILE: RAW_CHILE,
};

// Ítems críticos (regulatorios) que el formato original resalta en rojo, por país.
const ITEMS_CRITICOS_POR_PAIS: Record<Pais, Set<string>> = {
  ARGENTINA: new Set([
    "Autorización de Operación otorgada por la ANAC",
    "Avisar a ANAC término de Operación",
  ]),
  CHILE: new Set([
    "Autorización de Operación otorgada por la DGAC (Avisar DGAC)",
    "Avisar a DGAC término de Operación",
  ]),
};

function construirChecklist(pais: Pais): Etapa[] {
  const raw = RAW_POR_PAIS[pais];
  const criticos = ITEMS_CRITICOS_POR_PAIS[pais];
  return raw.map((etapa) => ({
    id: etapa.id,
    titulo: etapa.titulo,
    subsecciones: etapa.subsecciones.map((sub, si) => ({
      numero: sub.numero,
      titulo: sub.titulo,
      items: sub.items.map((texto, ii) => ({
        id: `${etapa.id}-${si}-${ii}`,
        texto,
        critico: criticos.has(texto),
      })),
    })),
  }));
}

const CHECKLISTS: Record<Pais, Etapa[]> = {
  ARGENTINA: construirChecklist("ARGENTINA"),
  CHILE: construirChecklist("CHILE"),
};

/** Lista plana de todos los ítems, con su contexto de etapa/sección. */
export interface ItemPlano {
  id: string;
  etapaId: string;
  etapa: string;
  seccion: string;
  numero: string;
  texto: string;
}

function construirItemsPlanos(checklist: Etapa[]): ItemPlano[] {
  return checklist.flatMap((etapa) =>
    etapa.subsecciones.flatMap((sub) =>
      sub.items.map((item) => ({
        id: item.id,
        etapaId: etapa.id,
        etapa: etapa.titulo,
        seccion: sub.titulo,
        numero: sub.numero,
        texto: item.texto,
      })),
    ),
  );
}

const ITEMS_PLANOS_POR_PAIS: Record<Pais, ItemPlano[]> = {
  ARGENTINA: construirItemsPlanos(CHECKLISTS.ARGENTINA),
  CHILE: construirItemsPlanos(CHECKLISTS.CHILE),
};

// Etapas previas al vuelo (hasta el punto de volar). Definen el corte de la fase
// pre-vuelo y la habilitación del botón "Listo para volar". Comunes a ambos países.
export const ETAPAS_PREVUELO = new Set(["preparacion", "prevuelo", "despegue"]);

/** Checklist completo del país. */
export function getChecklist(pais: Pais): Etapa[] {
  return CHECKLISTS[pais];
}

/** Lista plana de ítems del país (orden del formato). */
export function getItemsPlanos(pais: Pais): ItemPlano[] {
  return ITEMS_PLANOS_POR_PAIS[pais];
}

/** Cantidad total de ítems del país. */
export function getTotalItems(pais: Pais): number {
  return ITEMS_PLANOS_POR_PAIS[pais].length;
}

/** Etapas del país separadas por fase pre/post vuelo. */
export function getEtapasPrevuelo(pais: Pais): Etapa[] {
  return CHECKLISTS[pais].filter((e) => ETAPAS_PREVUELO.has(e.id));
}

export function getEtapasPostvuelo(pais: Pais): Etapa[] {
  return CHECKLISTS[pais].filter((e) => !ETAPAS_PREVUELO.has(e.id));
}

export function getItemsPrevuelo(pais: Pais): ItemPlano[] {
  return ITEMS_PLANOS_POR_PAIS[pais].filter((i) => ETAPAS_PREVUELO.has(i.etapaId));
}

export function getItemsPostvuelo(pais: Pais): ItemPlano[] {
  return ITEMS_PLANOS_POR_PAIS[pais].filter((i) => !ETAPAS_PREVUELO.has(i.etapaId));
}
