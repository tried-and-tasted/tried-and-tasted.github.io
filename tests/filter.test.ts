import { describe, expect, it } from 'vitest';
import { matchesFilters, searchWords } from '../src/lib/filter';

const rajma = { text: 'rajma (kidney bean curry) north indian curry dry red kidney beans onion', tags: ['North Indian', 'Curry', 'Vegetarian'] };
const none = [[], [], []];

describe('search', () => {
  it('splits a query into lower-case words', () => {
    expect(searchWords('  Kidney   BEANS ')).toEqual(['kidney', 'beans']);
  });

  it('needs every word to match the title, tags or ingredients', () => {
    expect(matchesFilters(rajma.text, rajma.tags, searchWords('kidney beans'), none)).toBe(true);
    expect(matchesFilters(rajma.text, rajma.tags, searchWords('kidney chicken'), none)).toBe(false);
  });
});

describe('tag filters', () => {
  it('narrow across groups', () => {
    expect(matchesFilters(rajma.text, rajma.tags, [], [['North Indian'], ['Curry'], []])).toBe(true);
    expect(matchesFilters(rajma.text, rajma.tags, [], [['North Indian'], ['Soup'], []])).toBe(false);
  });

  it('widen within a group', () => {
    expect(matchesFilters(rajma.text, rajma.tags, [], [['South Indian', 'North Indian'], [], []])).toBe(true);
  });

  it('show everything when nothing is chosen', () => {
    expect(matchesFilters(rajma.text, rajma.tags, [], none)).toBe(true);
  });
});
