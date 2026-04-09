import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_AUTH_COOKIE, createAdminAuthToken, getAdminCredentials } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { loginId, password } = await request.json();
    if (!loginId || !password) {
      return NextResponse.json({ error: 'Login ID and password are required.' }, { status: 400 });
    }

    const admin = getAdminCredentials();
    if (loginId !== admin.loginId || password !== admin.password) {
      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
    }

    const token = createAdminAuthToken(loginId);
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to login.' }, { status: 500 });
  }
}
