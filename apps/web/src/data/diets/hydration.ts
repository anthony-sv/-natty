import { hydrationSchema, type Hydration } from "./schema";

/**
 * Water targets, by day type.
 *
 * A standing protocol rather than a field on a plan: these scale with body
 * weight and training load, not with the calorie target, and every plan version
 * that mentions them gives the same numbers. They're written down in the
 * earliest version and simply not restated later, which is why they live here
 * instead of being duplicated into each plan.
 *
 * The alternatives are listed rather than computed because the docs list them:
 * a zero-sugar coke counts toward the total, but the trade isn't one-for-one.
 */
export const hydration: Hydration = hydrationSchema.parse({
  restDay: [
    { litres: 4.15, zeroCokes: 0 },
    { litres: 3.55, zeroCokes: 1 },
    { litres: 2.95, zeroCokes: 2 },
  ],
  trainingDay: [
    { litres: 4.65, zeroCokes: 0, note: "plus 500ml during the session" },
    { litres: 4.05, zeroCokes: 1 },
    { litres: 3.45, zeroCokes: 2 },
  ],
});
