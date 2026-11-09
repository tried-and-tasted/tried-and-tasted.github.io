// Servings stepper and amount scaling, shared by the recipe page and the unit tests.

// Halves let a 1-serving recipe go to 1.5; whole steps above that. Never below ½.
export function stepServings(value: number, direction: 1 | -1): number {
  if (direction > 0) return value < 2 ? value + 0.5 : value + 1;
  return value <= 2 ? Math.max(0.5, value - 0.5) : value - 1;
}

export const scaleAmount = (amount: number, servings: number, original: number) => (amount * servings) / original;
