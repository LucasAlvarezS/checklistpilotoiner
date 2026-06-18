import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Solo se permite el acceso a cuentas del dominio corporativo de INER.
const DOMINIO = "@iner.cl";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  callbacks: {
    // Restringe el inicio de sesión a correos verificados @iner.cl.
    signIn({ profile }) {
      const email = profile?.email?.toLowerCase() ?? "";
      return profile?.email_verified === true && email.endsWith(DOMINIO);
    },
    // Usado por el middleware: solo deja pasar si hay sesión.
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
});
