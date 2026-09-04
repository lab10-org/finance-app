import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useRefreshOnVisible } from "@/state/use-refresh-on-visible";

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

function Probe({ refresh, enabled }: { refresh: () => void; enabled?: boolean }) {
  useRefreshOnVisible(refresh, enabled);
  return null;
}

describe("useRefreshOnVisible (9.2)", () => {
  it("refreshes when the app comes back to the foreground", () => {
    const refresh = vi.fn();
    render(<Probe refresh={refresh} />);

    setVisibility("hidden");
    expect(refresh).not.toHaveBeenCalled();

    setVisibility("visible");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh when the app is being hidden", () => {
    const refresh = vi.fn();
    render(<Probe refresh={refresh} />);

    setVisibility("hidden");

    expect(refresh).not.toHaveBeenCalled();
  });

  it("stops listening once unmounted", () => {
    const refresh = vi.fn();
    const { unmount } = render(<Probe refresh={refresh} />);

    unmount();
    setVisibility("visible");

    expect(refresh).not.toHaveBeenCalled();
  });

  it("calls the latest callback, not the one from the first render", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Probe refresh={first} />);

    rerender(<Probe refresh={second} />);
    setVisibility("visible");

    // The callback is held in a ref precisely so a re-render does not tear the
    // listener down and put a stale closure back.
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("does nothing while disabled", () => {
    const refresh = vi.fn();
    render(<Probe refresh={refresh} enabled={false} />);

    setVisibility("visible");

    expect(refresh).not.toHaveBeenCalled();
  });
});
