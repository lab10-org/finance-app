import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Entrada } from "@/components/entrada/Entrada";

import { type FakeAuthClient, createFakeAuthClient, renderEntrada } from "./fake-auth";

describe("the email step (2.1)", () => {
  it("focuses the address field on mount, with the email keyboard", () => {
    renderEntrada();

    const field = screen.getByLabelText("Correo");
    expect(field).toHaveFocus();
    expect(field).toHaveAttribute("type", "email");
    expect(field).toHaveAttribute("inputMode", "email");
  });

  it("is the only step on screen before a code is asked for", () => {
    renderEntrada();

    expect(screen.queryByLabelText("Código")).not.toBeInTheDocument();
  });
});

describe("asking for a code (2.2)", () => {
  it("sends to the typed address and advances to the code step", async () => {
    const user = userEvent.setup();
    const { client } = renderEntrada();

    await user.type(screen.getByLabelText("Correo"), "juanse@lab10.ai");
    await user.click(screen.getByRole("button", { name: "Enviar código" }));

    expect(client.requestCode).toHaveBeenCalledExactlyOnceWith("juanse@lab10.ai");
    expect(await screen.findByLabelText("Código")).toBeInTheDocument();
  });
});

describe("an address that is not worth sending (2.3)", () => {
  it("refuses an empty submission without contacting the service", async () => {
    const user = userEvent.setup();
    const { client } = renderEntrada();

    await user.click(screen.getByRole("button", { name: "Enviar código" }));

    expect(screen.getByText("Escribe tu correo.")).toBeInTheDocument();
    expect(client.requestCode).not.toHaveBeenCalled();
  });

  it("refuses a malformed address without contacting the service", async () => {
    const user = userEvent.setup();
    const { client } = renderEntrada();

    await user.type(screen.getByLabelText("Correo"), "no-es-correo");
    await user.click(screen.getByRole("button", { name: "Enviar código" }));

    expect(screen.getByText("Ese correo no parece válido.")).toBeInTheDocument();
    expect(client.requestCode).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Código")).not.toBeInTheDocument();
  });

  it("describes the problem next to the field that caused it (7.6)", async () => {
    const user = userEvent.setup();
    renderEntrada();

    await user.click(screen.getByRole("button", { name: "Enviar código" }));

    const field = screen.getByLabelText("Correo");
    const messageId = field.getAttribute("aria-describedby");
    expect(messageId).toBeTruthy();
    expect(document.getElementById(messageId as string)).toHaveTextContent(
      "Escribe tu correo.",
    );
  });
});

describe("one tap cannot send two codes (2.6, 7.5)", () => {
  it("shows the busy state on the control and ignores the second tap", async () => {
    const user = userEvent.setup();
    const client: FakeAuthClient = createFakeAuthClient();
    let release: () => void = () => {};
    client.requestCode.mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve({ ok: true, value: undefined });
      }),
    );

    render(<Entrada client={client} onSignedIn={vi.fn()} now={() => 0} />);

    await user.type(screen.getByLabelText("Correo"), "juanse@lab10.ai");
    await user.click(screen.getByRole("button", { name: "Enviar código" }));

    const busy = screen.getByRole("button", { name: "Enviando…" });
    expect(busy).toBeDisabled();

    await user.click(busy);
    expect(client.requestCode).toHaveBeenCalledTimes(1);

    release();
    await waitFor(() => expect(screen.getByLabelText("Código")).toBeInTheDocument());
  });
});

describe("when the service cannot be reached (8.1, 8.4)", () => {
  it("keeps the step and what was typed, and offers the retry", async () => {
    const user = userEvent.setup();
    const client = createFakeAuthClient();
    client.requestCode.mockResolvedValue({
      ok: false,
      failure: { kind: "unreachable" },
    });

    render(<Entrada client={client} onSignedIn={vi.fn()} now={() => 0} />);

    await user.type(screen.getByLabelText("Correo"), "juanse@lab10.ai");
    await user.click(screen.getByRole("button", { name: "Enviar código" }));

    expect(
      await screen.findByText(/No pudimos conectarnos con el servicio/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toHaveValue("juanse@lab10.ai");
    expect(screen.getByRole("button", { name: "Enviar código" })).toBeEnabled();
  });

  it("names the stopped local stack while in development (8.3)", async () => {
    const user = userEvent.setup();
    const client = createFakeAuthClient();
    client.requestCode.mockResolvedValue({
      ok: false,
      failure: { kind: "unreachable" },
    });

    render(
      <Entrada client={client} onSignedIn={vi.fn()} now={() => 0} isDevelopment />,
    );

    await user.type(screen.getByLabelText("Correo"), "juanse@lab10.ai");
    await user.click(screen.getByRole("button", { name: "Enviar código" }));

    expect(await screen.findByText(/supabase start/)).toBeInTheDocument();
  });
});
