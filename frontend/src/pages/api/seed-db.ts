import { env } from "cloudflare:workers";
import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'No DB configured' }), { status: 500 });

  try {
    const schemaPath = path.resolve(process.cwd(), 'schema.sql');
    const seedPath = path.resolve(process.cwd(), 'dummy_seed.sql');
    
    const schemaSql = await fs.readFile(schemaPath, 'utf-8');
    const seedSql = await fs.readFile(seedPath, 'utf-8');
    
    const statements = [...schemaSql.split(';'), ...seedSql.split(';')];
    const queries = statements
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => db.prepare(s));
      
    await db.batch(queries);
    
    return new Response(JSON.stringify({ success: true, message: 'Database seeded successfully!' }), { status: 200, headers: {'Content-Type': 'application/json'} });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500, headers: {'Content-Type': 'application/json'} });
  }
};
