import path from "path";
// vitest/config re-exports Vite's defineConfig with the `test` block typed.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { devtools } from "@tanstack/devtools-vite";

export default defineConfig(({ mode }) => ({
  plugins: [
    // AST-strips every `@tanstack/*-devtools` shell import and the JSX it
    // produces on build, which is what removes the panels in `__root.tsx`
    // without a hand-written environment guard around them. It does not reach
    // the registration hook inside `DataTable` — that's app code, not a shell
    // import — which is what the alias below is still for.
    devtools(),
    // The Start plugin's optimizeDeps handling breaks module resolution under
    // Vitest (TanStack/router#6246), and the tests exercise the data layer,
    // not the server — so neither Start nor Nitro belongs in a test run.
    ...(process.env.VITEST
      ? []
      : [
          // SPA mode: only a `_shell.html` is prerendered and route components
          // never run on the server — required here, not a preference, because
          // theme/locale stores write to `document` at import time and every
          // collection is a localStorage collection. Server functions still
          // work; full SSR is the thing this opts out of.
          // Router defaults match this repo (src/routes, src/routeTree.gen.ts,
          // autoCodeSplitting on), so no router options are restated.
          tanstackStart({ spa: { enabled: true } }),
          // Deploys the server build as Vercel Functions via zero-config
          // detection; locally `vite build` emits `.output/`.
          nitro(),
        ]),
    react(),
    tailwindcss(),
  ],
  resolve: {
    // pnpm's nested node_modules can otherwise resolve a second React copy for
    // a transitive dep, which surfaces as "Invalid hook call" / a null
    // dispatcher. Cheap insurance now that more workspace apps are planned.
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // Every DataTable registers itself with the Table devtools from app
      // code, so the plugin above can't see it as a shell import and strip it.
      // Swap it for a no-op in the bundle so a devDependency doesn't ship.
      // TypeScript still resolves the real package, so the call sites stay
      // honestly typed.
      ...(mode === "production"
        ? {
            "@tanstack/react-table-devtools": path.resolve(
              import.meta.dirname,
              "./src/lib/table-devtools-stub.ts",
            ),
          }
        : {}),
    },
  },
  test: {
    // Data-layer tests only so far — plain Node, no DOM environment needed.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
}));
