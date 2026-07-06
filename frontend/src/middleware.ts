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
      const kv = import.meta.env.DEV ? (context.locals as any).runtime?.env?.SESSION : env.SESSION;
      let linksMap: Record<string, any> | null = null;

      if (kv) {
        const cached = await kv.get('links:all');
        if (cached) linksMap = JSON.parse(cached);
      }

      if (!linksMap && db) {
        const { results } = await db.prepare("SELECT slug, url, statusCode, isActive FROM Link").all();
        linksMap = {};
        for (const r of (results || [])) linksMap[r.slug] = r;
        if (kv) {
          await kv.put('links:all', JSON.stringify(linksMap), { expirationTtl: 86400 });
        }
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

  // ========== AUTH GUARD ==========
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Exclude login routes from auth guard
    const isLoginRoute = pathname === '/admin/login' || pathname === '/api/admin/login';
    if (!isLoginRoute) {
      const sessionCookie = context.cookies.get('admin_session')?.value;
      if (!sessionCookie) {
        if (pathname.startsWith('/api/')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        return context.redirect('/admin/login');
      }

      // We need to import verifySession dynamically to avoid middleware issues
      // But we can also just rely on it directly since it's edge compatible
      // Note: we can't await inside the sync setup of locals, so we verify here
      // To keep it simple, we verify it right now using dynamic import
      
      const { verifySession } = await import('./lib/auth');
      const payload = await verifySession(sessionCookie, globalThis.__env__ || env);
      
      if (!payload) {
        if (pathname.startsWith('/api/')) {
          return new Response(JSON.stringify({ error: 'Invalid Session' }), { status: 401 });
        }
        return context.redirect('/admin/login');
      }
      
      // Inject user payload into locals
      (context.locals as any).user = payload;
    }
  }
  
  // Basic authorize stub
  (context.locals as any).authorize = (action: string, resource: string) => {
    // If not user, return false (unless it's login)
    if (!(context.locals as any).user) return false;
    return true; 
  };

  // ========== SECURITY HEADERS ==========
  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
});
