/**
 * Serve the production build, the way `vite preview` served `dist/` before the
 * TanStack Start migration. The build is now a Nitro server in `.output/`, and
 * its port comes from the PORT environment variable — which can't be set
 * inline on Windows, so this shim pins the port the layout checks expect.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const server = join(dirname(fileURLToPath(import.meta.url)), "..", ".output", "server", "index.mjs");

if (!existsSync(server)) {
  console.error("No production build found. Run `pnpm --filter web build` first.");
  process.exit(1);
}

process.env.PORT ??= "5300";
await import(server.startsWith("/") ? server : `file://${server.replaceAll("\\", "/")}`);
