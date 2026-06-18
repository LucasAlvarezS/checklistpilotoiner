import Image from "next/image";
import Link from "next/link";
import { IconAlert, IconCheck, IconMail } from "../components/icons";

export default async function EnviadoPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; correo?: string }>;
}) {
  const { estado, correo } = await searchParams;
  const conObservaciones = estado === "CON_OBSERVACIONES";
  const correoEnviado = correo !== "0";

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm">
        <Image
          src="/logo-iner.png"
          alt="INER"
          width={140}
          height={75}
          className="mx-auto"
          priority
        />

        <div
          className={`mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full ${
            conObservaciones
              ? "bg-iner-amber-50 text-iner-amber"
              : "bg-iner-green-50 text-iner-green"
          }`}
        >
          {conObservaciones ? <IconAlert size={32} /> : <IconCheck size={32} />}
        </div>

        <h1 className="mt-4 text-xl font-bold text-iner-green">
          Inspección enviada
        </h1>
        <p className="mt-2 text-sm text-iner-gray">
          {conObservaciones
            ? "La inspección se registró con observaciones. Se notificó al supervisor con el detalle de los ítems en NO."
            : "La inspección se registró conforme, con todas las casillas en SÍ."}
        </p>

        <div
          className={`mt-4 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
            correoEnviado
              ? "bg-iner-green-50 text-iner-green"
              : "bg-red-50 text-red-700"
          }`}
        >
          {correoEnviado && <IconMail size={16} />}
          {correoEnviado
            ? "Correo enviado al supervisor con el PDF adjunto."
            : "La inspección se guardó, pero el correo no pudo enviarse. Avisa al administrador."}
        </div>

        <Link href="/" className="btn-primary mt-6 inline-block w-full">
          Nueva inspección
        </Link>
      </div>
    </main>
  );
}
