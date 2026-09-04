import { ENTRADA_PATH } from "@/lib/auth/route-decision";

import { correoDePrueba } from "./support/mailpit";
import { entrarConCorreo, expect, test } from "./support/test";

/*
 * El libro contra la base de verdad (spec: supabase-expense-persistence).
 *
 * Las tres pruebas salieron de explorar la feature en el navegador. Cada una
 * comprueba algo que sólo existe en este nivel —una fila que sobrevive a la
 * recarga, RLS con una sesión real, una marca de borrado que llegó a la base
 * antes de que el usuario cerrara la pestaña—; el store contra el repositorio
 * falso ya está probado en vitest y no se repite acá.
 *
 *   1. el gasto registrado sigue ahí después de recargar   (1.1, 1.2, 3.1, 3.2, 5.1, 5.2)
 *   2. dos cuentas en el mismo navegador ven libros distintos (2.2, 2.4, 2.6, 8.1, 8.5)
 *   3. lo eliminado no vuelve, pero deshacer sí lo trae     (1.5, 6.3-6.7)
 *
 * El libro sembrado es idéntico en cada corrida —el trigger de
 * `seed_new_account` pone ocho gastos en los días 1, 2 y 3 del mes de creación—
 * y por eso las aserciones pueden citar sus cifras. Lo que NO se aserta es el
 * "PROMEDIO DIARIO" ni el comparativo: dependen del día de hoy.
 */

/** Lo que suma el mes recién sembrado. Estable sea cual sea el día. */
const TOTAL_SEMBRADO = "$248.900";

/** El botón flotante del libro. Existe sólo cuando el mes ya está en pantalla. */
function registrar(page: import("@playwright/test").Page) {
  return page.getByRole("button", { name: "Registrar" });
}

/**
 * Registra un gasto por "la hoja", como lo haría una persona.
 *
 * Todo se acota al diálogo a propósito: los chips de categoría de "la hoja"
 * tienen los mismos nombres accesibles que los del filtro del libro, y sin
 * acotar el clic cae en el filtro y la prueba falla por la razón equivocada.
 */
async function registrarGasto(
  page: import("@playwright/test").Page,
  { monto, categoria, descripcion }: { monto: string; categoria: string; descripcion: string },
) {
  await registrar(page).click();

  const hoja = page.getByTestId("expense-sheet");
  await hoja.getByLabel("Monto").fill(monto);
  await hoja.getByRole("button", { name: categoria }).click();
  await hoja.getByLabel("DESCRIPCIÓN").fill(descripcion);
  await hoja.getByRole("button", { name: "Guardar" }).click();
}

test.describe("el libro persistido", () => {
  test("el gasto registrado sigue ahí después de recargar", async ({ page, entrar }) => {
    await entrar();
    await expect(registrar(page)).toBeVisible();

    await registrarGasto(page, {
      monto: "35000",
      categoria: "Transporte",
      descripcion: "Taxi al aeropuerto",
    });

    // El nombre accesible de una fila concatena descripción, categoría y monto.
    const fila = page.getByRole("button", { name: "Taxi al aeropuerto Transporte $35.000" });
    await expect(fila).toBeVisible();

    /*
     * La recarga es la prueba: hasta acá el gasto podría estar sólo en memoria
     * (5.1 lo muestra sin esperar a la base). Después de recargar, lo que se ve
     * salió del servidor.
     */
    await page.reload();
    await expect(registrar(page)).toBeVisible();

    await expect(fila).toBeVisible();
    // El encabezado cuenta el gasto nuevo: $248.900 sembrados + $35.000.
    await expect(page.getByTestId("month-total")).toHaveText("$283.900");
    // Un gasto de hoy abre su propia jornada; una fecha corrida por zona
    // horaria lo sacaría de "HOY" y esta aserción lo vería.
    await expect(page.getByTestId("day-label").first()).toHaveText("HOY");
  });

  test("dos cuentas en el mismo navegador ven libros distintos", async ({ page, entrar }) => {
    await entrar();
    await expect(registrar(page)).toBeVisible();

    await registrarGasto(page, {
      monto: "35000",
      categoria: "Transporte",
      descripcion: "Taxi al aeropuerto",
    });
    await expect(
      page.getByRole("button", { name: "Taxi al aeropuerto Transporte $35.000" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await page.getByRole("button", { name: "Sí, cerrar sesión" }).click();
    await page.waitForURL(new RegExp(`${ENTRADA_PATH}$`));

    // Segunda cuenta, mismo navegador y mismo dispositivo.
    await entrarConCorreo(page, correoDePrueba());
    await expect(registrar(page)).toBeVisible();

    await expect(page.getByRole("button", { name: /Taxi al aeropuerto/ })).toHaveCount(0);
    /*
     * Las dos aserciones que siguen son las que hacen honesta la prueba: sin
     * ellas, un libro vacío por error pasaría igual que uno bien aislado.
     */
    await expect(page.getByTestId("month-total")).toHaveText(TOTAL_SEMBRADO);
    await expect(page.getByRole("button", { name: "Netflix Suscripciones $26.900" })).toBeVisible();
  });

  test("lo eliminado no vuelve, pero deshacer sí lo trae", async ({ page, entrar }) => {
    await entrar();
    await expect(registrar(page)).toBeVisible();

    const netflix = page.getByRole("button", { name: "Netflix Suscripciones $26.900" });
    const crepes = page.getByRole("button", { name: "Crepes & Waffles Restaurantes $42.300" });

    // Primer borrado: el que sí se deshace.
    await netflix.click();
    await page.getByTestId("expense-sheet").getByRole("button", { name: "Eliminar" }).click();

    await expect(page.getByTestId("undo-toast")).toBeVisible();
    await expect(page.getByRole("button", { name: /Netflix/ })).toHaveCount(0);
    await expect(page.getByTestId("month-total")).toHaveText("$222.000"); // 248.900 − 26.900

    await page.getByRole("button", { name: "Deshacer" }).click();
    await expect(netflix).toBeVisible();
    await expect(page.getByTestId("month-total")).toHaveText(TOTAL_SEMBRADO);

    /*
     * Segundo borrado: el que NO se deshace. 6.4 dice que la marca se escribe de
     * una, no cuando expira la ventana de deshacer, y 6.6 que recargar durante
     * esa ventana deja el borrado en firme. Se espera la respuesta del PATCH
     * antes de recargar para no cortar la petición en vuelo: lo que se prueba es
     * que la marca sobrevive a la recarga, no la velocidad de la red.
     */
    const marcaEscrita = page.waitForResponse(
      (res) => res.request().method() === "PATCH" && res.url().includes("/rest/v1/expenses"),
    );
    await crepes.click();
    await page.getByTestId("expense-sheet").getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByTestId("undo-toast")).toBeVisible();
    await marcaEscrita;

    // Con el toast todavía en pantalla, es decir, dentro de la ventana.
    await expect(page.getByTestId("undo-toast")).toBeVisible();
    await page.reload();
    await expect(registrar(page)).toBeVisible();

    await expect(page.getByRole("button", { name: /Crepes & Waffles/ })).toHaveCount(0);
    await expect(page.getByTestId("month-total")).toHaveText("$206.600"); // 248.900 − 42.300
  });
});
