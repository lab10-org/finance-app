import "@testing-library/jest-dom/vitest";

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
