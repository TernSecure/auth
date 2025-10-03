import {
  createTernSecureNextJsHandler,
  type TernSecureHandlerOptions,
} from '@tern-secure/nextjs/admin';

export const runtime = 'nodejs';

const authHandlerOptions: TernSecureHandlerOptions = {
  cors: {
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001', 'https://ternsecure.com'],
    allowedMethods: ['GET', 'POST'],
  },
  cookies: {
    httpOnly: true,
    sameSite: 'strict',
  },
  security: {
    allowedReferers: ['https://ternsecure.com'],
  },
  debug: process.env.NODE_ENV === 'development',
};

const { GET, POST } = createTernSecureNextJsHandler(authHandlerOptions);

export { GET, POST };
