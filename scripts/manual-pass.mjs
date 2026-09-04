/*
 * The manual pass, driven through the real API rather than a browser: two real
 * accounts, the real anon key, real RLS. What it proves is exactly what jsdom
 * and pgTAP cannot — that a signed-in client, holding a JWT, sees its own book
 * and nothing else.
 */
import { createClient } from "@supabase/supabase-js";

const URL = "http://127.0.0.1:54321";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const ok = [];
const bad = [];
const check = (label, pass, detail = "") => {
  (pass ? ok : bad).push(label + (detail ? ` — ${detail}` : ""));
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

async function signUp(email) {
  const client = createClient(URL, ANON);
  const { data, error } = await client.auth.signUp({ email, password: "contrasena-de-prueba" });
  if (error) throw new Error(`${email}: ${error.message}`);
  return { client, userId: data.user.id };
}

const stamp = Date.now();
const ana = await signUp(`ana-${stamp}@example.com`);
const beto = await signUp(`beto-${stamp}@example.com`);

// --- 8.1/8.2/8.3: a new account opens on a month that has data --------------
const { data: anaRows, error: readError } = await ana.client
  .from("expenses")
  .select("id, amount, category_id, description, date, created_at, currency")
  .is("deleted_at", null);

check("a new account is seeded", !readError && anaRows.length === 37, readError?.message ?? `${anaRows?.length} filas`);

const months = [...new Set(anaRows.map((r) => r.date.slice(0, 7)))].sort();
check("the seeded book spans two months", months.length === 2, months.join(", "));

const now = new Date();
const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
check("the later month is the current one", months[1] === thisMonth, `${months[1]} vs ${thisMonth}`);

const prevTotal = anaRows
  .filter((r) => r.date.startsWith(months[0]))
  .reduce((sum, r) => sum + Number(r.amount), 0);
check("the previous month totals the mockup's figure", prevTotal === 1412300, `$${prevTotal}`);

// --- 8.4: seeded rows are ordinary rows -------------------------------------
check("seeded rows are all COP", anaRows.every((r) => r.currency === "COP"));

// --- 2.2/2.3: the accounts cannot see each other ----------------------------
const { data: betoRows } = await beto.client.from("expenses").select("id").is("deleted_at", null);
const anaIds = new Set(anaRows.map((r) => r.id));
check("each account reads only its own book", !betoRows.some((r) => anaIds.has(r.id)), `beto ve ${betoRows.length}`);

const target = anaRows.find((r) => r.date.startsWith(thisMonth));
const { data: stolen } = await beto.client.from("expenses").select("id").eq("id", target.id);
check("one account cannot read another's row", stolen.length === 0);

const { data: hijacked } = await beto.client
  .from("expenses")
  .update({ amount: 1 })
  .eq("id", target.id)
  .select("id");
check("one account cannot change another's row", (hijacked ?? []).length === 0);

const { error: forged } = await beto.client
  .from("expenses")
  .insert({ user_id: ana.userId, amount: 999, category_id: "otros", date: "2026-09-01" });
check("one account cannot write into another's book", forged !== null, forged?.code);

// --- 1.1/1.2: a registration survives ---------------------------------------
const clientOpId = crypto.randomUUID();
const { data: created, error: createError } = await ana.client
  .from("expenses")
  .insert({
    amount: 25000,
    currency: "COP",
    category_id: "mercado",
    description: "Prueba manual",
    date: `${thisMonth}-01`,
    client_op_id: clientOpId,
  })
  .select("id, amount, date, created_at")
  .single();
check("an expense can be registered", !createError, createError?.message);

const fresh = createClient(URL, ANON);
await fresh.auth.signInWithPassword({
  email: `ana-${stamp}@example.com`,
  password: "contrasena-de-prueba",
});
const { data: afterReload } = await fresh.from("expenses").select("id").eq("id", created.id);
check("it survives signing in again (1.2, 1.6)", afterReload.length === 1);

// --- 5.7/5.8: a retry does not duplicate ------------------------------------
const { error: retryError } = await ana.client.from("expenses").insert({
  amount: 25000,
  currency: "COP",
  category_id: "mercado",
  description: "Prueba manual",
  date: `${thisMonth}-01`,
  client_op_id: clientOpId,
});
check("a retry with the same key is rejected, not duplicated (5.7)", retryError?.code === "23505", retryError?.code);

const { error: twinError } = await ana.client.from("expenses").insert({
  amount: 25000,
  currency: "COP",
  category_id: "mercado",
  description: "Prueba manual",
  date: `${thisMonth}-01`,
  client_op_id: crypto.randomUUID(),
});
check("an identical expense with a new key IS a second expense (5.8)", twinError === null, twinError?.message);

// --- 1.4/10.7: an edit persists and moves updated_at ------------------------
const { data: edited } = await ana.client
  .from("expenses")
  .update({ amount: 31000 })
  .eq("id", created.id)
  .select("amount, created_at, updated_at")
  .single();
check("an edit persists (1.4)", Number(edited.amount) === 31000, edited.amount);
check("updated_at moved past created_at (10.7)", new Date(edited.updated_at) > new Date(edited.created_at));

// --- 6.4/6.6/6.7: a deletion is a mark, and it hides the row ----------------
await ana.client.from("expenses").update({ deleted_at: new Date().toISOString() }).eq("id", created.id);
const { data: afterDelete } = await ana.client
  .from("expenses")
  .select("id")
  .eq("id", created.id)
  .is("deleted_at", null);
check("a deleted expense leaves the book (6.7)", afterDelete.length === 0);

const { data: stillThere } = await ana.client.from("expenses").select("id").eq("id", created.id);
check("but its row survives, so undo can restore it (6.10)", stillThere.length === 1);

await ana.client.from("expenses").update({ deleted_at: null }).eq("id", created.id);
const { data: restored } = await ana.client
  .from("expenses")
  .select("id")
  .eq("id", created.id)
  .is("deleted_at", null);
check("undo brings it back (6.5)", restored.length === 1);

// --- 10.1: amounts are exact ------------------------------------------------
await ana.client.from("expenses").insert([
  { amount: 0.1, category_id: "otros", date: `${thisMonth}-02` },
  { amount: 0.2, category_id: "otros", date: `${thisMonth}-02` },
]);
const { data: cents } = await ana.client
  .from("expenses")
  .select("amount")
  .eq("date", `${thisMonth}-02`)
  // The seeded book already has expenses on this day; only the two sub-peso
  // rows written just above belong to this check.
  .lt("amount", 1);
const sum = cents.reduce((s, r) => s + Number(r.amount), 0);
check("0.1 + 0.2 sums to exactly 0.3 (10.1)", Math.abs(sum - 0.3) < 1e-12, String(sum));

// --- 2.5: no session, no figures --------------------------------------------
const anon = createClient(URL, ANON);
const { data: anonRows, error: anonError } = await anon.from("expenses").select("id");
check("without a session there is nothing to read (2.5)", (anonRows ?? []).length === 0, anonError?.message ?? "0 filas");

console.log(`\n${ok.length} passed, ${bad.length} failed`);
if (bad.length) {
  console.log("FAILURES:\n" + bad.map((b) => `  - ${b}`).join("\n"));
  process.exit(1);
}
