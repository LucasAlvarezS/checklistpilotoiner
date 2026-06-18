import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || "informes";

let cliente: SupabaseClient | null = null;

export function storageDisponible(): boolean {
  return Boolean(URL && KEY);
}

function getClient(): SupabaseClient {
  if (!URL || !KEY) {
    throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (!cliente) {
    cliente = createClient(URL, KEY, { auth: { persistSession: false } });
  }
  return cliente;
}

/** Sube el PDF al bucket privado y retorna su path. */
export async function subirPdf(
  inspeccionId: string,
  nombre: string,
  pdf: Buffer,
): Promise<string> {
  const path = `${inspeccionId}/${nombre}`;
  const { error } = await getClient()
    .storage.from(BUCKET)
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (error) throw new Error(`Storage upload: ${error.message}`);
  return path;
}

/** Descarga el PDF desde el bucket como Buffer. */
export async function descargarPdf(path: string): Promise<Buffer> {
  const { data, error } = await getClient().storage.from(BUCKET).download(path);
  if (error || !data) {
    throw new Error(`Storage download: ${error?.message ?? "sin datos"}`);
  }
  return Buffer.from(await data.arrayBuffer());
}

/** Elimina el PDF del bucket. */
export async function eliminarPdf(path: string): Promise<void> {
  const { error } = await getClient().storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Storage remove: ${error.message}`);
}
