import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Entrada } from "@/components/entrada/Entrada";
import {
  CODE_LENGTH,
  CODE_TTL_SECONDS,
  RESEND_COOLDOWN_SECONDS,
} from "@/lib/auth/config";

import { type FakeAuthClient, createClock, createFakeAuthClient } from "./fake-auth";

const EMAIL = "juanse@lab10.ai";

/*
 * Time is injected through the `now` prop rather than through global fake
 * timers: Testing Library's `findBy*` does not recognise vitest's fake timers
 * and polls in real time, so installing them for a whole file makes every
 * await hang until it times out.
 */
function setup() {
  const clock = createClock();
  const client = createFakeAuthClient();
  const onSignedIn = vi.fn();
  const user = userEvent.setup();

  render(<Entrada client={client} onSignedIn={onSignedIn} now={clock.now} />);
  return { user, client, onSignedIn, clock };
}

/** Walks the email step so every test below starts on the code step. */
async function reachCodeStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Correo"), EMAIL);
  await user.click(screen.getByRole("button", { name: "Enviar código" }));
  await screen.findByLabelText("Código");
}

/*
 * The countdown label only moves when the component's own interval fires, and
 * vitest can only drive an interval created *after* the fake timers are
 * installed — so these three tests install them before mounting. The cost is
 * that `findBy*` is unusable here (it polls in real time), so the resolved
 * `requestCode` is flushed with an empty `act` instead.
 */
function setupTicking() {
  /*
   * Only the interval is faked. Faking everything freezes React's own
   * scheduler and userEvent's internal waits too, and then nothing resolves —
   * the countdown is the single thing these tests need to drive by hand.
   */
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
  const clock = createClock();
  const client = createFakeAuthClient();
  const user = userEvent.setup();

  render(<Entrada client={client} onSignedIn={vi.fn()} now={clock.now} />);
  return { user, client, clock };
}

async function reachCodeStepTicking(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Correo"), EMAIL);
  await user.click(screen.getByRole("button", { name: "Enviar código" }));
  await act(async () => {});
  screen.getByLabelText("Código");
}

/** One second of the interval, so the component re-reads the injected clock. */
async function tick() {
  await act(async () => {
    vi.advanceTimersByTime(1000);
  });
}

afterEach(() => vi.useRealTimers());

describe("where the code went, and the way back (3.1)", () => {
  it("names the address it was sent to", async () => {
    const { user } = setup();
    await reachCodeStep(user);

    expect(screen.getByText(EMAIL)).toBeInTheDocument();
  });

  it("returns to the email step with the address still there", async () => {
    const { user } = setup();
    await reachCodeStep(user);

    await user.click(screen.getByRole("button", { name: "Cambiar correo" }));

    expect(screen.getByLabelText("Correo")).toHaveValue(EMAIL);
  });
});

describe("the code field (3.2, 7.3)", () => {
  it("asks for digits with the numeric keypad, capped at CODE_LENGTH", async () => {
    const { user } = setup();
    await reachCodeStep(user);

    const field = screen.getByLabelText("Código");
    expect(field).toHaveAttribute("inputMode", "numeric");
    expect(field).toHaveAttribute("maxLength", String(CODE_LENGTH));
    expect(field).toHaveAttribute("autoComplete", "one-time-code");
    // 7.3: the digits are a number, so they carry the numeric-font class.
    expect(field.className).toMatch(/num/);
  });

  it("keeps only the digits of a typed code", async () => {
    const { user } = setup();
    await reachCodeStep(user);

    await user.type(screen.getByLabelText("Código"), "48-19 02");

    expect(screen.getByLabelText("Código")).toHaveValue("481902");
  });
});

describe("a code that works (3.3)", () => {
  it("verifies it and reports the sign-in exactly once", async () => {
    const { user, client, onSignedIn } = setup();
    await reachCodeStep(user);

    await user.type(screen.getByLabelText("Código"), "481902");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledTimes(1));
    expect(client.verifyCode).toHaveBeenCalledWith(EMAIL, "481902");
  });
});

describe("a code that does not work (3.4, 3.5)", () => {
  /** GoTrue cannot tell these apart; only the elapsed time can. */
  function rejectCode(client: FakeAuthClient) {
    client.verifyCode.mockResolvedValue({
      ok: false,
      failure: { kind: "code-unverified" },
    });
  }

  it("reads it as a wrong code while it is still alive, and clears the field", async () => {
    const { user, client } = setup();
    await reachCodeStep(user);
    rejectCode(client);

    await user.type(screen.getByLabelText("Código"), "000000");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("Ese código no es. Revísalo e intenta de nuevo."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Código")).toHaveValue("");
  });

  it("reads the same answer as an expiry once the TTL has passed", async () => {
    const { user, client, clock } = setup();
    await reachCodeStep(user);
    rejectCode(client);

    clock.advanceSeconds(CODE_TTL_SECONDS + 1);

    await user.type(screen.getByLabelText("Código"), "481902");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("El código venció. Pide uno nuevo."),
    ).toBeInTheDocument();
    // Past the cooldown too, so asking for a new one is available right there.
    expect(screen.getByRole("button", { name: "Enviar otro código" })).toBeEnabled();
  });

  it("keeps the typed code when it merely expired, rather than clearing it", async () => {
    const { user, client, clock } = setup();
    await reachCodeStep(user);
    rejectCode(client);

    clock.advanceSeconds(CODE_TTL_SECONDS + 1);

    await user.type(screen.getByLabelText("Código"), "481902");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await screen.findByText("El código venció. Pide uno nuevo.");
    expect(screen.getByLabelText("Código")).toHaveValue("481902");
  });

  it("never says whether the code or the address was the problem (3.7)", async () => {
    const { user, client } = setup();
    await reachCodeStep(user);
    rejectCode(client);

    await user.type(screen.getByLabelText("Código"), "000000");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    const message = await screen.findByRole("alert");
    expect(message).not.toHaveTextContent(EMAIL);
    expect(message).not.toHaveTextContent(/correo/i);
  });
});

describe("asking for another code (3.6)", () => {
  it("states the wait and refuses to send during it", async () => {
    const { user, client } = setup();
    await reachCodeStep(user);

    const resend = screen.getByRole("button", {
      name: `Puedes pedir otro en ${RESEND_COOLDOWN_SECONDS} s`,
    });
    expect(resend).toBeDisabled();

    await user.click(resend);
    expect(client.requestCode).toHaveBeenCalledTimes(1);
  });

  it("counts down as the wait runs out", async () => {
    const { user, clock } = setupTicking();
    await reachCodeStepTicking(user);

    clock.advanceSeconds(30);
    await tick();

    expect(
      screen.getByRole("button", { name: "Puedes pedir otro en 30 s" }),
    ).toBeInTheDocument();
  });

  it("sends again once the wait is over", async () => {
    const { user, client, clock } = setupTicking();
    await reachCodeStepTicking(user);

    clock.advanceSeconds(RESEND_COOLDOWN_SECONDS);
    await tick();

    const resend = screen.getByRole("button", { name: "Enviar otro código" });
    expect(resend).toBeEnabled();

    await user.click(resend);
    await act(async () => {});

    expect(client.requestCode).toHaveBeenCalledTimes(2);
  });
});

describe("when the service throttles us anyway (2.7)", () => {
  it("states the wait in Spanish and keeps the person on the step", async () => {
    const { user, client, clock } = setupTicking();
    await reachCodeStepTicking(user);

    clock.advanceSeconds(RESEND_COOLDOWN_SECONDS);
    await tick();
    client.requestCode.mockResolvedValue({
      ok: false,
      failure: { kind: "rate-limited" },
    });

    await user.click(screen.getByRole("button", { name: "Enviar otro código" }));
    await act(async () => {});

    expect(
      screen.getByText(
        `Ya te enviamos un código. Espera ${RESEND_COOLDOWN_SECONDS} segundos para pedir otro.`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Código")).toBeInTheDocument();
  });
});
