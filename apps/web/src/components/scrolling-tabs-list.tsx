import { TabsList } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * A `TabsList` that scrolls sideways instead of running off the screen.
 *
 * shadcn's list is `inline-flex w-fit`: it sizes to its tabs and has no opinion
 * about what happens when there are more of them than there is screen. Seven
 * tabs fit a laptop and do not fit a phone — `/progress` overran a 393px
 * viewport by 118px, which is not a clipped tab but a *page* 95px wider than
 * the device, so every screen on the route scrolled sideways and the last two
 * tabs were unreachable. In Spanish, where the labels are longer, more so.
 *
 * It sits here rather than in `ui/tabs.tsx` because that directory is vendored
 * and hand-editing it breaks `shadcn diff` against upstream — the same reason
 * `data-table.tsx` lives outside it.
 *
 * The scrollbar is hidden rather than styled: a horizontal bar under a row of
 * pills reads as a divider, and every platform this runs on already overlays
 * its own while you scroll.
 */
export function ScrollingTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsList>) {
  return (
    <div className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TabsList className={cn("max-w-none", className)} {...props} />
    </div>
  );
}
