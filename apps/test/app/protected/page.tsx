import { auth } from '@tern-secure/nextjs/server';
import { ProtectedPageClient } from './protectedClient';

export const dynamic = 'force-dynamic';

export default async function ProtectedPage() {
  const { user, require, redirectToSignIn } = await auth();
  if (!require({ role: 'admin' })) return <div>Access Denied now</div>;

  if (!user) return redirectToSignIn();

  return <ProtectedPageClient user={user} />;
}
