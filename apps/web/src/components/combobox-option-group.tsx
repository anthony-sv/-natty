import type { ReactNode } from "react";
import {
  ComboboxCollection,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxSeparator,
} from "@/components/ui/combobox";

/**
 * One labelled section of a grouped Combobox list.
 *
 * The exercise picker offers 113 lifts and the food picker three different
 * kinds of thing, and both used to arrive as one flat alphabetical run — fine
 * once you know the name, useless for browsing. Base UI filters grouped `items`
 * within each group and drops the ones that end up empty, so the headings
 * survive typing rather than being decoration on the unfiltered list.
 *
 * Sits outside `ui/` because it's ours: shadcn ships the group primitives but
 * no recipe that composes them, and writing the same eight lines at each of the
 * five pickers is what lets one of them silently diverge.
 *
 * The separator is drawn *before* every group but the first, rather than after
 * each one — a trailing rule under the last group reads as a section that
 * failed to load. `index` is the position in the **filtered** list, so the
 * first visible group is always index 0 however much typing removed above it.
 */
export function ComboboxOptionGroup<Item>({
  group,
  index,
  children,
}: {
  group: { key: string; label: string; items: Item[] };
  index: number;
  /** Renders one item — the call site owns the row, this owns the section. */
  children: (item: Item) => ReactNode;
}) {
  return (
    <>
      {index > 0 ? <ComboboxSeparator /> : null}
      <ComboboxGroup items={group.items}>
        <ComboboxLabel>{group.label}</ComboboxLabel>
        <ComboboxCollection>{children}</ComboboxCollection>
      </ComboboxGroup>
    </>
  );
}
