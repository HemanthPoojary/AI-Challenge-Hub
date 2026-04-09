import crypto from 'crypto';

export const ADMIN_AUTH_COOKIE = 'admin_auth_token';

export function getAdminCredentials() {
  return {
    loginId: process.env.ADMIN_LOGIN_ID || 'admin',
    password: process.env.ADMIN_LOGIN_PASSWORD || 'Admin@123',
  };
}

function getSigningSecret() {
  return process.env.ADMIN_AUTH_SECRET || 'change-this-admin-auth-secret';
}

export function createAdminAuthToken(loginId: string) {
  const payload = `${loginId}:${Date.now()}`;
  const sig = crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifyAdminAuthToken(token?: string) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [loginId, ts, sig] = decoded.split(':');
    if (!loginId || !ts || !sig) return false;
    const payload = `${loginId}:${ts}`;
    const expected = crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
