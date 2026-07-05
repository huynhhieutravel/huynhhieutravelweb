import { env } from "cloudflare:workers";
import type { APIRoute } from 'astro';

export const prerender = false;

async function invalidateCache() {
  const kv = env.KV;
  if (kv) await kv.delete('links:all');
}

export const POST: APIRoute = async ({ request, locals }) => {
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  const { slug, label, url, statusCode, isActive } = await request.json();

  try {
    await db.prepare(`
      INSERT INTO Link (slug, label, url, statusCode, isActive) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(slug, label, url, statusCode || 302, isActive ? 1 : 0).run();
    
    await invalidateCache();
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'Missing DB' }), { status: 400 });

  const { slug, label, url, statusCode, isActive } = await request.json();

  try {
    await db.prepare(`
      UPDATE Link 
      SET label=?, url=?, statusCode=?, isActive=?
      WHERE slug=?
    `).bind(label, url, statusCode || 302, isActive ? 1 : 0, slug).run();
    
    await invalidateCache();
    return new Response(JSON.stringify({ success: true }));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ url, locals }) => {
  const db = env.DB;
  const slug = url.searchParams.get('slug');
  if (!db || !slug) return new Response(JSON.stringify({ error: 'Missing DB or slug' }), { status: 400 });

  try {
    await db.prepare("DELETE FROM Link WHERE slug=?").bind(slug).run();
    
    await invalidateCache();
    return new Response(JSON.stringify({ success: true }));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};
