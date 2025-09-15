import { auth, type BaseUser} from "@tern-secure/nextjs/server";
import { ProtectedPageClient } from "./protectedClient";

export const dynamic = "force-dynamic";

export default async function ProtectedPage() {
  const { sessionClaims, userId } = await auth();

  if (!userId) return null;

  const user: BaseUser = {
    uid: sessionClaims.uid,
    email: sessionClaims.email || null,
    emailVerified: sessionClaims.emailVerified || null,
    tenantId: sessionClaims.tenantId || null,
  };

  return <ProtectedPageClient user={user} />
}
