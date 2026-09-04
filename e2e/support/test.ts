import { test as base, expect, type Page } from "@playwright/test";

import { ENTRADA_PATH, LIBRO_PATH } from "@/lib/auth/route-decision";

import { codigoPara, correoDePrueba } from "./mailpit";

/*
 * El `test` que usan las pruebas de este directorio.
 *
 * Añade una sola cosa sobre el de Playwright: `entrar`, que hace el recorrido
 * completo de "la entrada" —correo, código leído del buzón, sesión— y deja el
 * navegador parado en el libro. Casi ninguna prueba quiere *probar* la entrada;
 * la necesita para llegar a lo que sí quiere probar.
 */

export interface Cuenta {
  email: string;
}

interface Fixtures {
  /**
   * Entra con una cuenta recién creada y devuelve su correo.
   *
   * Cada llamada usa una dirección distinta, así que la cuenta nace nueva y la
   * prueba no hereda nada de otra. No nace *vacía*: un trigger le siembra el mes
   * estándar (requisito 8), igual en cada corrida, y eso es justo lo que hace
   * que una aserción pueda citar esas cifras.
   */
  entrar: (opciones?: { email?: string }) => Promise<Cuenta>;
}

export const test = base.extend<Fixtures>({
  entrar: async ({ page }, use) => {
    await use(async ({ email = correoDePrueba() } = {}) => {
      await entrarConCorreo(page, email);
      return { email };
    });
  },
});

/**
 * El recorrido de "la entrada", tal como lo hace una persona.
 *
 * Exportado aparte del fixture para las pruebas que sí quieren manejar el
 * recorrido paso a paso.
 */
export async function entrarConCorreo(page: Page, email: string): Promise<void> {
  await page.goto(ENTRADA_PATH);

  const correo = page.getByLabel("Correo");
  /*
   * Esperar el foco antes de escribir, y no sólo que el campo sea visible.
   *
   * "La entrada" llega del servidor como HTML antes de que React la hidrate, y
   * los dos pasos enfocan su campo en un `useEffect` al montar (2.1). Ese foco
   * es entonces la señal de que la pantalla ya está viva: sin esperarlo,
   * Playwright escribe en el HTML muerto —React descarta lo escrito al
   * hidratar— y luego hace clic en un botón que todavía no tiene handler. Se ve
   * como un correo que nunca llegó, que es la falla más confusa posible.
   */
  await expect(correo).toBeFocused();
  await correo.fill(email);
  await page.getByRole("button", { name: "Enviar código" }).click();

  const codigo = page.getByLabel("Código");
  await expect(codigo).toBeFocused();
  await codigo.fill(await codigoPara(email));
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL(LIBRO_PATH);
}

export { expect };
