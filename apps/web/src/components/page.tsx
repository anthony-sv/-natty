import { cn } from "@/lib/utils";

/**
 * The standard page frame, so every route shares one measure and gutter
 * instead of repeating the wrapper classes.
 *
 * `max-w-5xl` rather than the old `3xl`: with a sidebar taking ~16rem, a
 * 48rem column left most of a wide screen empty. Still capped — full-bleed
 * text is worse to read than a bit of margin.
 */
export function Page({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-col gap-6 p-6",
        className,
      )}
      {...props}
    />
  );
}
