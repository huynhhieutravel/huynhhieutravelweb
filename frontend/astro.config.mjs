import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

const isDev = process.env.npm_lifecycle_event === 'dev';

export default defineConfig({
  output: 'server',
  adapter: isDev ? undefined : cloudflare({
    platformProxy: {
      enabled: true
    }
  })
});
