/**
 * What `@tanstack/react-table-devtools` resolves to in a production build.
 *
 * `DataTable` registers itself with the devtools on every render, so unlike
 * the panels in `__root.tsx` — which `@tanstack/devtools-vite` AST-strips out
 * of the build — the import can't be dead-code removed. Without this swap a
 * devDependency worth ~200KB would ship to users.
 *
 * The alias lives in `vite.config.ts` and applies to the bundle only:
 * TypeScript still resolves the real package, so the call sites stay honestly
 * typed and a signature change would still fail the build.
 */
export function useTanStackTableDevtools(): void {}

export function TableDevtoolsPanel(): null {
  return null;
}
