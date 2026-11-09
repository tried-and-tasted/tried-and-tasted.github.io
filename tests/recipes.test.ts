// Checks every recipe file against the house rules. Each test covers all recipes and
// names the offending files, so a bad recipe fails with a readable list.
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { TAG_GROUPS } from '../src/lib/filter';

type Recipe = {
  title: string;
  tags: string[];
  servings: number;
  ingredients: { name: string; amount: number; unit: string }[];
  instructions: string[];
};

const files = readdirSync('recipes').filter((f) => f.endsWith('.yaml'));
const recipes = files.map((file) => ({ file, recipe: parse(readFileSync(`recipes/${file}`, 'utf8')) as Recipe }));
const ingredients = recipes.flatMap(({ file, recipe }) => recipe.ingredients.map((ing) => ({ file, ...ing })));
const offenders = <T extends { file: string }>(items: T[], bad: (item: T) => boolean, describe = (i: T) => i.file) =>
  items.filter(bad).map(describe);

describe('recipe files', () => {
  it('exist', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('have kebab-case file names', () => {
    expect(files.filter((f) => !/^[a-z0-9]+(-[a-z0-9]+)*\.yaml$/.test(f))).toEqual([]);
  });

  it('have a title, servings, ingredients and steps', () => {
    expect(offenders(recipes, ({ recipe: r }) =>
      !r.title || !(r.servings > 0) || !r.ingredients?.length || !r.instructions?.length)).toEqual([]);
  });

  it('have unique titles', () => {
    const titles = recipes.map(({ recipe }) => recipe.title);
    expect(titles.filter((t, i) => titles.indexOf(t) !== i)).toEqual([]);
  });

  it('give every ingredient a positive number amount', () => {
    expect(offenders(ingredients, (i) => typeof i.amount !== 'number' || !(i.amount > 0), (i) => `${i.file}: ${i.name}`)).toEqual([]);
  });

  it('have no unfilled {placeholders} in steps', () => {
    expect(offenders(recipes, ({ recipe }) => recipe.instructions.some((s) => /\{\w+\}/.test(s)))).toEqual([]);
  });
});

describe('tags', () => {
  const known = new Set(TAG_GROUPS.flatMap(([, tags]) => tags));
  const [cuisines, dishes] = TAG_GROUPS.map(([, tags]) => tags);

  it('are all ones the filters know about', () => {
    expect(offenders(recipes, ({ recipe }) => recipe.tags.some((t) => !known.has(t)))).toEqual([]);
  });

  it('give each recipe exactly one cuisine and at least one dish', () => {
    expect(offenders(recipes, ({ recipe: { tags } }) =>
      tags.filter((t) => cuisines.includes(t)).length !== 1 || !tags.some((t) => dishes.includes(t)))).toEqual([]);
  });
});

describe('measuring conventions', () => {
  const SPICE = /powder|masala|turmeric|cumin|mustard|fenugreek|methi|pepper|chil+i|cinnamon|cardamom|clove|\bsalt|hing|asafoetida|fennel|sombu|sugar/i;

  it('weigh oil, ghee and butter in grams', () => {
    expect(offenders(ingredients, (i) => /\b(oil|ghee|butter)\b/i.test(i.name) && !SPICE.test(i.name) && i.unit !== 'g',
      (i) => `${i.file}: ${i.amount} ${i.unit} ${i.name}`)).toEqual([]);
  });

  it('measure spices, salt and sugar with spoons, not grams', () => {
    expect(offenders(ingredients, (i) => SPICE.test(i.name) && !/^fresh /i.test(i.name) && ['g', 'ml'].includes(i.unit) && i.amount <= 15,
      (i) => `${i.file}: ${i.amount} ${i.unit} ${i.name}`)).toEqual([]);
  });
});

describe('published text', () => {
  const text = ({ recipe }: { recipe: Recipe }) => JSON.stringify(recipe);

  it('has no personal details (health, family, work or shops)', () => {
    const PRIVATE = /\b(kids?|child|children|adults?|years? old|office|colleagues?|lidl|edeka|rewe|aldi|dmbio|freshona|hashimoto|thyroid|levothyroxine)\b/i;
    expect(offenders(recipes, (r) => PRIVATE.test(text(r)))).toEqual([]);
  });

  it('is in English', () => {
    const GERMAN = /[äöß]|\b(und|oder|mit|der|die|das|Kurkuma|Ingwer|Zwiebeln?|Knoblauch\w*|Koriander|Kreuzkümmel|Hackfleisch|Erbsen|Salz|Wasser|Sahne|Kochsahne|Speck\w*|Würstchen|Gemüse\w*)\b/;
    expect(offenders(recipes, (r) => GERMAN.test(text(r).replace(/Spätzle/gi, '')))).toEqual([]);
  });
});
