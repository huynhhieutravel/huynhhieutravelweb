import { env } from "cloudflare:workers";
import type { APIRoute } from 'astro';
import { verifyPassword, createSession } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Missing email or password' }), { status: 400 });
    }

    const user = await db.prepare("SELECT * FROM User WHERE email = ?").bind(email).first();
    if (!user || !user.passwordHash) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash as string);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    // Create session token
    const token = await createSession(user.id as string, user.email as string, env);

    // Set HTTP-only cookie
    cookies.set('admin_session', token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return new Response(JSON.stringify({ success: true, redirect: '/admin' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
