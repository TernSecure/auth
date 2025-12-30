import { auth } from '@tern-secure/nextjs/server';
import { ProtectedPageClient } from './protectedClient';

export const dynamic = 'force-dynamic';

export default async function ProtectedPage() {
  const { sessionClaims, require, redirectToSignIn } = await auth();
  if (!require({ role: 'admin' })) return <div>Access Denied now</div>;

  if (!sessionClaims?.aud) return redirectToSignIn();

  return <ProtectedPageClient user={sessionClaims} />;
}
