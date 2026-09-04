export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export class MissingEnvError extends Error {
  readonly variable: string;

  constructor(variable: string) {
    super(
      `Falta la variable de entorno ${variable}. Copia .env.example a .env.local y complétala con "supabase status".`,
    );
    this.name = "MissingEnvError";
    this.variable = variable;
  }
}

const URL_VAR = "NEXT_PUBLIC_SUPABASE_URL";
const ANON_KEY_VAR = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

/**
 * The two literal member expressions exist so Next can substitute them at build
 * time. A dynamic `process.env[name]` lookup is not rewritten, so it yields
 * `undefined` in the browser bundle and the failure surfaces much later, as an
 * unexplained auth error rather than a missing variable (1.8).
 */
function defaultSource(): Record<string, string | undefined> {
  return {
    [URL_VAR]: process.env.NEXT_PUBLIC_SUPABASE_URL,
    [ANON_KEY_VAR]: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

function requireVar(source: Record<string, string | undefined>, name: string): string {
  const value = source[name]?.trim();
  // A declared-but-blank variable is the likeliest way to get here, since
  // `.env.example` ships the key empty on purpose — so "" counts as absent.
  if (!value) throw new MissingEnvError(name);
  return value;
}

/** `source` exists for tests; production always reads the real environment. */
export function readSupabaseEnv(
  source: Record<string, string | undefined> = defaultSource(),
): SupabaseEnv {
  return {
    url: requireVar(source, URL_VAR),
    anonKey: requireVar(source, ANON_KEY_VAR),
  };
}
