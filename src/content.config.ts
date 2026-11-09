import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Every recipe in /recipes is checked at build time; a broken file fails the build
// instead of showing NaN on the page.
const recipes = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './recipes' }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()).default([]),
    servings: z.number().positive(),
    ingredients: z.array(z.object({
      name: z.string(),
      amount: z.number().positive(),
      unit: z.string().default(''),
    })).min(1),
    instructions: z.array(z.string()).min(1),
  }),
});

export const collections = { recipes };
