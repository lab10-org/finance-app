import { ENTRADA_PATH, LIBRO_PATH } from "@/lib/auth/route-decision";

import { correoDePrueba } from "./support/mailpit";
import { entrarConCorreo, expect, test } from "./support/test";

/*
 * La primera prueba end-to-end: la puerta.
 *
 * Comprueba lo único que vitest no alcanza — que el proxy, GoTrue y las cookies
 * de sesión se comportan juntos como dice `decideRoute`, que ahí se prueba
 * contra un booleano y aquí contra una sesión de verdad.
 */

test.describe("la puerta", () => {
  test("sin sesión, cualquier ruta lleva a la entrada", async ({ page }) => {
    await page.goto(LIBRO_PATH);

    await expect(page).toHaveURL(new RegExp(`${ENTRADA_PATH}$`));
    await expect(page.getByLabel("Correo")).toBeVisible();
  });

  test("el correo y el código dejan a la persona en su libro", async ({ page }) => {
    const email = correoDePrueba();

    await entrarConCorreo(page, email);

    await expect(page).toHaveURL(new RegExp(`${LIBRO_PATH}$`));
    // El encabezado del mes: lo primero que existe en el libro, con o sin gastos.
    await expect(page.getByRole("button", { name: "Mes anterior" })).toBeVisible();
  });

  test("con sesión, la entrada no se vuelve a ver", async ({ page, entrar }) => {
    await entrar();

    await page.goto(ENTRADA_PATH);

    await expect(page).toHaveURL(new RegExp(`${LIBRO_PATH}$`));
  });
});
