import type { SupabaseClient } from "@supabase/supabase-js";

import { readSessionUser } from "@/lib/auth/session-core";

function stub(
  claims: Record<string, unknown> | null,
  user: { id: string; email: string | null } | null = null,
): SupabaseClient {
  return {
    auth: {
      getClaims: vi.fn().mockResolvedValue({ data: claims ? { claims } : null }),
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  } as unknown as SupabaseClient;
}

describe("readSessionUser (4.5)", () => {
  it("reads the account from the claims", async () => {
    const supabase = stub({ sub: "u-1", email: "juanse@lab10.ai" });

    expect(await readSessionUser(supabase)).toEqual({
      id: "u-1",
      email: "juanse@lab10.ai",
    });
  });

  it("is null when there is no session", async () => {
    expect(await readSessionUser(stub(null))).toBeNull();
  });

  it("is null when the claims carry no subject", async () => {
    expect(await readSessionUser(stub({ email: "juanse@lab10.ai" }))).toBeNull();
  });

  it("falls back to getUser when the claims carry no email (6.1)", async () => {
    // `SessionUser.email` is non-empty by contract — the header shows it.
    const supabase = stub({ sub: "u-1" }, { id: "u-1", email: "juanse@lab10.ai" });

    expect(await readSessionUser(supabase)).toEqual({
      id: "u-1",
      email: "juanse@lab10.ai",
    });
    expect(supabase.auth.getUser).toHaveBeenCalled();
  });

  it("is null when neither the claims nor the account carry an email", async () => {
    expect(await readSessionUser(stub({ sub: "u-1" }, null))).toBeNull();
  });

  it("treats an unreachable auth service as no session rather than crashing", async () => {
    const supabase = {
      auth: { getClaims: vi.fn().mockRejectedValue(new TypeError("Failed to fetch")) },
    } as unknown as SupabaseClient;

    expect(await readSessionUser(supabase)).toBeNull();
  });
});
