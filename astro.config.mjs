import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

import vue from '@astrojs/vue';

export default defineConfig({
  output: 'server',
  site: 'http://localhost:4321/',

  adapter: node({
    mode: 'standalone',
  }),

  integrations: [vue()],
});