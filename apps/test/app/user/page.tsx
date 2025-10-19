'use server';

import { createBackendInstanceClient } from '@tern-secure/backend';
import { headers, cookies } from 'next/headers';

const backendOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  apiUrl: process.env.TERNSECURE_API_URL || '',
  apiVersion: process.env.TERNSECURE_API_VERSION || 'v1',
};

export default async function UserPage() {
  const headersList = await headers();
  const cookiesList = await cookies();
  const idToken = cookiesList.get('__dev_FIREBASE_[DEFAULT]')?.value;
  const userData = await createBackendInstanceClient(backendOptions).userData.getUserData(
    backendOptions.apiKey,
    { idToken },
    { referer: headersList.get('referer') || undefined },
  );

  return userData.data;
}
