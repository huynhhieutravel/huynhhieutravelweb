import { env } from "cloudflare:workers";
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, url }) => {
  const db = env.DB;
  const r2 = env.MEDIA;
  if (!db || !r2) return new Response(JSON.stringify({ error: 'DB or R2 not configured' }), { status: 500 });

  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) return new Response(JSON.stringify({ error: 'No file' }), { status: 400 });

  const timestamp = Date.now();
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-');
  const key = `uploads/${timestamp}-${safeName}`;

  try {
    await r2.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type }
    });

    const publicUrl = `https://media.huynhhieutravel.com/${key}`;
    const mediaId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.prepare(
      `INSERT INTO Media (id, url, filename, mimeType, sizeBytes, createdAt) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(mediaId, publicUrl, file.name, file.type, file.size, now).run();

    return new Response(JSON.stringify({
      success: true,
      data: { id: mediaId, url: publicUrl, filename: file.name, size: file.size }
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};
