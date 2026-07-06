import { env } from "cloudflare:workers";
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  const { title, slug, excerpt, content, status, categoryId, featuredImage, tags, seoTitle, seoDescription, ogImage, customSchema, schemaEnabled } = await request.json();
  const id = crypto.randomUUID();
  const userId = locals?.user?.id || null;

  try {
    const stmts = [
      db.prepare(`
        INSERT INTO Post (id, title, slug, excerpt, content, status, categoryId, featuredImage, seoTitle, seoDescription, ogImage, customSchema, schemaEnabled, schemaUpdatedAt, schemaUpdatedBy) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `).bind(id, title, slug, excerpt, content, status, categoryId || null, featuredImage || null, seoTitle || null, seoDescription || null, ogImage || null, customSchema || null, schemaEnabled || 1, userId)
    ];

    if (tags) {
      const tagList = tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
      for (const tName of tagList) {
        const tSlug = tName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const tagId = crypto.randomUUID();
        // Insert tag if not exists (using a simple approach: just try insert, ignore if exists by slug)
        stmts.push(db.prepare(`INSERT OR IGNORE INTO Tag (id, name, slug) VALUES (?, ?, ?)`).bind(tagId, tName, tSlug));
        // Then we need to map PostTag. But since INSERT OR IGNORE doesn't return the existing ID easily in D1,
        // it's better to run this sequentially instead of batch, or just do a subquery.
        stmts.push(db.prepare(`INSERT INTO PostTag (postId, tagId) SELECT ?, id FROM Tag WHERE slug = ?`).bind(id, tSlug));
      }
    }

    await db.batch(stmts);
    return new Response(JSON.stringify({ success: true, id }), { status: 201 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};

export const PATCH: APIRoute = async ({ request, url, locals }) => {
  const db = env.DB;
  const id = url.searchParams.get('id');
  if (!db || !id) return new Response(JSON.stringify({ error: 'Missing DB or ID' }), { status: 400 });

  const { title, slug, excerpt, content, status, categoryId, featuredImage, tags, seoTitle, seoDescription, ogImage, customSchema, schemaEnabled } = await request.json();
  const userId = locals?.user?.id || null;

  try {
    const stmts = [
      db.prepare(`
        UPDATE Post 
        SET title=?, slug=?, 
            excerpt=COALESCE(NULLIF(?, ''), excerpt), 
            content=COALESCE(NULLIF(?, ''), content), 
            status=?, categoryId=?, featuredImage=?, 
            seoTitle=?, seoDescription=?, ogImage=?, customSchema=?, schemaEnabled=?, schemaUpdatedAt=CURRENT_TIMESTAMP, schemaUpdatedBy=?, updatedAt=datetime('now')
        WHERE id=?
      `).bind(title, slug, excerpt, content, status, categoryId || null, featuredImage || null, seoTitle || null, seoDescription || null, ogImage || null, customSchema || null, schemaEnabled || 1, userId, id),
      db.prepare(`DELETE FROM PostTag WHERE postId = ?`).bind(id)
    ];

    if (tags) {
      const tagList = tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
      for (const tName of tagList) {
        const tSlug = tName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const tagId = crypto.randomUUID();
        stmts.push(db.prepare(`INSERT OR IGNORE INTO Tag (id, name, slug) VALUES (?, ?, ?)`).bind(tagId, tName, tSlug));
        stmts.push(db.prepare(`INSERT INTO PostTag (postId, tagId) SELECT ?, id FROM Tag WHERE slug = ?`).bind(id, tSlug));
      }
    }

    await db.batch(stmts);
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
    await db.prepare("DELETE FROM Post WHERE id=?").bind(id).run();
    return new Response(JSON.stringify({ success: true }));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};
