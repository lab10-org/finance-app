export const ENTRADA_PATH = "/entrada";
export const LIBRO_PATH = "/";

export type RouteDecision =
  | { kind: "continue" }
  | { kind: "redirect"; to: string };

/**
 * Which screen a request is entitled to.
 *
 * A pure function of a path and a boolean, deliberately: this is the rule that
 * makes 4.1 and 4.2 true, and it is worth being able to test it exhaustively
 * rather than through a proxy that needs a running auth service.
 */
export function decideRoute(input: {
  pathname: string;
  hasSession: boolean;
}): RouteDecision {
  const { pathname, hasSession } = input;
  const isEntrada = pathname === ENTRADA_PATH;

  // 4.1: without a session there is exactly one reachable screen.
  if (!hasSession) {
    return isEntrada ? { kind: "continue" } : { kind: "redirect", to: ENTRADA_PATH };
  }

  // 4.3: with a session, "la entrada" must not even flash.
  if (isEntrada) return { kind: "redirect", to: LIBRO_PATH };

  return { kind: "continue" };
}
