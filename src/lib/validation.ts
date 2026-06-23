import { z } from "zod";
import { ITEMS_PLANOS } from "./checklist-schema";

export const valorEnum = z.enum(["SI", "NO", "NA"]);

export const respuestaSchema = z.object({
  valor: valorEnum,
  observacion: z.string().trim().optional(),
});

/**
 * Validación de una inspección completa.
 * Reglas:
 *  - Cabecera obligatoria (piloto, parque, equipo).
 *  - Todos los ítems del formato deben tener una respuesta (SI / NO / NA).
 *  - Si un ítem está en NO, la observación es obligatoria.
 */
export const inspeccionSchema = z
  .object({
    fechaInspeccion: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona la fecha de la inspección"),
    // Clave de idempotencia generada en el cliente (opcional). Evita duplicados al
    // reenviar desde la cola offline.
    clientId: z.string().trim().max(64).optional(),
    pilotoNombre: z.string().trim().min(1, "Ingresa el nombre del piloto"),
    parqueNombre: z.string().trim().min(1, "Ingresa el nombre del parque"),
    equipoRPA: z.string().trim().min(1, "Ingresa el equipo / RPA"),
    respuestas: z.record(z.string(), respuestaSchema),
  })
  .superRefine((data, ctx) => {
    for (const item of ITEMS_PLANOS) {
      const r = data.respuestas[item.id];
      if (!r || !r.valor) {
        ctx.addIssue({
          code: "custom",
          message: "Debes marcar SÍ, NO o N/A",
          path: ["respuestas", item.id, "valor"],
        });
        continue;
      }
      if (r.valor === "NO" && (!r.observacion || r.observacion.trim() === "")) {
        ctx.addIssue({
          code: "custom",
          message: "La observación es obligatoria cuando marcas NO",
          path: ["respuestas", item.id, "observacion"],
        });
      }
    }
  });

export type InspeccionInput = z.infer<typeof inspeccionSchema>;
