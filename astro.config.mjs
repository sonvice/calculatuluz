import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

import vue from '@astrojs/vue';

export default defineConfig({
  output: 'server',
  site: 'http://localhost:4321/',

  adapter: netlify({
    edge: false, 
  }),

  integrations: [vue()],
});