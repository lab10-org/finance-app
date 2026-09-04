# Finance App

Finanzas personales enfocadas en el registro y la lectura de **gastos** del día
a día. La promesa es la fricción mínima: registrar un gasto toma menos de 10
segundos, y un vistazo basta para entender en qué se te fue el mes.

Producto en español (Colombia). Montos en pesos colombianos con separador de
miles por punto (`$1.284.500`).

## Arrancar

```bash
npm install
npm run dev
```

La app corre en `http://127.0.0.1:3000`, pero **no vas a poder entrar hasta
levantar el stack local de Supabase**: la app está detrás de una cuenta.

## Stack local de Supabase

Toda la autenticación corre en tu máquina. No hay proyecto en la nube, no hay
servicio de correo externo y no se envía un solo correo real.

### Requisitos

- **Docker corriendo.** `supabase start` levanta contenedores; si el daemon
  está apagado, falla de una.
- **Supabase CLI.** `brew install supabase/tap/supabase` en macOS.

### Comandos

```bash
supabase start      # levanta el stack (la primera vez descarga varios GB)
supabase status     # imprime la API URL y las llaves
supabase stop       # lo apaga y conserva los datos
supabase db reset   # lo devuelve a cero
```

### Variables de entorno

```bash
cp .env.example .env.local
```

`.env.local` está en `.gitignore`. La URL ya viene puesta; la llave pública
(`anon key`) la imprime `supabase status`, cópiala en
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Si falta cualquiera de las dos, la app falla al
primer request nombrando la variable que falta, en vez de morir después como un
error de autenticación sin explicación.

### Los correos no salen de tu máquina

El stack incluye **Mailpit**, que captura todo lo que la app intente enviar.
Ábrelo en **http://127.0.0.1:54324** y ahí vas a ver el correo con el código de
seis dígitos.

El flujo completo de entrada, entonces, es:

1. `supabase start` y `npm run dev`
2. Abre `http://127.0.0.1:3000` — te manda a `/entrada`
3. Escribe cualquier correo y pide el código
4. Léelo en Mailpit y escríbelo

La cuenta se crea sola en el primer ingreso: no hay pantalla de registro
aparte.

### Por qué un código y no un enlace

Email OTP y Magic Link son el mismo mecanismo en Supabase; sólo cambia el
correo. Usamos un código porque la app es mobile-first e instalable: un enlace
tocado dentro de Gmail abre en el navegador embebido de Gmail, la sesión
aterriza ahí, y el usuario sigue deslogueado donde empezó. El código se escribe
en la pestaña que ya está abierta.

La plantilla que imprime el código está en
`supabase/templates/magic_link.html`, y los números que la pantalla dice en voz
alta (seis dígitos, diez minutos de vigencia, un código por minuto) viven en
`supabase/config.toml` y en `lib/auth/config.ts`, con una prueba que compara los
dos.

## Migraciones

Todo el esquema —tablas, índices, funciones y reglas de acceso— vive en
`supabase/migrations/`, en archivos versionados con un prefijo de fecha que
define su orden. **Nada se cambia nunca desde el dashboard**: un cambio hecho a
clics es un cambio que el siguiente clon no recibe, y que nadie puede revisar en
un diff.

```bash
supabase db reset                 # borra la base local y reaplica todo desde cero
supabase migration new <nombre>   # crea el archivo de una migración nueva
supabase test db                  # corre las pruebas pgTAP de supabase/tests/database
```

`supabase db reset` es la comprobación de que las migraciones bastan: si una base
recién borrada queda utilizable sin ningún paso manual, el esquema está completo.

> **`db reset` no recarga la configuración.** Reaplica las migraciones, pero deja
> intacto lo que el contenedor de auth cargó al arrancar: `config.toml` y las
> plantillas de `supabase/templates/`. Si cambiaste una de esas dos cosas —o si
> arrancaste el stack desde otro directorio, por ejemplo un worktree— hay que
> reiniciarlo:
>
> ```bash
> supabase stop && supabase start
> ```
>
> El síntoma es desconcertante: el correo de entrada llega con un enlace en vez
> del código de seis dígitos, porque GoTrue está sirviendo su plantilla por
> defecto y no la nuestra. Al hacer clic, el enlace consume el token y devuelve
> la sesión en el fragmento de la URL, que esta app no lee —su entrada es de dos
> pasos—, así que uno vuelve a "la entrada" sin ninguna explicación.

### Las pruebas de la base

`npm test` corre vitest, que no ejecuta SQL. Lo que puede comprobar es el texto
de las migraciones: que existan, que estén ordenadas y que digan lo que dicen.

El comportamiento del SQL se prueba con **pgTAP**, en
`supabase/tests/database/*.test.sql`, y ahí es donde están las garantías que solo
una base de datos real puede dar: que cada cuenta ve únicamente sus gastos, que
un intento contra la fila de otra cuenta no toca nada, que los montos suman
exacto, y que el `uuid_generate_v7()` que usamos ordena de verdad. Hay que tener
Docker corriendo.

```bash
supabase db reset && supabase test db
```

### La pasada contra el stack real

`scripts/manual-pass.mjs` crea dos cuentas por la API real, con la llave anon
real, y comprueba lo que ni vitest ni pgTAP pueden: que un cliente con sesión ve
su libro y nada más. Necesita el stack arriba.

```bash
supabase db reset && node scripts/manual-pass.mjs
```

No corre con `npm test` a propósito: depende de Docker y de una base limpia, y un
test que a veces no puede correr es un test que la gente aprende a ignorar.

### Las pruebas end-to-end

Playwright maneja un Chromium de verdad contra la app corriendo y contra el
stack local. Es el único nivel donde existen el proxy, las cookies de sesión y
GoTrue, así que es el único que puede comprobar que la puerta está cerrada de
verdad. Lo que ya prueba vitest a solas no se repite acá.

```bash
npx playwright install chromium   # una sola vez, baja el navegador
npm run test:e2e                  # la suite completa
npm run test:e2e:ui               # el modo interactivo, para escribir pruebas
npm run test:e2e:report           # el reporte HTML de la última corrida
```

Necesita lo mismo que la app: el stack arriba (`supabase start`) y `.env.local`
lleno. El servidor de desarrollo lo levanta Playwright solo; si ya tienes uno en
el 3000, lo reusa.

Las pruebas entran **leyendo el código del correo en Mailpit**, igual que una
persona: `e2e/support/mailpit.ts` consulta su API y saca los seis dígitos. No
hay atajo con la llave de servicio, y por eso lo que la suite prueba es el flujo
que la gente realmente usa.

Cada prueba se inventa su propia dirección de correo, así que estrena cuenta y
libro vacío. De ahí salen dos reglas que conviene no romper: **nunca vaciar el
buzón de Mailpit** —sólo se puede vaciar entero, y en paralelo una prueba se
llevaría por delante los correos de las otras— y **nunca reusar una dirección
fija**, que volvería a una prueba dependiente de lo que dejó la anterior.

Los archivos son `e2e/*.spec.ts`; vitest sólo mira los `__tests__/*.test.ts`, así
que los dos corredores no se pisan.

### El esquema, en una frase

Una sola tabla, `expenses`, con `user_id` y RLS de dueño único. Las categorías
son texto sin restricción: los cinco valores conocidos los valida el código, no
la base. No hay tabla de categorías, ni de meses, ni totales guardados — todas
las cifras del encabezado se derivan de las filas con funciones puras, así que
ninguna puede quedar desactualizada.

## Comandos del proyecto

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run test:e2e   # playwright test
```

## Despliegue en Cloudflare

La app corre en **Cloudflare Workers** con
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare), que es la
integración propia de Cloudflare para Next.

Desplegada en **https://finance-app.finance-app.workers.dev**.

No hay versión estática posible: `proxy.ts` refresca la sesión de Supabase en
cada request, así que siempre hay servidor. Por eso Workers y no Pages con
`output: export`.

```bash
npm run cf:build     # next build + adapta la salida a Workers
npm run cf:preview   # lo anterior + wrangler dev (el Worker real, local)
npm run cf:deploy    # lo anterior + publica
npm run cf:typegen   # regenera los tipos de los bindings
```

`cf:preview` es el paso que vale la pena no saltarse: levanta el mismo workerd
que corre en producción, así que un fallo de compatibilidad aparece en tu
máquina y no después del despliegue.

### Variables de entorno

```bash
cp .env.production.example .env.production.local
```

Los dos valores salen del proyecto alojado en supabase.com (Project Settings →
Data API y → API Keys), **no** de `supabase status`.

Esto no es opcional ni cosmético. `.env.local` —el del stack local— también se
lee cuando `NODE_ENV` es `production`, y el orden de Next es:

```
process.env → .env.production.local → .env.local → .env.production → .env
```

Sin `.env.production.local`, el build se llevaría `http://127.0.0.1:54321`
horneado dentro del bundle del navegador y la app desplegada intentaría
autenticar contra un puerto de tu portátil.

Son variables `NEXT_PUBLIC_*`: se sustituyen **en tiempo de build**. Ponerlas
como `vars` o `secrets` de Wrangler no sirve de nada — tienen que existir en el
ambiente que corre `npm run cf:build`.

### El proyecto alojado de Supabase

El stack local y el proyecto en la nube son dos bases distintas. Lo que está en
`supabase/` no llega solo:

- **Las migraciones.** `supabase link --project-ref <ref>` y luego
  `supabase db push`. Sin esto la cuenta entra pero el libro revienta: la tabla
  `expenses` no existe.
- **La configuración de auth.** `supabase/config.toml` es **sólo local**;
  `db push` no la sube. En el dashboard hay que repetir a mano el largo del
  código (6), su vigencia (600s), `max_frequency` (60s) y el `site_url`, que
  pasa a ser la URL del Worker.
- **La plantilla del correo.** `supabase/templates/magic_link.html` es la que
  imprime el código de seis dígitos. La plantilla por defecto del dashboard
  manda un **enlace**, que es justamente lo que esta app decidió no usar
  (ver "Por qué un código y no un enlace"). Hay que pegarla en
  Authentication → Email Templates.
- **El correo saliente.** El SMTP que trae un proyecto de Supabase por defecto
  está limitado a unos pocos mensajes por hora y sólo a direcciones del equipo.
  Para uso real hay que configurar un SMTP propio; si no, el código no llega.

### Middleware en Node.js

El build imprime este aviso, y es cierto:

```
Node.js middleware support is experimental in cloudflare
```

`proxy.ts` corre en el runtime de Node.js y Next 16 no permite configurarlo de
otra forma. Funciona —la puerta de la sesión redirige bien sobre workerd— pero
es la pieza a mirar primero si algo se rompe tras actualizar el adaptador.

## Documentación

Cada feature se especifica antes de construirse, en
`docs/specs/<fecha>-<slug>/`: `requirements.md` (criterios de aceptación en
EARS), `design.md` (arquitectura) y `tasks.md` (las tareas y su bitácora de
ejecución). El flujo de trabajo completo está en `CLAUDE.md`.
