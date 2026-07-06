import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

async function hashPassword(password: string) {
  const salt = 'huynhhieu_salt_';
  const msgUint8 = new TextEncoder().encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Chưa đăng nhập' }), { 
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return new Response(JSON.stringify({ success: false, error: 'Thiếu thông tin mật khẩu' }), { 
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const d1Db = env.DB;
    if (!d1Db) throw new Error('Database not connected');

    // Verify current password
    const currentHash = await hashPassword(currentPassword);
    
    // Get user from DB
    const dbUser = await d1Db.prepare("SELECT passwordHash FROM User WHERE id = ?").bind(user.id).first();
    
    if (!dbUser || dbUser.passwordHash !== currentHash) {
      return new Response(JSON.stringify({ success: false, error: 'Mật khẩu hiện tại không đúng' }), { 
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update to new password
    const newHash = await hashPassword(newPassword);
    await d1Db.prepare("UPDATE User SET passwordHash = ? WHERE id = ?").bind(newHash, user.id).run();

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Lỗi server: ' + error.message }), { 
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
