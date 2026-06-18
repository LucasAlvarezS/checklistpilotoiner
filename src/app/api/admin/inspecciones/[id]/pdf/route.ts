import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { descargarPdf } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return new Response("No autorizado", { status: 401 });

  const { id } = await params;
  const insp = await prisma.inspeccion.findUnique({
    where: { id },
    select: { pdfPath: true },
  });
  if (!insp?.pdfPath) {
    return new Response("PDF no disponible para esta inspección.", { status: 404 });
  }

  try {
    const buf = await descargarPdf(insp.pdfPath);
    const filename = insp.pdfPath.split("/").pop() ?? "informe.pdf";
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("Error al descargar PDF:", e);
    return new Response("No se pudo obtener el PDF.", { status: 500 });
  }
}
