import { auth } from '@tern-secure/nextjs/server';
import { ProtectedPageClient } from './protectedClient';

export const dynamic = 'force-dynamic';

export default async function ProtectedPage() {
  const { user, require } = await auth();
  if (!require({ role: 'admin' })) return <div>Access Denied</div>;

  if (!user) return null;

  return <ProtectedPageClient user={user} />;
}
