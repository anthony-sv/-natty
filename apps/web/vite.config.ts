import path from "path";
// vitest/config re-exports Vite's defineConfig with the `test` block typed.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig(({ mode }) => ({
  plugins: [
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
      // Every DataTable registers itself with the Table devtools, so that
      // import isn't inside a dead branch the way the panels in `main.tsx`
      // are, and can't be tree-shaken. Swap it for a no-op in the bundle so a
      // devDependency doesn't ship. TypeScript still sees the real package.
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
