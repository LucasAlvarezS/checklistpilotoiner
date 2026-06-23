import Image from "next/image";
import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { InstallButton } from "./components/InstallButton";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Hero INER */}
        <div className="rounded-t-2xl bg-iner-green px-6 py-8 text-center">
          <Image
            src="/logo-iner-mono.png"
            alt="INER"
            width={180}
            height={112}
            className="mx-auto"
            priority
          />
          <h1 className="mt-4 text-lg font-bold text-white">
            Checklist Inspecciones Externas
          </h1>
        </div>

        {/* Acciones */}
        <div className="rounded-b-2xl border border-t-0 border-black/10 bg-white p-6 shadow-sm">
          {session?.user ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-iner-gray">
                Sesión iniciada como{" "}
                <strong className="text-foreground">{session.user.email}</strong>
              </p>
              <Link href="/admin" className="btn-primary block w-full text-center">
                Ir al panel de administración
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="btn-secondary w-full">
                  Cerrar sesión
                </button>
              </form>
            </div>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/admin" });
              }}
            >
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-iner-gray">
                Administradores
              </p>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-black/15 bg-white px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-black/[.03]"
              >
                <GoogleIcon />
                Ingresar con Google
              </button>
              <p className="mt-2 text-center text-xs text-iner-gray">
                Acceso solo para cuentas <strong>autorizadas</strong>
              </p>
            </form>
          )}

          <div className="my-5 flex items-center gap-3 text-xs text-iner-gray">
            <span className="h-px flex-1 bg-black/10" />
            o
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <Link href="/checklist" className="btn-primary block w-full text-center">
            Entrar como piloto
          </Link>
          <p className="mt-2 text-center text-xs text-iner-gray">
            Completa el checklist de inspección en terreno.
          </p>

          <InstallButton />
        </div>

        <p className="mt-4 text-center text-xs text-iner-gray">
          INER · Ingeniería en Energías Renovables
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C42.9 35.1 44 30 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
