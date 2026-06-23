import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Se permite el acceso a cuentas del dominio corporativo de INER...
const DOMINIO = "@iner.cl";

// ...y a correos externos (fuera del dominio) explícitamente autorizados. Se
// combinan los definidos aquí con los de la variable de entorno
// CORREOS_PERMITIDOS (lista separada por comas), para poder agregar/quitar sin
// tocar el código. Todos deben ser cuentas Google verificadas.
const CORREOS_PERMITIDOS = new Set(
  [
    "nicolascaballeroarcos@gmail.com",
    ...(process.env.CORREOS_PERMITIDOS ?? "").split(","),
  ]
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  callbacks: {
    // Permite iniciar sesión solo a correos verificados que sean @iner.cl o estén
    // en la lista de correos externos autorizados.
    signIn({ profile }) {
      if (profile?.email_verified !== true) return false;
      const email = profile?.email?.toLowerCase() ?? "";
      return email.endsWith(DOMINIO) || CORREOS_PERMITIDOS.has(email);
    },
    // Usado por el middleware: solo deja pasar si hay sesión.
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
});
