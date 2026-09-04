import { MissingEnvError, readSupabaseEnv } from "@/lib/supabase/env";

const COMPLETE = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
};

describe("readSupabaseEnv (1.4, 1.8)", () => {
  it("returns both values from a complete source", () => {
    expect(readSupabaseEnv(COMPLETE)).toEqual({
      url: "http://127.0.0.1:54321",
      anonKey: "anon-key",
    });
  });

  it("names the URL variable when only it is absent", () => {
    const source = { ...COMPLETE, NEXT_PUBLIC_SUPABASE_URL: undefined };

    expect(() => readSupabaseEnv(source)).toThrow(MissingEnvError);
    expect(() => readSupabaseEnv(source)).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("names the key variable when only it is absent", () => {
    const source = { ...COMPLETE, NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined };

    expect(() => readSupabaseEnv(source)).toThrow(MissingEnvError);
    expect(() => readSupabaseEnv(source)).toThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("carries the offending variable on the error, not only in its message", () => {
    try {
      readSupabaseEnv({});
      expect.unreachable("readSupabaseEnv should have thrown");
    } catch (error) {
      expect((error as MissingEnvError).variable).toBe("NEXT_PUBLIC_SUPABASE_URL");
    }
  });

  it("treats an empty string as absent", () => {
    // A variable declared but never filled is the likeliest way to get here —
    // `.env.example` ships the key as an empty value on purpose.
    expect(() =>
      readSupabaseEnv({ ...COMPLETE, NEXT_PUBLIC_SUPABASE_ANON_KEY: "" }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("treats a whitespace-only value as absent", () => {
    expect(() =>
      readSupabaseEnv({ ...COMPLETE, NEXT_PUBLIC_SUPABASE_URL: "   " }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });
});
