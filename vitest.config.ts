import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^@\//, replacement: root }],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
    /*
     * `**` before `node_modules`, not just the top-level one: a git worktree
     * under `.claude/worktrees/` carries its own installed dependencies, and the
     * top-level pattern does not reach them — the suite then tries to run the
     * `__tests__` folders shipped inside other people's packages.
     */
    exclude: ["**/node_modules/**", "**/.next/**", ".claude/worktrees/**", "e2e/**"],
  },
});
