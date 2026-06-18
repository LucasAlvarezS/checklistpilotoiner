import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Historial } from "./components/Historial";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <main className="min-h-full">
      <header className="border-b border-black/10 bg-iner-green">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Image src="/logo-iner-mono.png" alt="INER" width={92} height={52} priority />
          <div className="ml-1">
            <h1 className="text-sm font-bold text-white sm:text-base">
              Panel de administración
            </h1>
            <p className="text-xs text-[#bcd2d2]">Historial de checklists · INER</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-[#cfe0e0] sm:inline">
              {session?.user?.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-white/30 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <Historial />
      </div>
    </main>
  );
}
