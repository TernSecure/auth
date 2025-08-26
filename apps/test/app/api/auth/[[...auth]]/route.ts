import { createTernSecureNextJsHandler } from '@tern-secure/nextjs/admin';

export const runtime = 'nodejs';

const authHandlerOptions = {
  cors: {
    allowedOrigins: ['http://localhost:3000', 'https://ternsecure.com'],
    allowedMethods: ['GET', 'POST'],
  },
  security: {
    requireCSRF: true,
    allowedReferers: ['localhost:3000', 'ternsecure.com'],
  },
  debug: process.env.NODE_ENV === 'development',
};

const { GET, POST } = createTernSecureNextJsHandler(authHandlerOptions);

export { GET, POST };
