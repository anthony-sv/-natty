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
      {/* `w-max` sizes to the tabs, `min-w-full` stops it stopping short. The
          two together are what make one component cover both cases: where the
          tabs fit, the strip spans the content width and the triggers' `flex-1`
          shares it out, so five tabs read as a deliberate bar rather than a pill
          floating at the left of a wide page; where they don't, the strip keeps
          its natural width and the container scrolls. */}
      <TabsList className={cn("w-max min-w-full", className)} {...props} />
    </div>
  );
}
