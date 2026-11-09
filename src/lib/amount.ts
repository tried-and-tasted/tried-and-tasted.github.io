// Shared by the page build and the servings scaler in the browser.
const METRIC = new Set(['g', 'kg', 'ml', 'l']);
const FRACTIONS: [number, string][] = [
  [0, ''], [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾'], [1, ''],
];

export function formatAmount(amount: number, unit = ''): string {
  if (METRIC.has(unit.toLowerCase())) {
    return amount >= 10 ? String(Math.round(amount)) : String(Math.round(amount * 10) / 10);
  }
  // Spoons, pinches and counts read better as kitchen fractions: 0.25 tsp -> ¼ tsp
  const whole = Math.floor(amount);
  const rest = amount - whole;
  const [value, symbol] = FRACTIONS.reduce((best, f) => (Math.abs(f[0] - rest) < Math.abs(best[0] - rest) ? f : best));
  if (value === 1) return String(whole + 1);
  if (whole === 0 && !symbol) return '⅛';
  return whole ? `${whole}${symbol}` : symbol;
}

// Oil is stored in grams; alongside it show the spoon and ml you would actually pour.
const OIL_G_PER_ML = 0.92;
const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export const isOil = (name: string, unit: string) => unit === 'g' && /\b(oil|öl)\b/i.test(name);

export function oilEquivalents(grams: number): string {
  const ml = grams / OIL_G_PER_ML;
  const spoon = ml < 15
    ? `${formatAmount(Math.max(0.25, roundTo(ml / 5, 0.25)))} tsp`
    : `${formatAmount(roundTo(ml / 15, 0.5))} tbsp`;
  return `${spoon} · ${Math.round(ml)} ml`;
}

// "Mash the banana: Mash ..." -> a short step heading and the step text
export function splitStep(step: string): { heading?: string; text: string } {
  const match = step.match(/^([^:.]{2,70}):\s+([\s\S]*)$/);
  return match ? { heading: match[1], text: match[2] } : { text: step };
}
