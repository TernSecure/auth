import { getToken } from 'firebase/app-check';

import type { TernSecureAuth } from '../resources/internal';

export class FraudProtection {
  private static instance: FraudProtection;

  private constructor() {}

  public static getInstance(): FraudProtection {
    if (!FraudProtection.instance) {
      FraudProtection.instance = new FraudProtection();
    }
    return FraudProtection.instance;
  }

  public async execute<T>(
    auth: TernSecureAuth,
    callback: (token?: string) => Promise<T>,
  ): Promise<T> {
    let token: string | undefined;

    if (auth.appCheck) {
      try {
        const appCheckTokenResult = await getToken(auth.appCheck, false);
        token = appCheckTokenResult.token;
      } catch (error) {
        console.warn('Failed to get App Check token:', error);
      }
    }

    return callback(token);
  }
}
