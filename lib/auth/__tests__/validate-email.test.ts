import { validateEmail } from "@/lib/auth/validate-email";

describe("validateEmail (2.3)", () => {
  it.each([
    "juanse@lab10.ai",
    "a.b+tag@sub.dominio.com.co",
    "  juanse@lab10.ai  ",
  ])("accepts %j", (raw) => {
    expect(validateEmail(raw)).toBeNull();
  });

  it.each(["", "   ", "\t"])("reports %j as empty", (raw) => {
    expect(validateEmail(raw)).toEqual({ kind: "empty-email" });
  });

  it.each(["a@", "a@b", "@b.co", "a b@c.co", "a@b c.co", "sin-arroba.co", "a@@b.co"])(
    "reports %j as malformed",
    (raw) => {
      expect(validateEmail(raw)).toEqual({ kind: "invalid-email" });
    },
  );
});
