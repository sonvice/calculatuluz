import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

import vue from '@astrojs/vue';

import partytown from '@astrojs/partytown';

export default defineConfig({
  output: 'server',
  site: 'https://calculatuluz.es/',

  adapter: netlify({
    edge: false, 
  }),

  integrations: [vue(), partytown({
    config: {
      forward: ['dataLayer.push']
    }
  })],
});