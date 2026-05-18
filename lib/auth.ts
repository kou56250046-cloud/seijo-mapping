import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'seijo_auth';

const getSecret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function signToken(): Promise<string> {
  return new SignJWT({ sub: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export function verifyCredentials(username: string, password: string): boolean {
  return username === 'seijomap' && password === 'seijo2026';
}
