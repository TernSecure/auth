import { ternSecureMiddleware, createRouteMatcher } from '@tern-secure/nextjs/server';

const publicPaths = createRouteMatcher(['/sign-in', '/sign-up', '/unauthorized', '/api/auth/(.*)']);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

export default ternSecureMiddleware(
  async (auth, request) => {
    const url = new URL('/unauthorized', request.url);
    if (!publicPaths(request)) {
      await auth.protect()
    }
  },
  {
    debug: true,
    checkRevoked: {
      enabled: true,
      adapter: {
        type: 'redis',
        config: {
          url: process.env.KV_REST_API_URL!,
          token: process.env.KV_REST_API_TOKEN!,
          keyPrefix: process.env.REDIS_KEY_PREFIX!,
        },
      },
    },
  },
);
