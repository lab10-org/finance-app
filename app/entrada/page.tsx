import { redirect } from "next/navigation";

import EntradaMount from "@/components/entrada/EntradaMount";
import { getSessionUser } from "@/lib/auth/session";
import { LIBRO_PATH } from "@/lib/auth/route-decision";

export const metadata = {
  title: "Entrar · Libro de gastos",
};

/**
 * "La entrada".
 *
 * The proxy normally redirects a signed-in visitor before this renders; the
 * check is repeated here so the sign-in screen can never flash for someone who
 * already has a session (4.3).
 */
export default async function EntradaPage() {
  const user = await getSessionUser();
  if (user) redirect(LIBRO_PATH);

  return <EntradaMount />;
}
