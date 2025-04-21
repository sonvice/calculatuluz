import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tipsyguias = defineCollection({
  loader: glob({
    base: './src/tips/tipsyguias',
    pattern: '**/*.md' 
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    date: z.coerce.date().optional(),
  }),
});

export const collections = {
  tipsyguias,
};
