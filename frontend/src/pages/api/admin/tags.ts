import { env } from "cloudflare:workers";
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'No DB' }), { status: 500 });

  try {
    const data = await request.json();
    const id = crypto.randomUUID();
    
    await db.prepare("INSERT INTO Tag (id, name, slug) VALUES (?, ?, ?)")
      .bind(id, data.name, data.slug)
      .run();
      
    return new Response(JSON.stringify({ success: true, id }), { status: 200 });
  } catch(e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, locals, url }) => {
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'No DB' }), { status: 500 });

  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    
    await db.prepare("DELETE FROM Tag WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch(e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
