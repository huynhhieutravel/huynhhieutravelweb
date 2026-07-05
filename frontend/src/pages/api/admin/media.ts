import { env } from "cloudflare:workers";
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '80', 10);
  const search = url.searchParams.get('search') || '';
  const offset = (page - 1) * limit;

  try {
    let countQuery = "SELECT COUNT(*) as total FROM Media";
    let dataQuery = "SELECT * FROM Media ORDER BY createdAt DESC LIMIT ? OFFSET ?";
    const countParams: any[] = [];
    const dataParams: any[] = [limit, offset];

    if (search.trim() !== '') {
      const searchPattern = `%${search.trim().substring(0, 40)}%`;
      countQuery = "SELECT COUNT(*) as total FROM Media WHERE filename LIKE ? OR title LIKE ? OR altText LIKE ?";
      dataQuery = "SELECT * FROM Media WHERE filename LIKE ? OR title LIKE ? OR altText LIKE ? ORDER BY createdAt DESC LIMIT ? OFFSET ?";
      countParams.push(searchPattern, searchPattern, searchPattern);
      dataParams.unshift(searchPattern, searchPattern, searchPattern);
    }

    const countRes = await db.prepare(countQuery).bind(...countParams).first<{ total: number }>();
    const totalCount = countRes?.total || 0;
    const { results } = await db.prepare(dataQuery).bind(...dataParams).all();

    const mediaList = (results || []).map(item => {
      const d = new Date(item.createdAt || new Date().toISOString());
      return {
        id: item.id,
        src: item.url,
        name: (item.filename || '').replace(/^uploads\//, ''),
        size: item.sizeBytes ? (item.sizeBytes / 1024).toFixed(1) + ' KB' : 'Unknown',
        dim: (item.width && item.height) ? `${item.width}×${item.height}` : '',
        alt: (item.altText || '').trim(),
        title: (item.title || item.filename || '').trim(),
        caption: (item.caption || '').trim(),
        desc: (item.description || '').trim(),
        date: item.createdAt,
        displayDate: d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN')
      };
    });

    return new Response(JSON.stringify({ 
      success: true, 
      media: mediaList,
      pagination: { total: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) }
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB Error' }), { status: 500 });

  const body = await request.json();
  const { id, altText, title, caption, description } = body;
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

  const setClauses: string[] = [];
  const values: any[] = [];
  if (altText !== undefined) { setClauses.push("altText = ?"); values.push(altText); }
  if (title !== undefined) { setClauses.push("title = ?"); values.push(title); }
  if (caption !== undefined) { setClauses.push("caption = ?"); values.push(caption); }
  if (description !== undefined) { setClauses.push("description = ?"); values.push(description); }

  if (setClauses.length === 0) return new Response(JSON.stringify({ error: 'No fields' }), { status: 400 });

  values.push(id);
  await db.prepare(`UPDATE Media SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run();
  
  return new Response(JSON.stringify({ success: true, id }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const db = env.DB;
  const r2 = env.MEDIA;
  if (!db || !r2) return new Response(JSON.stringify({ error: 'DB/R2 Error' }), { status: 500 });

  const body = await request.json();
  const { ids } = body;
  if (!ids || !Array.isArray(ids)) return new Response(JSON.stringify({ error: 'Missing ids' }), { status: 400 });

  const results = [];
  for (const id of ids) {
    try {
      const media = await db.prepare("SELECT url FROM Media WHERE id = ?").bind(id).first();
      if (media && media.url) {
        // Extract key from URL (media.huynhhieutravel.com/...)
        const parts = media.url.split('media.huynhhieutravel.com/');
        if (parts.length > 1) {
          await r2.delete(parts[1]);
        }
      }
      await db.prepare("DELETE FROM Media WHERE id = ?").bind(id).run();
      results.push({ id, status: 'deleted' });
    } catch (err: any) {
      results.push({ id, status: 'error', reason: err.message });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), { headers: { 'Content-Type': 'application/json' } });
};
