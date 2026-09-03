---
name: brainstorming
description: Conduce la fase 1 (Brainstorming) de este repositorio — carga el contexto del proyecto, hace rondas de preguntas para cerrar ambigüedades y propone 2-3 enfoques con una recomendación. Usar cuando el usuario abra un tema en modo exploratorio, pida ideas o alternativas, plantee una feature nueva sin decisión de producto tomada, o invoque /brainstorming. No usar cuando la decisión ya está tomada y lo que falta es planear o implementar.
---

# Brainstorming

Explorar el problema **antes** que la solución. La salida de esta fase es una
decisión de producto o de enfoque, con su razón — no código, no plan de
archivos.

Esta skill tiene tres pasos y se ejecutan en orden: cargar contexto, preguntar
en rondas, proponer enfoques.

## Paso 1 — Rondas de preguntas

Preguntar con `AskUserQuestion`, no en prosa suelta. Reglas:

- Máximo 4 preguntas por ronda; en general 2-3 son suficientes.
- Cada opción debe describir su consecuencia, no solo nombrarse. El usuario
  tiene que poder elegir por el trade-off, no por adivinanza.
- Si hay una opción claramente más sensata, ponerla primera y marcarla
  `(Recomendada)`.
- Varias rondas: cada ronda se construye sobre las respuestas de la anterior.
  Normalmente 2-3 rondas.
  - **Ronda 1** — el problema: a quién le duele, en qué momento, qué pasa hoy
    sin la feature, qué queda explícitamente fuera del alcance.
  - **Ronda 2** — las restricciones: qué debe pasar en el caso raro, qué se
    sacrifica si hay conflicto, cuál es el estado vacío, qué tan reversible
    debe ser la decisión.
  - **Ronda 3** (si hace falta) — cerrar la ambigüedad que todavía cambia el
    enfoque.
- **Parar de preguntar** cuando la ambigüedad que queda ya no cambia cuál
  enfoque se elige. Ahí se pasa al Paso 2 aunque queden dudas menores: esas se
  anotan como supuestos.
- No preguntar detalles que le tocan a la fase de planeación (nombres de
  archivos, librerías, forma exacta de un componente) a menos que la respuesta
  cambie la decisión de producto.

## Paso 2 — Proponer 2-3 enfoques

Los enfoques tienen que ser **genuinamente distintos**, no el mismo camino en
tres tamaños. Para cada uno:

- **Nombre corto** y una frase de qué es.
- **Cómo se ve para el usuario** — el flujo concreto, en español de producto.
- **Qué implica** — lo que hay que construir o cambiar, a grandes rasgos.
- **A favor / En contra** — el trade-off real, incluido el costo.
- **Qué deja por fuera.**

Después de los enfoques, un bloque de cierre:

```
Propuesta: <enfoque elegido>
Razón: <por qué gana este, contra los otros>
Supuestos: <lo que se está dando por cierto sin confirmar>
Queda para planeación: <preguntas abiertas — stack, datos, persistencia>
```

Cerrar preguntándole al usuario si va con la propuesta, con qué ajuste, o si
quiere otra vuelta de exploración.

## Reglas de la fase

- **No se escribe código de implementación.** Se permite esbozar la forma de
  un dato solo si es lo que distingue un enfoque de otro.
- **No se tocan archivos del proyecto** durante el brainstorming. Si el usuario
  pide dejar la decisión registrada, escribirla — ese es el único caso.
- Si el usuario salta a "hágalo ya" con la decisión sin tomar, decirlo en una
  línea y proponer cerrar el brainstorming primero; si insiste, pasar a
  planeación con los supuestos escritos.
- Idioma: producto, dominio y copy en español; identificadores de código en
  inglés.
- Mobile-first (390px) y los estados vacíos son parte del alcance, no un
  extra — considerarlos al comparar enfoques.
- Al terminar, la siguiente fase es **Planeación**, no implementación.
