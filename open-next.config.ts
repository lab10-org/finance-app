import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/*
 * No `incrementalCache` override, on purpose. The adapter's default template
 * wires an R2 bucket, which pays off for ISR — and this app has none: the book
 * and the entrance are both dynamic because they read the session cookie. The
 * note at the bottom of `wrangler.jsonc` says what to add if that changes.
 */
export default defineCloudflareConfig();
