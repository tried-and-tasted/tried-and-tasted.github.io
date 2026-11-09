import { describe, expect, it } from 'vitest';
import { formatAmount, isOil, oilEquivalents, splitStep } from '../src/lib/amount';

describe('formatAmount', () => {
  it.each([
    [0.25, 'tsp', '¼'], [0.33, 'tsp', '⅓'], [0.5, 'tsp', '½'], [0.75, 'tsp', '¾'], [1.25, 'tsp', '1¼'],
    [1.5, '', '1½'], [2.97, 'tsp', '3'], [1, 'pinch', '1'],
  ])('shows %s %s as a kitchen fraction', (amount, unit, expected) => {
    expect(formatAmount(amount, unit)).toBe(expected);
  });

  it('never shows 0 for a tiny spoon amount', () => {
    expect(formatAmount(0.05, 'tsp')).toBe('⅛');
  });

  it.each([
    [307, 'g', '307'], [460.5, 'g', '461'], [7.5, 'ml', '7.5'], [3.5, 'g', '3.5'], [1, 'l', '1'],
  ])('shows metric %s %s as a plain number', (amount, unit, expected) => {
    expect(formatAmount(amount, unit)).toBe(expected);
  });
});

describe('oil', () => {
  it('is recognised only when weighed in grams', () => {
    expect(isOil('sesame oil (nallennai)', 'g')).toBe(true);
    expect(isOil('vegetable oil or ghee', 'g')).toBe(true);
    expect(isOil('olive oil', 'tbsp')).toBe(false);
    expect(isOil('butter (gravy)', 'g')).toBe(false);
    expect(isOil('boiled potatoes', 'g')).toBe(false);
  });

  it.each([
    [5, '1 tsp · 5 ml'], [6, '1¼ tsp · 7 ml'], [11.25, '2½ tsp · 12 ml'],
    [18, '1½ tbsp · 20 ml'], [30, '2 tbsp · 33 ml'], [110, '8 tbsp · 120 ml'],
  ])('%s g reads as %s', (grams, expected) => {
    expect(oilEquivalents(grams)).toBe(expected);
  });
});

describe('splitStep', () => {
  it('separates a short heading from the step text', () => {
    expect(splitStep('Mash the banana: Mash it well.')).toEqual({ heading: 'Mash the banana', text: 'Mash it well.' });
  });

  it('leaves a step without a heading alone', () => {
    const step = 'Soak the dates in hot water for 15 minutes. Then drain: fully.';
    expect(splitStep(step)).toEqual({ text: step });
  });
});
