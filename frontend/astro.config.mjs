import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

const isDev = process.env.npm_lifecycle_event === 'dev';

export default defineConfig({
  output: 'server',
  redirects: {
    '/home': '/'
  },
  adapter: isDev ? undefined : cloudflare({
    platformProxy: {
      enabled: true
    }
  }),
  integrations: [react()],
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'wrangler-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!globalThis.__env__) {
              const { getPlatformProxy } = await import('wrangler');
              const proxy = await getPlatformProxy();
              globalThis.__env__ = proxy.env;
            }
            if (!req.locals) req.locals = {};
            if (!req.locals.runtime) req.locals.runtime = {};
            req.locals.runtime.env = globalThis.__env__;
            next();
          });
        }
      }
    ]
  }
});
