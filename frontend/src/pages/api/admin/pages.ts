import { env } from "cloudflare:workers";
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  const { title, slug, content, status } = await request.json();
  const id = crypto.randomUUID();

  try {
    await db.prepare(`
      INSERT INTO Page (id, title, slug, content, status) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, title, slug, content, status).run();
    return new Response(JSON.stringify({ success: true, id }), { status: 201 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};

export const PATCH: APIRoute = async ({ request, url, locals }) => {
  const db = env.DB;
  const id = url.searchParams.get('id');
  if (!db || !id) return new Response(JSON.stringify({ error: 'Missing DB or ID' }), { status: 400 });

  const { title, slug, content, status } = await request.json();

  try {
    await db.prepare(`
      UPDATE Page 
      SET title=?, slug=?, content=COALESCE(NULLIF(?, ''), content), status=?, updatedAt=datetime('now')
      WHERE id=?
    `).bind(title, slug, content, status, id).run();
    return new Response(JSON.stringify({ success: true }));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ url, locals }) => {
  const db = env.DB;
  const id = url.searchParams.get('id');
  if (!db || !id) return new Response(JSON.stringify({ error: 'Missing DB or ID' }), { status: 400 });

  try {
    await db.prepare("DELETE FROM Page WHERE id=?").bind(id).run();
    return new Response(JSON.stringify({ success: true }));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};
