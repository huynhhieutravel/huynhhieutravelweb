import { env } from "cloudflare:workers";
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  // Local Dev: Inject Cloudflare bindings (D1)
  if (import.meta.env.DEV) {
    if (!(context.locals as any).runtime?.env?.DB) {
      try {
        const { getPlatformProxy } = await import('wrangler');
        const proxy = await getPlatformProxy();
        (context.locals as any).runtime = { env: proxy.env };
      } catch (e) {
        console.warn('Could not inject platform proxy:', e);
      }
    }
  }

  // ========== LINK REDIRECT ==========
  const RESERVED = new Set([
    'admin', 'api', '_astro', 'assets', 'images',
    'favicon.ico', 'robots.txt', 'sitemap.xml'
  ]);
  const firstSegment = pathname.split('/')[1];

  if (firstSegment && !RESERVED.has(firstSegment) && !pathname.includes('.')) {
    try {
      const db = import.meta.env.DEV ? (context.locals as any).runtime?.env?.DB : env.DB;
      let linksMap: Record<string, any> | null = null;

      if (!linksMap && db) {
        const { results } = await db.prepare("SELECT slug, url, statusCode, isActive FROM Link").all();
        linksMap = {};
        for (const r of (results || [])) linksMap[r.slug] = r;
      }

      if (linksMap) {
        const slug = pathname.replace(/^\//, '');
        const link = linksMap[slug];
        if (link && link.isActive && link.url) {
          const u = new URL(link.url);
          const allowed = ['http:', 'https:', 'mailto:', 'tel:', 'sms:', 'zalo:'];
          if (allowed.includes(u.protocol)) {
            const sc = link.statusCode || 302;
            return new Response(null, {
              status: sc,
              headers: {
                'Location': link.url,
                'Cache-Control': sc === 301
                  ? 'public, max-age=3600'
                  : 'no-store, no-cache, must-revalidate, max-age=0',
              },
            });
          }
        }
      }
    } catch (e) {
      console.warn('Link redirect error:', e);
    }
  }

  // ========== AUTH GUARD (Tạm thời bỏ qua nếu chưa setup auth) ==========
  // if (pathname.startsWith('/admin')) {
  //   // verify session
  // }
  
  // Stub authorize cho Admin UI
  (context.locals as any).authorize = (action: string, resource: string) => {
    return true; // Tạm thời cho phép tất cả để render UI
  };

  return next();
});
