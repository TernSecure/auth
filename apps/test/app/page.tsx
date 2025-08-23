'use client'

import { useAuth } from "@tern-secure/nextjs"
import { useRouter } from "next/navigation"
import { clearNextSessionCookie } from "./actions";

export default function Home() {
  const router = useRouter();
  const { user, isLoaded, signOut } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) return null;

  const redirectToMoPage = () => {
    router.push('/mo');
  };

  const redirectToDashboard = () => {
    router.push('/dashboard');
  };

  const redirectToProtected = () => {
    router.push('/protected');
  };

  const createSignOut = async () => {
    await signOut({
      redirectUrl: '/dashboard',
      async onBeforeSignOut() {
        await clearNextSessionCookie().catch((error) => {
          console.error('Error clearing session cookie:', error);
        });
      },
    });
  }


  return (
    <div>
      <h1>Welcome, {user?.displayName || user?.email}</h1>
          <button onClick={redirectToMoPage}>
            Visit Mo Page
          </button>

      <button
        onClick={redirectToDashboard}
        className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Dashboard
      </button>
      <button
        onClick={redirectToProtected}
        className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Server Side Page
      </button>

      <button
        onClick={createSignOut}
        className="ml-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Sign Out
      </button>

    </div>
  );
}
