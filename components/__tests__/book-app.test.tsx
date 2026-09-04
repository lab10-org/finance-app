import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BookApp from "@/components/book/BookApp";
import type { SessionUser } from "@/lib/auth/types";

const USER: SessionUser = { id: "u-1", email: "juanse@lab10.ai" };

describe("the mounted application", () => {
  it("brings its own store, so nothing has to be wrapped around it", () => {
    // Deliberately rendered with nothing but its account: every other test
    // supplies a provider, which is how a missing <BookProvider> in
    // app/page.tsx stayed invisible until the app was opened in a browser.
    expect(() => render(<BookApp user={USER} />)).not.toThrow();
    expect(screen.getByText("TOTAL GASTADO")).toBeInTheDocument();
  });
});
