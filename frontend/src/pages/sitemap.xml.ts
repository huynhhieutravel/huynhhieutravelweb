import { env } from "cloudflare:workers";
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const db = env.DB;
  if (!db) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { 'Content-Type': 'application/xml' }
    });
  }

  const siteUrl = 'https://huynhhieutravel.com';

  try {
    const { results: posts } = await db.prepare("SELECT slug, updatedAt FROM Post WHERE status = 'published' ORDER BY updatedAt DESC").all();
    const { results: pages } = await db.prepare("SELECT slug, updatedAt FROM Page WHERE status = 'published' ORDER BY updatedAt DESC").all();

    const allUrls = [
      { url: `${siteUrl}/`, lastmod: new Date().toISOString() },
      { url: `${siteUrl}/blog`, lastmod: new Date().toISOString() },
      ...(pages || []).map((p: any) => ({
        url: `${siteUrl}/${p.slug}`,
        lastmod: p.updatedAt || new Date().toISOString()
      })),
      ...(posts || []).map((p: any) => ({
        url: `${siteUrl}/${p.slug}`,
        lastmod: p.updatedAt || new Date().toISOString()
      }))
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.url}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`).join('\\n')}
</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    return new Response('Error generating sitemap', { status: 500 });
  }
};
