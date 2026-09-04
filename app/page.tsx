import BookMount from "@/components/book/BookMount";
import { requireSessionUser } from "@/lib/auth/session";
import { readInitialBook } from "@/lib/expenses/initial-book";
import { createExpenseRepository } from "@/lib/expenses/repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "./page.module.css";

/**
 * The book, behind the account, with its month already in it.
 *
 * A Server Component: the session is resolved before a single byte of HTML
 * exists, so "el libro" cannot appear and then be replaced, and no expense
 * figure is ever produced for someone without a session (4.2, 4.4, 2.5).
 *
 * The window is read in the same pass. This is what 3.1 asks for — the book
 * arrives complete rather than appearing empty and filling in — and it costs
 * nothing extra in perceived latency, because the page is already awaiting
 * Supabase for the session.
 */
export default async function Page() {
  const user = await requireSessionUser();

  const client = await createSupabaseServerClient();
  const initial = await readInitialBook(createExpenseRepository(client));

  return (
    <main className={styles.shell}>
      <BookMount user={user} initial={initial} />
    </main>
  );
}
