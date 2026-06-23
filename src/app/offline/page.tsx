import Image from "next/image";

export const metadata = { title: "Sin conexión · INER" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm">
        <Image
          src="/logo-iner.png"
          alt="INER"
          width={140}
          height={88}
          className="mx-auto"
        />
        <h1 className="mt-5 text-lg font-bold text-iner-green">Sin conexión</h1>
        <p className="mt-2 text-sm text-iner-gray">
          Esta página aún no está cacheada. El checklist sí funciona sin conexión una
          vez abierto: puedes completarlo y el envío quedará en cola para mandarse
          automáticamente cuando vuelva el internet.
        </p>
      </div>
    </main>
  );
}
