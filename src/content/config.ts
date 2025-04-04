import { z, defineCollection, reference } from 'astro:content';

const blogCollection = defineCollection({
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    author: reference('authors'),
    related: z.array(reference('blog')).optional(),
    featuredImage: image(),
    energyClass: z.enum(['A+++', 'A++', 'A+', 'A', 'B', 'C', 'D']),
    tags: z.array(z.string()),
    draft: z.boolean().default(false)
  })
});

const authorsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.string()
  })
});

export const collections = {
  blog: blogCollection,
  authors: authorsCollection
};