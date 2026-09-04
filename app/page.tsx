import BookMount from "@/components/book/BookMount";
import { requireSessionUser } from "@/lib/auth/session";

import styles from "./page.module.css";

/**
 * The book, behind the account.
 *
 * A Server Component: the session is resolved before a single byte of HTML
 * exists, so "el libro" cannot appear and then be replaced, and no expense
 * figure is ever produced for someone without a session (4.2, 4.4).
 */
export default async function Page() {
  const user = await requireSessionUser();

  return (
    <main className={styles.shell}>
      <BookMount user={user} />
    </main>
  );
}
