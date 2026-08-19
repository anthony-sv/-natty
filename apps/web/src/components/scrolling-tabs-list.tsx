import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
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
 * its own while you scroll — on a trackpad or a touchscreen. **A mouse with no
 * horizontal wheel has no gesture at all**, which is what made a routine's day
 * tabs — a strip that can run to a dozen entries, unlike a fixed nav bar —
 * genuinely unreachable rather than just unstyled: the days past whatever fit
 * the window were there, scrollable in principle, and there was no way to
 * actually get to them. The chevrons are that way, universal across input
 * devices, and only ever shown on the side that still has something to
 * scroll to.
 */
export function ScrollingTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsList>) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Held in state rather than a ref, the same reason the table virtualizer's
  // scroll element is: an effect can depend on *when this becomes non-null*,
  // which a ref gives it no render to notice.
  useEffect(() => {
    if (container === null) return;

    const update = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      // A pixel of slack: the sum can land fractionally short of scrollWidth
      // on a non-integer zoom, which would leave the right chevron shown with
      // nothing left for it to do.
      setCanScrollRight(
        container.scrollLeft + container.clientWidth < container.scrollWidth - 1,
      );
    };

    update();
    container.addEventListener("scroll", update, { passive: true });
    // Content width can change under a fixed viewport too — a day added, or
    // a label growing as you type one.
    const observer = new ResizeObserver(update);
    observer.observe(container);

    return () => {
      container.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [container]);

  // A little over one tab's worth — enough to feel like progress, not a jump
  // that skips past whatever you were aiming for. `behavior: "auto"`, not
  // "smooth" — a chevron you press repeatedly to cross a dozen tabs shouldn't
  // make you wait out an animation each time, and CDP-automated Chrome
  // silently drops the "smooth" scroll entirely rather than degrading to
  // instant, so relying on it would have shipped a chevron that looked wired
  // up and did nothing when clicked.
  const scrollBy = (delta: number) =>
    container?.scrollBy({ left: delta, behavior: "auto" });

  return (
    <div className="relative min-w-0">
      <div
        ref={setContainer}
        className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* `w-max` sizes to the tabs, `min-w-full` stops it stopping short. The
            two together are what make one component cover both cases: where the
            tabs fit, the strip spans the content width and the triggers' `flex-1`
            shares it out, so five tabs read as a deliberate bar rather than a pill
            floating at the left of a wide page; where they don't, the strip keeps
            its natural width and the container scrolls. */}
        <TabsList className={cn("w-max min-w-full", className)} {...props} />
      </div>

      {canScrollLeft ? (
        <ScrollChevron direction="left" onClick={() => scrollBy(-160)} />
      ) : null}
      {canScrollRight ? (
        <ScrollChevron direction="right" onClick={() => scrollBy(160)} />
      ) : null}
    </div>
  );
}

function ScrollChevron({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      aria-label={direction === "left" ? "Scroll tabs left" : "Scroll tabs right"}
      onClick={onClick}
      className={cn(
        "absolute inset-y-0 flex w-8 items-center justify-center text-muted-foreground hover:text-foreground",
        // A solid-to-transparent fade rather than a hard edge, so the chevron
        // reads as sitting over the strip rather than as a fifth tab.
        direction === "left"
          ? "left-0 justify-start bg-gradient-to-r from-background via-background"
          : "right-0 justify-end bg-gradient-to-l from-background via-background",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
