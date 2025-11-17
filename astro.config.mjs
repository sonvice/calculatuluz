import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

import vue from '@astrojs/vue';

import partytown from '@astrojs/partytown';

import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

import react from '@astrojs/react';

export default defineConfig({
  output: 'server',
  site: 'https://calculatuluz.es',

  adapter: netlify({
    edge: true, 
  }),

  integrations: [vue(), partytown({
    config: {
      forward: ['dataLayer.push']
    }
  }), mdx(), sitemap({
    customPages: [
      'https://calculatuluz.es/',
      'https://calculatuluz.es/tipsyguias',
      'https://calculatuluz.es/precio-luz-hoy',
    ],
  }), react()],
});