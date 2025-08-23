import { auth, type BaseUser} from "@tern-secure/nextjs/server";
import { SecondProtectedPageClient} from "./secondProtectedClient";

export const dynamic = "force-dynamic";

export default async function ProtectedPage() {
  const { session } = await auth();

  if (!session) return null;

  const user: BaseUser = {
    uid: session.uid,
    email: session.email || null,
    emailVerified: session.emailVerified || null,
    tenantId: session.tenantId || null,
  };

  return <SecondProtectedPageClient user={user} />
}
