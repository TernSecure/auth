import { auth } from "@tern-secure/nextjs/server";
import { ProtectedPageClient } from "./protectedClient";

export const dynamic = "force-dynamic";

export default async function ProtectedPage() {
  const session = await auth();

  if (!session || !session.user) return null;

  const user = session.user;

  return <ProtectedPageClient user={user} />;
}
