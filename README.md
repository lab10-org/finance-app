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
```

## Documentación

Cada feature se especifica antes de construirse, en
`docs/specs/<fecha>-<slug>/`: `requirements.md` (criterios de aceptación en
EARS), `design.md` (arquitectura) y `tasks.md` (las tareas y su bitácora de
ejecución). El flujo de trabajo completo está en `CLAUDE.md`.
