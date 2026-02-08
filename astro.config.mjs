// @ts-check
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  site: 'https://ovidijusulis-ctrl.github.io',
  base: '/ovi-study-site/',
  integrations: [preact()]
});
