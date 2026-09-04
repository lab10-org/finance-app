import { CODE_LENGTH } from "@/lib/auth/config";

/*
 * Mailpit, el buzón del stack local.
 *
 * Ningún correo sale de la máquina: `supabase start` levanta Mailpit y GoTrue
 * le entrega todo. Para una prueba end-to-end eso es la única forma honesta de
 * entrar — el código de seis dígitos se lee del correo, igual que lo haría una
 * persona, en vez de saltarse "la entrada" con una llave de servicio.
 */

/** `[inbucket] port` en supabase/config.toml. */
export const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:54324";

interface MailpitSummary {
  ID: string;
  To: { Address: string }[];
  Created: string;
}

interface MailpitList {
  messages: MailpitSummary[];
}

async function mailpit<T>(path: string): Promise<T> {
  const response = await fetch(`${MAILPIT_URL}${path}`);
  if (!response.ok) {
    throw new Error(
      `Mailpit respondió ${response.status} a ${path}. ¿Está arriba el stack local? ` +
        "Levántalo con `supabase start`.",
    );
  }
  return (await response.json()) as T;
}

/*
 * Aquí no se vacía el buzón, a propósito.
 *
 * Mailpit sólo sabe borrarlo entero, y las pruebas corren en paralelo: una que
 * limpiara antes de pedir su código se llevaría por delante los correos de las
 * otras, que fallarían diciendo que nunca les llegó nada. El aislamiento lo da
 * `correoDePrueba`, que le pone una dirección distinta a cada prueba, así que
 * cada quien encuentra su propio correo por más lleno que esté el buzón.
 */

/**
 * Espera el correo más reciente dirigido a `email` y devuelve su código.
 *
 * Hace polling porque GoTrue envía el correo después de responder al navegador:
 * cuando la pantalla ya muestra el paso del código, el mensaje puede tardar
 * todavía unos cientos de milisegundos en llegar al buzón.
 */
export async function codigoPara(email: string, timeoutMs = 15_000): Promise<string> {
  const patron = new RegExp(`\\b\\d{${CODE_LENGTH}}\\b`);
  const limite = Date.now() + timeoutMs;

  while (Date.now() < limite) {
    const { messages } = await mailpit<MailpitList>(
      `/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=1`,
    );

    const ultimo = messages.at(0);
    if (ultimo) {
      /*
       * El cuerpo se pide aparte: el listado sólo trae el resumen. La plantilla
       * (`supabase/templates/magic_link.html`) imprime `{{ .Token }}` y ningún
       * otro número de seis dígitos, así que el primer match es el código.
       */
      const { Text, HTML } = await mailpit<{ Text: string; HTML: string }>(
        `/api/v1/message/${ultimo.ID}`,
      );
      const encontrado = patron.exec(Text) ?? patron.exec(HTML);
      if (encontrado) return encontrado[0];
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(
    `No llegó ningún correo con un código de ${CODE_LENGTH} dígitos para ${email} ` +
      `en ${timeoutMs} ms. Revisa el buzón en ${MAILPIT_URL}.`,
  );
}

/**
 * Un correo distinto por prueba.
 *
 * La cuenta se crea sola en el primer ingreso, así que un correo nuevo es una
 * cuenta nueva: dos pruebas nunca se ven los gastos entre ellas. El libro no
 * llega vacío —un trigger le siembra el mes estándar al crear la cuenta— pero sí
 * llega idéntico en cada corrida, que es lo que una aserción necesita.
 */
export function correoDePrueba(prefijo = "e2e"): string {
  const unico = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefijo}-${unico}@ejemplo.test`;
}
