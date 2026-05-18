import { NextRequest, NextResponse } from 'next/server';
import { signToken, verifyCredentials, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!verifyCredentials(username, password)) {
    return NextResponse.json({ error: 'ユーザー名またはパスワードが正しくありません' }, { status: 401 });
  }

  const token = await signToken();
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
