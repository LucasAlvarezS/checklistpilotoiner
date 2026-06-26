import { ChecklistForm } from "../components/ChecklistForm";
import { esPaisValido, PAIS_POR_DEFECTO } from "@/lib/checklist-schema";

export default async function ChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { pais: paisParam } = await searchParams;
  const pais = esPaisValido(paisParam) ? paisParam : PAIS_POR_DEFECTO;

  return (
    <main className="min-h-full">
      <ChecklistForm pais={pais} />
    </main>
  );
}
