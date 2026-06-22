// Fractional ranking for stable drag-and-drop ordering. An item's rank is a
// float that sorts it within its list; to move an item between two neighbours we
// pick a rank halfway between them. Matches the backend's max(rank)+1024 spacing.

const STEP = 1024;

/**
 * A rank that places an item between `prev` and `next` (either may be undefined
 * at the ends of the list). Returns the midpoint when both are present.
 */
export function rankBetween(prev: number | undefined, next: number | undefined): number {
  if (prev === undefined && next === undefined) return STEP;
  if (prev === undefined) return next! - STEP;
  if (next === undefined) return prev + STEP;
  return (prev + next) / 2;
}
