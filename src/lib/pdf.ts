import { CHECKLIST, type Valor } from "./checklist-schema";
import { LOGO_DATA_URI, FIRMA_DATA_URI } from "./assets";
import {
  formatearFechaSolo,
  type EstadoInspeccion,
  type FilaResultado,
} from "./inspeccion";

interface DatosPdf {
  codigo: string;
  revision: string;
  pilotoNombre: string;
  parqueNombre: string;
  equipoRPA: string;
  fecha: Date;
  estado: EstadoInspeccion;
  filas: FilaResultado[];
}

// Colores exactos del formato original (OPE-PR-01).
const C = {
  peach: "#F8CBAD", // banda de etapa
  blue: "#BDD7EE", // banda de subsección
  cream: "#FFF2CC", // columna N° / "PROCEDIMIENTOS NORMALES"
  yellow: "#FFFF00", // cabecera "SI"
};

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Check dibujado como SVG (vector). No depende de fuentes del sistema, por lo que
// se ve igual en local y en el Chromium serverless de Vercel (@sparticuz/chromium).
const CHECK_SVG =
  '<svg viewBox="0 0 24 24" width="13" height="13" style="vertical-align:middle">' +
  '<path d="M20 6 9 17l-5-5" fill="none" stroke="#044245" stroke-width="3.5" ' +
  'stroke-linecap="round" stroke-linejoin="round"/></svg>';

const marca = (valor: Valor, objetivo: Valor) =>
  valor === objetivo ? CHECK_SVG : "";

function construirCuerpo(filas: FilaResultado[]): string {
  const mapa = new Map(filas.map((f) => [f.id, f]));
  let primeraSub = true;

  return CHECKLIST.map((etapa) => {
    const subs = etapa.subsecciones
      .map((sub) => {
        const filasItems = sub.items
          .map((item) => {
            const f = mapa.get(item.id);
            const valor = (f?.valor ?? "NA") as Valor;
            const obs = f?.observacion ?? "";
            const obsTexto = valor === "NA" && !obs ? "N/A" : obs;
            return `<tr>
              <td class="item">${esc(item.texto)}</td>
              <td class="ck">${marca(valor, "SI")}</td>
              <td class="ck">${marca(valor, "NO")}</td>
              <td class="obs">${esc(obsTexto)}</td>
            </tr>`;
          })
          .join("");

        const cabezaSub = primeraSub
          ? `<td class="sub">${esc(sub.titulo)}</td>
             <td class="hdr si">SI</td>
             <td class="hdr">No</td>
             <td class="hdr obs">Observación.</td>`
          : `<td class="sub" colspan="4">${esc(sub.titulo)}</td>`;
        primeraSub = false;

        return `<tr>
            <td class="num" rowspan="${sub.items.length + 1}">${esc(sub.numero)}</td>
            ${cabezaSub}
          </tr>${filasItems}`;
      })
      .join("");

    return `<tr><td class="etapa" colspan="5">${esc(etapa.titulo)}</td></tr>${subs}`;
  }).join("");
}

// Encabezado del documento — se repite en cada página (display: table-header-group).
// Código, revisión y fecha los define el piloto (la fecha es la de la inspección).
const headerDoc = (meta: { codigo: string; revision: string; fechaTexto: string }) => `
<div class="doc-header">
  <table class="hmain">
    <tr>
      <td class="hlogo"><img src="${LOGO_DATA_URI}" alt="INER"/></td>
      <td class="htitle">Procedimiento trabajo aéreo</td>
      <td class="hmeta">
        <table class="hmeta-t">
          <tr><td>Código</td><td>OPE-PR-${esc(meta.codigo)}</td></tr>
          <tr><td colspan="2">Revisión ${esc(meta.revision)}</td></tr>
          <tr><td>Fecha</td><td><b>${esc(meta.fechaTexto)}</b></td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td class="hsig"><b>Creado por:</b><br/>Nicolás Caballero Arcos<br/>Gerente de Operaciones</td>
      <td class="hsig"><b>Revisado por:</b> Nicolas Caballero Arcos (Gerente General)</td>
      <td class="hsig"><b>Aprobado por:</b> Felipe Arriagada Cornejo (Director Ejecutivo)</td>
    </tr>
  </table>
</div>`;

// Pie del documento — se repite en cada página (display: table-footer-group).
const footerDoc = `
<div class="doc-footer">
  <table class="fmain">
    <tr><td class="fcell">
      <b>Autorizado por:</b> Nicolas Caballero Arcos<br/>
      <b>Cargo:</b> Administrador de Contrato<br/>
      <b>Firma:</b> <img src="${FIRMA_DATA_URI}" alt="firma"/>
    </td></tr>
  </table>
</div>`;

function construirHtml(datos: DatosPdf): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 8mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 9.5px; margin: 0; }

  /* Estructura de página: thead/tfoot se repiten en cada hoja */
  table.page { width: 100%; border-collapse: collapse; }
  table.page > thead { display: table-header-group; }
  table.page > tfoot { display: table-footer-group; }
  table.page > thead > tr > td,
  table.page > tfoot > tr > td,
  table.page > tbody > tr > td { padding: 0; border: none; }
  .doc-header { padding-bottom: 6px; }
  .doc-footer { padding-top: 6px; }

  /* Encabezado */
  table.hmain { width: 100%; border-collapse: collapse; }
  table.hmain > tr > td, .hmain td { border: 1px solid #000; }
  .hlogo { width: 168px; text-align: center; padding: 5px; vertical-align: middle; }
  .hlogo img { height: 66px; }
  .htitle { text-align: center; font-weight: bold; font-size: 17px; vertical-align: middle; }
  .hmeta { width: 185px; padding: 0; vertical-align: top; }
  .hmeta-t { width: 100%; border-collapse: collapse; font-size: 9px; }
  .hmeta-t td { border: 1px solid #000; padding: 2px 6px; }
  .hsig { font-size: 8px; padding: 4px 6px; vertical-align: top; width: 33.33%; }

  /* Pie */
  table.fmain { width: 100%; border-collapse: collapse; }
  .fcell { border: 1px solid #000; padding: 4px 8px; font-size: 8.5px; line-height: 1.5; }
  .fcell img { height: 34px; vertical-align: middle; }

  /* Título y cabecera de datos */
  h2.tit { font-size: 12px; font-weight: bold; margin: 4px 0 6px; }
  table.cab { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9.5px; }
  table.cab td { border: 1px solid #000; padding: 4px 7px; }
  table.cab .k { background: ${C.cream}; font-weight: bold; width: 15%; }

  /* Tabla del checklist */
  table.chk { width: 100%; border-collapse: collapse; table-layout: fixed;
              border: 1px solid #000; }
  table.chk td { border: 1px solid #000; padding: 3px 6px; vertical-align: middle;
                 word-wrap: break-word; }
  col.c-num { width: 6%; }
  col.c-item { width: 56%; }
  col.c-ck { width: 7%; }
  col.c-obs { width: 22%; }

  .titulo { text-align: center; font-weight: bold; background: #fff; }
  .proc { text-align: center; font-weight: bold; background: ${C.cream};
          text-transform: uppercase; letter-spacing: .5px; }
  .etapa { text-align: center; font-weight: bold; background: ${C.peach};
           text-transform: uppercase; }
  .num { text-align: center; font-weight: bold; background: ${C.cream}; }
  .sub { font-weight: bold; background: ${C.blue}; text-transform: uppercase; }
  .hdr { text-align: center; font-weight: bold; background: ${C.blue}; }
  .hdr.si { background: ${C.yellow}; }
  .hdr.obs { text-align: left; }
  .ck { text-align: center; font-weight: bold; font-size: 12px; }
  .obs { font-size: 9px; }
</style></head>
<body>
  <table class="page">
    <thead><tr><td>${headerDoc({
      codigo: datos.codigo,
      revision: datos.revision,
      fechaTexto: formatearFechaSolo(datos.fecha),
    })}</td></tr></thead>
    <tfoot><tr><td>${footerDoc}</td></tr></tfoot>
    <tbody><tr><td>
      <h2 class="tit">CHECKLIST INSPECCIONES EXTERNAS</h2>
      <table class="cab">
        <tr><td class="k">Piloto</td><td>${esc(datos.pilotoNombre)}</td><td class="k">Parque</td><td>${esc(datos.parqueNombre)}</td></tr>
        <tr><td class="k">Equipo / RPA</td><td>${esc(datos.equipoRPA)}</td><td class="k">Fecha</td><td>${esc(formatearFechaSolo(datos.fecha))}</td></tr>
      </table>
      <table class="chk">
        <colgroup>
          <col class="c-num"/><col class="c-item"/><col class="c-ck"/><col class="c-ck"/><col class="c-obs"/>
        </colgroup>
        <tbody>
          <tr><td class="titulo" colspan="5">FORMATO CHECK LIST</td></tr>
          <tr><td class="proc" colspan="5">PROCEDIMIENTOS NORMALES</td></tr>
          ${construirCuerpo(datos.filas)}
        </tbody>
      </table>
    </td></tr></tbody>
  </table>
</body></html>`;
}

async function lanzarNavegador() {
  if (process.env.VERCEL || process.env.AWS_REGION) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  const puppeteer = (await import("puppeteer")).default;
  return puppeteer.launch({ headless: true });
}

export async function generarPdf(datos: DatosPdf): Promise<Buffer> {
  const html = construirHtml(datos);
  const browser = await lanzarNavegador();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
