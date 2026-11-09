import { describe, expect, it } from 'vitest';
import { scaleAmount, stepServings } from '../src/lib/scale';

const walk = (start: number, direction: 1 | -1, times: number) =>
  Array.from({ length: times }).reduce<number[]>((seen) => [...seen, stepServings(seen.at(-1)!, direction)], [start]).slice(1);

describe('stepServings', () => {
  it('goes up in halves to 2, then whole servings', () => {
    expect(walk(1, 1, 4)).toEqual([1.5, 2, 3, 4]);
  });

  it('goes down in whole servings to 2, then halves, and stops at ½', () => {
    expect(walk(4, -1, 6)).toEqual([3, 2, 1.5, 1, 0.5, 0.5]);
  });
});

describe('scaleAmount', () => {
  it('scales from the recipe servings, not from 1', () => {
    expect(scaleAmount(300, 4, 2)).toBe(600);
    expect(scaleAmount(300, 1.5, 2)).toBe(225);
    expect(scaleAmount(60, 0.5, 1)).toBe(30);
  });
});
