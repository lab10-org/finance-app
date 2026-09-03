import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BookApp from "@/components/book/BookApp";

describe("the mounted application", () => {
  it("brings its own store, so nothing has to be wrapped around it", () => {
    // Deliberately rendered bare: every other test supplies a provider, which
    // is how a missing <BookProvider> in app/page.tsx stayed invisible until
    // the app was opened in a browser.
    expect(() => render(<BookApp />)).not.toThrow();
    expect(screen.getByText("TOTAL GASTADO")).toBeInTheDocument();
  });
});
