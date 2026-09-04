import type { AuthFailure } from "@/lib/auth/errors";

/*
 * Deliberately not RFC 5322. The only job here is to avoid a pointless round
 * trip for something that is obviously not an address (2.3); the authority on
 * whether an address exists is the code that either arrives or does not.
 */
const SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

/** `null` when the address is worth sending. */
export function validateEmail(raw: string): AuthFailure | null {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "empty-email" };
  return SHAPE.test(trimmed) ? null : { kind: "invalid-email" };
}
