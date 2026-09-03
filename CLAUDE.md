# CLAUDE.md

Guía para Claude Code al trabajar en este repositorio.

## Qué es este proyecto

**Finance App** — una aplicación de **finanzas personales** enfocada en el
registro y la lectura de **gastos** del día a día.

La propuesta de valor es la fricción mínima: registrar un gasto debe tomar
menos de 10 segundos, y el usuario debe entender en qué se le fue el mes con
un solo vistazo.

Producto en español (Colombia). Montos en pesos colombianos con separador de
miles por punto (`$1.284.500`).

## Estado actual

El repositorio **todavía no tiene código**. Lo único que existe son los
mockups de diseño:

- `docs/mockups/v1.pen` — archivo de pen.dev (se lee/edita **solo** con las
  herramientas `mcp__pencil__*`, nunca con Read/Grep).

No hay stack definido (framework, backend, persistencia, auth). Esa decisión
es parte de la fase de planeación, no se asume por defecto.

### Tokens de diseño (definidos en el `.pen`)

```
bg #F4F4F2   surface #FFFFFF   border #E7E7E2   divider #EDEDE9
text-primary #15171B   text-secondary #7C808A   text-tertiary #A2A6AE
accent #2A4BA0   accent-soft #EBEFF8   icon-bg #F0F0EC
accent-2 #4E6DB4   accent-3 #7A90C9   accent-4 #A9B6DC   accent-5 #D7DDEE
font-ui "Inter"   font-num "IBM Plex Mono"
screen-pad 24    radius-card 16
```

Los números y montos van en `font-num`; el resto de la UI en `font-ui`.
Cuando se implemente el tema, estos tokens son la fuente de verdad — no
inventar colores nuevos ni hardcodear hex sueltos.

## Flujo de trabajo

El trabajo en este proyecto sigue **tres fases, en orden**. No se salta a la
siguiente sin haber cerrado la anterior.

### 1. Brainstorming

Explorar el problema antes que la solución. Salida esperada: una decisión de
producto o de enfoque, con su razón.

Esta fase la conduce la skill **`/brainstorming`**.
Invocarla cuando el usuario abra un tema en modo exploratorio, pida ideas o
alternativas, o plantee algo nuevo sin decisión de producto tomada. No
improvisar el brainstorming por fuera de la skill.

### 2. Planeación

Convertir la decisión en un plan concreto y revisable antes de tocar
archivos.

- Salida esperada: pasos, archivos a crear o modificar, contratos de datos,
  y los riesgos o supuestos.
- Aquí se cierran las preguntas abiertas (stack, modelo de datos,
  persistencia) que la fase anterior dejó planteadas.
- El plan se confirma con el usuario antes de ejecutarlo.

### 3. Implementación

Ejecutar el plan aprobado.

- Seguir el alcance acordado: ni menos, ni de más.
- Si en medio de la implementación aparece una decisión de producto que no
  estaba en el plan, **parar y volver a la fase que corresponda** en lugar
  de resolverla por cuenta propia.
- Reportar al final qué quedó hecho y qué quedó pendiente, sin adornos.

## Convenciones

- **Idioma**: la UI, el copy y los nombres del dominio van en español. El
  código (identificadores, comentarios técnicos) en inglés.
- **Mobile-first**: el diseño base es 390px de ancho. Cualquier vista de
  escritorio es una extensión posterior, no el punto de partida.
- Los estados vacíos se implementan junto con la vista, no después.
