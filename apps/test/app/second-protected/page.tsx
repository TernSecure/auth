import { auth, type BaseUser} from "@tern-secure/nextjs/server";
import { SecondProtectedPageClient} from "./secondProtectedClient";

export const dynamic = "force-dynamic";

export default async function ProtectedPage() {
  const { sessionClaims } = await auth();

  if (!sessionClaims?.uid) return null;

  const user: BaseUser = {
    uid: sessionClaims.uid,
    email: sessionClaims.email || null,
    emailVerified: sessionClaims.emailVerified || null,
    tenantId: sessionClaims.tenantId || null,
  };

  return <SecondProtectedPageClient user={user} />
}
