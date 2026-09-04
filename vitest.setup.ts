import "@testing-library/jest-dom/vitest";

/*
 * The Supabase clients read these on construction and throw when they are
 * absent (1.8). Nothing here talks to a network — every test that exercises an
 * auth operation injects a fake `AuthClient` — but a component that builds a
 * client on mount still needs the contract satisfied.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://127.0.0.1:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "anon-key-para-pruebas";

/*
 * jsdom does not implement <dialog>.showModal(), so a dialog rendered in a test
 * stays closed and its contents never enter the accessibility tree — which
 * silently breaks every ByRole query inside the sheet. Patch the two methods to
 * the minimum the tests need; real browsers use the native implementation.
 */
if (typeof HTMLDialogElement !== "undefined") {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true;
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    };
  }
}
