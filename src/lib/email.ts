import { Resend } from "resend";
import { InspeccionEmail, type ItemNo } from "@/emails/InspeccionEmail";
import type { EstadoInspeccion, ResumenInspeccion } from "./inspeccion";
import { LOGO_CORREO_DATA_URI } from "./assets";

// El logo (versión monocromática ámbar oficial, para la cabecera verde) se adjunta inline
// vía CID para que se vea en cualquier cliente de correo, sin depender de una URL pública.
const LOGO_CID = "logo-iner";
const LOGO_BUFFER = Buffer.from(LOGO_CORREO_DATA_URI.split(",")[1], "base64");

interface EnviarCorreoArgs {
  pilotoNombre: string;
  parqueNombre: string;
  equipoRPA: string;
  fechaTexto: string;
  estado: EstadoInspeccion;
  itemsNo: ItemNo[];
  resumen: ResumenInspeccion;
  pdf: Buffer;
  nombrePdf: string;
}

export async function enviarCorreoInspeccion(args: EnviarCorreoArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  // MAIL_TO_SUPERVISOR admite uno o varios correos separados por coma.
  const to = (process.env.MAIL_TO_SUPERVISOR ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!apiKey || !from || to.length === 0) {
    throw new Error(
      "Faltan variables de entorno de correo (RESEND_API_KEY, MAIL_FROM, MAIL_TO_SUPERVISOR).",
    );
  }

  const resend = new Resend(apiKey);
  const logoUrl = `cid:${LOGO_CID}`;

  const conforme = args.estado === "COMPLETA_SI";
  const subject = conforme
    ? `Checklist conforme — ${args.parqueNombre} · ${args.pilotoNombre}`
    : `Checklist CON OBSERVACIONES (${args.resumen.totalNo}) — ${args.parqueNombre} · ${args.pilotoNombre}`;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    react: InspeccionEmail({
      pilotoNombre: args.pilotoNombre,
      parqueNombre: args.parqueNombre,
      equipoRPA: args.equipoRPA,
      fechaTexto: args.fechaTexto,
      estado: args.estado,
      itemsNo: args.itemsNo,
      totalSi: args.resumen.totalSi,
      totalNo: args.resumen.totalNo,
      totalNa: args.resumen.totalNa,
      total: args.resumen.total,
      logoUrl,
    }),
    attachments: [
      {
        filename: args.nombrePdf,
        content: args.pdf,
      },
      {
        filename: "logo-iner.png",
        content: LOGO_BUFFER,
        contentId: LOGO_CID,
      },
    ],
  });

  if (error) {
    throw new Error(`Resend: ${error.message ?? JSON.stringify(error)}`);
  }
  return data;
}
