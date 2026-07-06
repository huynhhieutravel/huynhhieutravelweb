import { SignJWT, jwtVerify } from 'jose';

// Secret key for JWT. In production, this should be in env!
// For simplicity, we use a fallback if not provided.
const getSecret = (env: any) => new TextEncoder().encode(env?.JWT_SECRET || 'super-secret-huynhhieutravel-key-2026');

/**
 * Creates a JWT session token
 */
export async function createSession(userId: string, email: string, env: any): Promise<string> {
  const secret = getSecret(env);
  const jwt = await new SignJWT({ id: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
  return jwt;
}

/**
 * Verifies a JWT session token
 */
export async function verifySession(token: string, env: any) {
  try {
    const secret = getSecret(env);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Basic Hash Password using Web Crypto (SHA-256)
 * Note: A proper system uses PBKDF2/Argon2. We use SHA-256 with salt for simplicity in edge.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = "huynhhieu_salt_";
  const msgUint8 = new TextEncoder().encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}
