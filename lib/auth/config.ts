/*
 * The numbers "la entrada" says out loud.
 *
 * Each one has a twin in `supabase/config.toml`, and the screen quotes it to
 * the user — "un código de 6 dígitos", "espera 60 segundos". If the two drift,
 * the screen states a rule the server does not enforce, so
 * `lib/auth/__tests__/config.test.ts` parses the TOML and asserts they match.
 */

/** `[auth.email] otp_length` in supabase/config.toml. */
export const CODE_LENGTH = 6;

/** `[auth.email] otp_expiry`, in seconds. How long "el código" stays valid. */
export const CODE_TTL_SECONDS = 600;

/** `[auth.email] max_frequency`, in seconds. The cooldown between sends. */
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * How long the app waits for the auth service before giving up (8.2). It has
 * no counterpart in the TOML: it is the client's own patience, not a server
 * rule.
 */
export const AUTH_TIMEOUT_MS = 10_000;
