import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { object, string, array, coerce } from 'astro/zod';

const tipsyguias = defineCollection({
  loader: glob({
    base: './src/tips/tipsyguias',
    pattern: '**/*.{md,mdx}'
  }),
  schema: object({
    title: string(),
    description: string().optional(),
    image: string().optional(),
    tags: array(string()).optional(),
    date: coerce.date().optional(),
  }),
});

export const collections = {
  tipsyguias,
};
