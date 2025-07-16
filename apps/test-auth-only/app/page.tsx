'use client'

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, error } = useAuth();
  console.log('[Home] - User:', user);


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
    </div>
  );
}
