import { describe, expect, it } from "vitest";

import { APP_NAME } from "@/lib/app-meta";

describe("toolchain", () => {
  it("resolves modules through the @/ path alias", () => {
    expect(APP_NAME).toBe("Finance App");
  });
});
