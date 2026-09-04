---
name: verify-implementation
description: >-
  Cierra la fase 3 (Implementación) verificando la feature en el navegador de
  verdad. Explora la feature con el subagente `plan-e2e`, escribe como máximo 3
  pruebas de Playwright a partir de su plan, las ejecuta, y devuelve un veredicto
  de cierre con los hallazgos clasificados. Usar cuando la implementación de un
  spec ya terminó y falta comprobar que funciona antes de darla por cerrada.
  Disparadores en español: "ya terminé la implementación", "verifica la
  implementación", "cerremos la feature", "probemos que esto funciona de verdad",
  "/verify-implementation". English triggers: "verify the implementation", "the
  feature is done, check it", "close out the spec". No usar antes de terminar de
  implementar, ni como reemplazo de la suite unitaria.
---

# Verify Implementation — el cierre de la fase 3

La implementación termina cuando alguien **usó la feature y funcionó**, no
cuando el último test unitario pasó. Esta skill es ese paso: explora la feature
en un navegador real, destila el recorrido en un puñado de pruebas de Playwright,
las corre, y entrega un veredicto de cierre.

```
Implementación terminada
        ↓
1. plan-e2e      →  explora en el navegador, devuelve ≤3 pruebas
        ↓         ▲ el plan se revisa antes de escribir código
2. Playwright    →  se escriben las pruebas y se ejecutan
        ↓
3. Retroalimentación → hallazgos clasificados + veredicto de cierre
```

**Le hablas al usuario en español.** El código sigue las convenciones de idioma
del proyecto, que están en su guía de agentes — no las supongas, léelas.

## Cuándo NO usarla

- **Antes de terminar de implementar.** Verificar una feature a medias produce
  fallas que sólo dicen "todavía no está", que es ruido caro.
- **Como reemplazo de la suite unitaria.** Esto va *encima* de ella, nunca en su
  lugar. Con la suite unitaria en rojo, las fallas e2e son ilegibles.
- **Para features sin spec.** Sin criterios escritos no hay contra qué verificar,
  y "parece que funciona" no es un veredicto.

## Fase 0 — Las precondiciones (no son opcionales)

Nada de esto se supone: **se averigua leyendo el repo** — la guía de agentes, el
README, `package.json`, la config de Playwright. Si algo falla, **para y dilo**:
seguir produce fallas que no significan nada.

1. **Encuentra el spec** — el que el usuario nombró, o el más reciente. Lee sus
   criterios y su lista de tareas completos.
2. **La implementación está terminada.** Ninguna tarea sigue abierta. Si quedan,
   di cuáles y para.
3. **Las compuertas baratas primero:** los scripts de tipos y de pruebas
   unitarias que declare `package.json`. Si alguna está roja, se arregla antes de
   tocar el navegador — un e2e que falla sobre una suite rota no dice nada nuevo.
4. **Los servicios que la app necesita están arriba.** El README dice cuáles son
   y cómo se levantan; compruébalo en vez de asumirlo. Lo que le toque al usuario
   levantar, se lo pides: es su máquina.
5. **El navegador de Playwright está instalado** (`npx playwright install` es
   idempotente y barato; córrelo si hay duda).
6. **Levanta la app y déjala corriendo.** `plan-e2e` la necesita, y la config de
   Playwright normalmente reusa el servidor que ya esté en ese puerto.

## Fase 1 — Explorar, con `plan-e2e`

Invoca el subagente **`plan-e2e`** con la **ruta absoluta del folder del spec** y
la **URL base** donde dejaste la app corriendo. No le parafrasees los criterios:
los lee él, y una paráfrasis compite con el documento.

**Por qué un subagente y no tú.** Dos razones, y las dos importan. Corre en
contexto propio, así que la exploración —que es un montón de screenshots y
volcados de DOM— no entierra la conversación. Y **no implementó la feature**: no
sabe qué era difícil, ni dónde el implementador ya sabe que funciona, así que la
usa como quien llega de afuera. Esa ignorancia es justo lo que hace que encuentre
lo que la implementación olvidó.

Cuando vuelva, **revisa el plan antes de escribir una línea de código**. Tres
cosas lo devuelven al subagente:

- una prueba que la suite unitaria ya cubre — no gana su costo;
- una aserción que ninguna falla plausible rompería ("la página carga");
- un selector inventado en vez de observado.

Sus **Hallazgos de la exploración** no son decoración: son el producto más
valioso de la fase. Léelos antes que el plan.

## Fase 2 — Escribir las pruebas y correrlas

Un archivo por feature, con el plan resumido en el comentario de cabecera — ahí
queda el registro, sin inventar un documento nuevo en el folder del spec. Sigue
la convención de nombres y ubicación que ya tengan las pruebas e2e existentes.

**Reusa los helpers que ya existen** en vez de escribir unos paralelos: lo que
ya resuelven —entrar, aislar una prueba de otra, llegar a un estado— es
conocimiento ganado, y duplicarlo es como se empiezan a contradecir dos suites.
Y respeta estas reglas, que son las que separan una suite e2e útil de una que la
gente aprende a ignorar:

1. **Cada prueba se trae su propia identidad y sus propios datos.** Nada de una
   cuenta compartida ni de un registro fijo: dos pruebas que se tocan fallan por
   turnos y nadie sabe cuál mintió.
2. **Nunca limpies estado compartido para acomodar tu prueba.** Corren en
   paralelo; lo que borres se lo llevas a las demás, que fallarán diciendo que
   nunca les llegó lo suyo. Aíslate hacia adelante, no hacia atrás.
3. **No supongas el estado inicial: averígualo.** Una sesión nueva no siempre
   nace vacía. Si el arranque es determinista, una aserción puede citar sus
   cifras; y si el estado que necesitas no se alcanza sólo entrando, la prueba
   hay que plantearla distinto.
4. **Espera a que la app esté viva antes de interactuar.** Una app renderizada en
   servidor está en pantalla antes de que su JavaScript la tome; lo que escribas
   antes se descarta y el clic siguiente cae en un control muerto. Espera una
   señal real de que ya está interactiva, nunca un tiempo fijo.
5. **Selectores por rol y nombre accesible**, con el copy verbatim. Nunca por
   clase de CSS: cambian entre builds y la prueba se cae sin que nada se rompa.

Corre la suite. Si algo falla, **el reporte y la traza ya tienen la respuesta**:
Playwright guarda el snapshot de la página en el momento exacto de la falla.
Léelo antes de suponer.

**Máximo dos rondas de arreglo antes de reportar.** Si a la tercera sigue rojo,
eso *es* el hallazgo: repórtalo con lo que sabes en vez de seguir dando vueltas.

## Fase 3 — Retroalimentación y cierre

Cada falla —y cada hallazgo de la exploración— se clasifica en exactamente una
de estas cuatro. La clasificación es el trabajo; el resto es transcribir.

| Clase | Qué es | Qué haces |
|---|---|---|
| **Defecto de implementación** | El código no cumple un criterio aprobado | Arreglarlo: sigue siendo la fase 3 |
| **Hueco en el spec** | Un comportamiento que nadie decidió | **Parar.** Volver a la fase que corresponda con el usuario |
| **Prueba mal escrita** | El criterio se cumple; la prueba mintió | Arreglar la prueba, y decirlo |
| **Infraestructura** | Un servicio caído, un límite, un flake | Volver a correr; no "arreglar" nada |

Dos reglas que sostienen todo lo demás:

- **Nunca debilitar una aserción para que pase.** Es la forma más común de
  convertir esta skill en teatro: la suite queda verde y no comprueba nada. Si
  una aserción estaba mal planteada, se cambia explicando por qué, en voz alta.
- **Un hueco en el spec no lo decides tú.** Si aparece una decisión de producto
  que no estaba en el plan, se para y se vuelve a la fase que corresponda.
  Preséntale al usuario el hueco y la lectura más razonable; la decisión es suya.

Después, **cierra el registro** en los documentos del spec: qué quedó entregado
en las tareas afectadas, y qué queda pendiente. Una lista de tareas que se dice
completa sobre una feature que falló es peor que una vacía, porque se le cree.

### El veredicto

Termina con uno de estos tres, sin adornos:

- **Cerrada** — las pruebas pasan y no hay hallazgos abiertos.
- **Cerrada con pendientes** — pasa, pero quedan hallazgos anotados que no
  bloquean. Dilos.
- **No cerrada** — hay un defecto o un hueco sin resolver. Di cuál, de qué clase
  es, y cuál es el siguiente paso concreto.

Y un resumen corto en español: qué se probó, qué encontró, qué quedó pendiente.
El usuario necesita decidir si suelta la feature, no sentirse bien.

## Lo que esta skill no es

- **No es una suite de regresión.** Tres pruebas por feature, como mucho. Lo que
  la suite unitaria puede probar sola, se prueba ahí: es más rápido, señala la
  línea exacta y no depende de que haya servicios arriba.
- **No es una excusa para rediseñar.** Si la exploración sugiere una feature
  mejor, eso es material para la fase de brainstorming, no para este cierre.
- **No decide producto.** Todo lo que los criterios no resolvieron sale como
  hallazgo, nunca como una decisión tomada de paso.
