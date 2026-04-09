import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_AUTH_COOKIE, verifyAdminAuthToken } from '@/lib/admin-auth';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_AUTH_COOKIE)?.value;
  const isAuthed = verifyAdminAuthToken(token);

  if (!isAuthed) {
    redirect('/admin/login');
  }

  return <>{children}</>;
}
