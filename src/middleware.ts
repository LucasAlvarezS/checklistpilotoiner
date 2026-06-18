export { auth as middleware } from "@/auth";

// Protege el panel y las APIs de administración. Sin sesión válida → redirige a "/".
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
