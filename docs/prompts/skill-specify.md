Crea en este proyecto un skill de Claude Code llamado `specify` que implemente el método
**Requirements-First**: formalizar una feature en documentos revisables ANTES de escribir
código, con puertas de aprobación humana entre fases.

## PARÁMETROS (rellenar antes de ejecutar)

- **Stack del proyecto:** TypeScript + Next JS
- **Comandos de verificación:** `npm run typecheck` y `npm test`
- **Carpeta de specs:** `docs/specs/`
- **Skill previo (define la idea):** `brainstorming`
- **Idioma en que habla el usuario:** español

## Estructura de archivos a crear

```
.claude/skills/specify/
├── SKILL.md
├── assets/
│   ├── requirements-template.md
│   ├── design-template.md
    └── tasks-template.md
```

## SKILL.md — requisitos

### Frontmatter

YAML con `name: specify` y un `description` **largo y cargado de disparadores** (bloque
plegado `>-`, ~10 líneas). Debe contener, en este orden:
1. Qué produce: `requirements.md` (criterios de aceptación EARS) → `design.md`
   (arquitectura técnica) → `tasks.md` (lista TDD ordenada que además es el log de
   ejecución), **cada uno tras aprobación del usuario**.
2. Cuándo dispararse: "WHENEVER the user wants to define, spec, plan, or scope a new
   feature", con frases gatillo literales **en inglés y en el idioma del usuario**
   ("spec this out", "write requirements", "before we build", "escribir el spec",
   "definir la feature").
3. Un cierre explícito: dispara aunque el usuario no diga la palabra "spec", si está
   describiendo una feature que quiere formalizar antes de implementar.

### Cuerpo — secciones obligatorias

**1. Encabezado y tesis.** Explica el flujo Requirements-First y **por qué**: fijar el
comportamiento antes del diseño mantiene el diseño honesto — cada decisión técnica traza a
un requisito, en vez de que los requisitos se hagan ingeniería inversa para justificar lo
que se construyó. Aclara que el alcance son tres artefactos: los dos primeros definen *qué*
y *cómo*; el tercero descompone el diseño aprobado en tareas trazables y funciona como log
de ejecución.

**2. "Language — write the specs in English".** Regla explícita y contraintuitiva: los
documentos se escriben **enteros en inglés** (títulos, prosa, user stories, keywords EARS)
**aunque el usuario hable en otro idioma**. Justifícalo: los specs son artefactos de
ingeniería de larga vida y compartidos; un solo idioma los hace consistentes, buscables y
portables. Marca las dos excepciones: los **términos de dominio e identificadores** que dio
el usuario (nombres de categorías, campos, productos, datos de ejemplo) se citan tal cual,
porque traducir un identificador rompe la trazabilidad. Y deja claro que **sí se le habla al
usuario en su idioma** (preguntas, pedido de aprobación, resúmenes); solo los archivos van
en inglés.

**3. "Where the files go".** Una carpeta por feature, con fecha para que ordenen
cronológicamente y no colisionen:
`docs/specs/<YYYY-MM-DD>-<feature-slug>/` con los tres archivos dentro. Indica que
`<YYYY-MM-DD>` es la fecha de hoy — si no la sabe, que **pregunte o consulte el entorno en
vez de inventarla** — y que el slug es kebab-case corto, con dos ejemplos del dominio.

**4. "The workflow — and the approval gate".** Los documentos se producen en orden con una
**parada dura para aprobación** entre fases. Explica el porqué económico: los requisitos son
baratos de cambiar y las decisiones de diseño se acumulan encima, así que corregir el
comportamiento ahora cuesta mucho menos que después de construir un diseño —o una lista de
tareas— sobre el comportamiento equivocado.

Incluye un párrafo **"Coming from `/<skill previo>`?"**: cuando el skill previo ya produjo un
diseño *aprobado*, ese diseño es input resuelto — reutiliza su arquitectura, componentes,
flujo de datos, manejo de errores y decisiones de testing en vez de volver a interrogar al
usuario. El trabajo aquí es formalizarlo, no reabrir decisiones ya tomadas.

Luego las tres fases numeradas:

- **Fase 1 — Requirements** (pasos 1-3): entender lo suficiente para escribir comportamiento
  real; si la idea es vaga, hacer unas pocas preguntas afiladas primero (quién es el
  usuario, cuál es el disparador, qué es éxito, cuáles son los casos de fallo). **No
  inventar requisitos para llenar el silencio** — eso va a *Open questions*. Copiar
  `assets/requirements-template.md` a la carpeta y llenarlo en notación EARS. Cerrar con:
  **detente y pide revisión**, di explícitamente que el diseño viene después y que esperas
  visto bueno o cambios; **no crear `design.md` todavía**; iterar hasta aprobación.
- **Fase 2 — Design** (pasos 4-6): solo tras aprobación explícita, copiar
  `assets/design-template.md`. Cada componente, modelo de datos y ruta de error debe trazar
  a un criterio de aceptación numerado. Si el diseño destapa un hueco en los requisitos, se
  **vuelve a actualizar `requirements.md`** en vez de diseñar por encima del hueco en
  silencio. Presentar y **parar hasta aprobación** antes de descomponer en tareas.
- **Fase 3 — Tasks** (pasos 7-10): [ELIGE SEGÚN PARÁMETRO]
  - *Si hay skill de planeación:* `tasks.md` **no se escribe a mano aquí** — se delega en el
    skill `<planning-tasks>`, que converge la lista tarea por tarea contra el código real;
    una lista escrita a mano se salta exactamente esa auditoría. Aun así, el archivo
    resultante debe cumplir el contrato de este skill.
  - *Si no lo hay:* copiar `assets/tasks-template.md` y llenarlo aquí mismo.

  En ambos casos, fija el **contrato del `tasks.md`**: cada tarea dimensionada a **un ciclo
  TDD red→green→verify**, **trazada** a componentes del diseño y criterios de requisitos, y
  una tabla **Requirements coverage** donde *todo* criterio de aceptación mapea a al menos
  una tarea — un criterio sin tarea es un hueco que se cierra antes de implementar.
  Añade la regla clave: **Decision log y Outcome nacen vacíos**; se llenan *durante* la
  ejecución, y eso es lo que convierte el archivo en un log y no en un checklist.
  Cierra con: si requisitos o diseño cambian después, se **re-converge** `tasks.md` en vez
  de parchearlo a mano, y mantén los tres documentos sincronizados (si la implementación
  demuestra que el diseño estaba mal, se actualiza `design.md` y se anota en el Decision log
  de la tarea afectada).

**5. "EARS notation for acceptance criteria".** Explica que EARS hace cada criterio
inequívoco y **testeable** — cada SHALL es una verificación contra la que se puede escribir
un test — y que se usa el patrón que corresponda, sin forzar todo a WHEN/THEN. Incluye la
tabla completa de 5 patrones (Pattern | Template | Use for):

| Patrón | Plantilla | Para |
|---|---|---|
| Ubiquitous | THE SYSTEM SHALL `<behavior>` | Invariante que siempre se cumple |
| Event-driven | WHEN `<trigger>` THE SYSTEM SHALL `<behavior>` | Respuesta a un evento/acción |
| State-driven | WHILE `<state>` THE SYSTEM SHALL `<behavior>` | Comportamiento sostenido durante un estado |
| Unwanted / error | IF `<condition>` THEN THE SYSTEM SHALL `<response>` | Manejo de errores, edge cases |
| Optional | WHERE `<feature is present>` THE SYSTEM SHALL `<behavior>` | Feature opcional/configurable |

Y las cuatro reglas de calidad: **un comportamiento por criterio** (partir "valida y guarda
y notifica" en tres); **solo resultados observables** (qué hace el sistema, no cómo está
implementado por dentro); **numerarlo todo** (Requirement 1 → 1.1, 1.2…) para que diseño,
tests y revisiones citen criterios exactos; **cubrir el camino infeliz** (por cada WHEN,
preguntarse qué pasa IF el input es malo, falta o está fuera de rango).

Termina con **un ejemplo trabajado**: una frase de input del dominio del proyecto y, en
bloque de código, el output completo — `### Requirement N — <título>`, la user story y 3
criterios numerados que incluyan al menos un `IF … THEN`.

**6. "Templates".** Lista los tres assets con una línea cada uno e instruye: **cópialos** a
la carpeta de la feature en vez de escribir desde cero, borra los placeholders `<...>` al
llenar cada sección, y elimina secciones solo si genuinamente no aplican — **no para ahorrar
esfuerzo**: una sección "Error handling" vacía normalmente significa que nadie pensó el
camino infeliz.

## assets/requirements-template.md

Encabezado `# Requirements — <Feature Name>` con **Status / Date / Author**, y secciones:
`Introduction` (problema, para quién, valor; enfocado en negocio — el "cómo" técnico va en
design.md), `Glossary` (opcional, borrable), `Requirements` (bloques `### Requirement N —
<título>` con **User story** `As a <role>, I want <capability>, so that <benefit>` y
**Acceptance criteria** numerados; el Requirement 1 de ejemplo debe mostrar **los 5 patrones
EARS**, el 2 solo dos), `Out of scope` (qué NO entra, para frenar scope creep) y
`Open questions`. Todo el texto guía va entre `<...>`.

## assets/design-template.md

Encabezado con **Status / Date / Requirements: ./requirements.md**, y secciones:
`Overview`, `Architecture` (con hueco para diagrama Mermaid/ASCII), `Components and
interfaces` (por componente: **Responsibility**, **Interface** con firmas concretas en
bloque de código del lenguaje del proyecto, **Depends on**), `Data models` (tipos/esquema +
reglas de validación e invariantes), `Data flow` (uno o dos escenarios de punta a punta,
mostrando cómo los criterios de aceptación se satisfacen con pasos concretos),
`Error handling` (**tabla** `Condition | Handling | Related requirement` que mapea a los
criterios IF/THEN), `Testing strategy` (Unit / Edge cases / Integration, con cada criterio
de aceptación trazable a al menos un test) y `Design decisions and trade-offs` (formato
**Decision — Rationale — Alternative considered**, para dejar el razonamiento, no solo el
resultado).

## assets/tasks-template.md

Encabezado con **Status / Date / Requirements / Design**, y secciones: `Purpose` (explica
que el archivo es lista ordenada *y* log de ejecución), `How to use this document` (una
tarea a la vez de arriba abajo, no empezar una sin sus dependencias `Done`; TDD; anexar al
Decision log toda elección no obvia, hallazgo o desviación del diseño; si el diseño resulta
incompleto, actualizar `design.md` y anotarlo), `Status legend` (tabla con `[ ]` pendiente,
`[~]` en progreso, `[x]` hecho y verificado, `[!]` bloqueado), `Task overview` (checklist
plano **T1/T2/T3** con títulos idénticos a las entradas detalladas), `Requirements coverage`
(tabla inversa criterio → tarea(s), descrita como el chequeo de completitud) y `Tasks` con
entradas detalladas.

Cada tarea detallada lleva: `### T<N> — <título>`, **Status**, **Traces to** (criterios +
componentes del diseño), **Depends on**, **Objective** (una frase: qué capacidad existe
cuando la tarea termina), **TDD plan** de 3 pasos numerados —
`1. Test (red)` / `2. Implement (green)` / `3. Verify` (con los comandos de verificación del
proyecto) —, **Decision log** (append-only, entradas nuevas al final, formato
`<YYYY-MM-DD> — <decisión o hallazgo> — <por qué>`) y **Outcome** (se llena al cerrar: qué
se entregó, tests añadidos, pendientes). Cierra el archivo con `Open items`.

## evals/evals.json

Tres casos de evaluación. Objeto raíz `{"skill_name": "specify", "evals": [...]}`; cada
caso con `id`, `name` (kebab-case), `prompt`, `expected_output`, `files: []` y la lista de
aserciones. **Escribe los `prompt` en el idioma del usuario y sobre el dominio real de
este proyecto** (no copies ejemplos de otro proyecto). Los tres casos deben probar cosas
distintas:

- **Caso 0** — feature clara: valida el flujo completo y la puerta de aprobación.
- **Caso 1** — feature clara sobre otra parte del dominio: valida requirements-first
  (happy path + error path).
- **Caso 2** — feature **deliberadamente vaga**: valida que el skill **haga preguntas
  afiladas antes** de comprometerse y que use *Out of scope* / *Open questions*.

Aserciones base (compartidas por los casos 0 y 1, y en su mayoría por el 2):
1. `requirements.md` se crea dentro de una carpeta con fecha `docs/specs/<fecha>-<slug>/`
2. Los criterios usan notación EARS (WHEN / IF / THEN / WHILE / WHERE con SHALL)
3. Requisitos y criterios numerados y trazables (Requirement 1, criterios 1.1, 1.2)
4. Contiene user stories en la forma `As a <role>, I want <capability>, so that <benefit>`
5. Incluye al menos un criterio de error (`IF … THEN THE SYSTEM SHALL …`)
6. El contenido de requirements está escrito en inglés
7. Respetó la puerta de aprobación: paró tras requirements antes de crear `design.md`
8. `design.md` (tras aprobación simulada) tiene arquitectura, modelos de datos, manejo de
   errores y estrategia de testing, trazando a los números de requisito

Para el caso 2, sustituye las dos últimas por: "hizo preguntas aclaratorias afiladas antes
de comprometerse con los requisitos" y "usó las secciones Out of scope y/u Open questions".

**No hardcodees una fecha concreta** en las aserciones — usa `<fecha>` o el placeholder de
fecha de hoy.

## Reglas al construirlo

- Todo el contenido del skill y de las plantillas va **en inglés**; solo los `prompt` de los
  evals van en el idioma del usuario.
- Nada de scripts ni dependencias: el skill es puro markdown + un JSON.
- Cada regla que impongas debe venir con su **porqué** en una frase. El valor de este skill
  está en que explica el motivo de cada restricción, no solo la restricción.
- Al terminar, actualiza el `CLAUDE.md` del proyecto con una línea del flujo de trabajo que
  ubique a `/specify` entre su skill previo y el siguiente.