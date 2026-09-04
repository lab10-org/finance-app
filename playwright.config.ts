import { defineConfig, devices } from "@playwright/test";

/*
 * Las pruebas end-to-end.
 *
 * Corren contra la app real y contra el stack local de Supabase: no hay dobles
 * ni mocks aquí. Eso las hace lentas y las hace dependientes de que Docker esté
 * arriba, y es justo lo que les da el valor que vitest no puede dar — el proxy,
 * las cookies de sesión y GoTrue sólo existen de verdad en este nivel.
 *
 * Lo que sí se prueba en vitest (formato de montos, la máquina de "la entrada",
 * el texto de las migraciones) no se repite acá.
 */

/** Donde `npm run dev` sirve la app. La misma que dice el README. */
const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  /*
   * Sólo `.spec.ts`. Vitest se queda con los `.test.ts` de las carpetas
   * `__tests__`, y los dos corredores nunca se pisan: `npm test` no ve estos
   * archivos y `npm run test:e2e` no ve los otros.
   */
  testMatch: /.*\.spec\.ts$/,

  fullyParallel: true,
  // Un `.only` olvidado no debe pasar la revisión.
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  /*
   * Un solo worker en CI. En local, la mitad de los núcleos: el cuello de
   * botella no es Playwright sino GoTrue, que aplica su propio límite de envío
   * por correo, así que más paralelismo no compra tiempo.
   */
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["html", { open: "never" }]],

  use: {
    baseURL: BASE_URL,
    /*
     * La traza sólo del primer reintento: es cara de producir y de guardar, y
     * en el 99% de las corridas verdes no la mira nadie.
     */
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "es-CO",
    timezoneId: "America/Bogota",
  },

  projects: [
    {
      /*
       * 390px de ancho, que es el diseño base del proyecto. La vista de
       * escritorio es una extensión posterior; cuando exista, se agrega aquí
       * como un proyecto aparte y no se cambia éste.
       */
      name: "movil",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    /*
     * En local reusamos el `npm run dev` que ya tengas abierto: arrancar otro
     * choca por el puerto y la primera compilación de Next cuesta más que la
     * prueba. En CI siempre se levanta uno limpio.
     */
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },

  // Next compila la ruta la primera vez que alguien la pide; el primer `goto`
  // de la corrida paga eso y por eso la espera es más larga que el default.
  timeout: 60_000,
  expect: { timeout: 10_000 },
});
