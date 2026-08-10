import path from "path";
// vitest/config re-exports Vite's defineConfig with the `test` block typed.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { devtools } from "@tanstack/devtools-vite";

export default defineConfig(({ mode }) => ({
  plugins: [
    // AST-strips every `@tanstack/*-devtools` shell import and the JSX it
    // produces on build, which is what removes the panels in `main.tsx`
    // without a hand-written environment guard around them. It does not reach
    // the registration hook inside `DataTable` — that's app code, not a shell
    // import — which is what the alias below is still for.
    devtools(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
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
