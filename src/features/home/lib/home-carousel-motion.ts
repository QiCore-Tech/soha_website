export const CAROUSEL_IMAGE_MOTION_DURATION = 3800;

/** Shrinking ends at 1x so the banner never reveals empty edges. */
export function getCarouselImageMotion(random: number, recent: readonly ("in" | "out")[] = []) {
  const randomDirection = random < 0.5 ? "in" : "out";
  const lastTwo = recent.slice(-2);
  const direction = lastTwo.length === 2 && lastTwo.every(value => value === randomDirection)
    ? randomDirection === "in" ? "out" : "in"
    : randomDirection;
  return direction === "in"
    ? { direction: "in" as const, from: 1, to: 1.12 }
    : { direction: "out" as const, from: 1.12, to: 1 };
}
