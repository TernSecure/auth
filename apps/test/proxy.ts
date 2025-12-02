import { ternSecureProxy, createRouteMatcher } from '@tern-secure/nextjs/server';

const publicPaths = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/unauthorized',
  '/api/auth/(.*)',
  "/__/auth/(.*)",
  "/__/firebase/(.*)"
]);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

export default ternSecureProxy(
  async (auth, request) => {
    if (!publicPaths(request)) {
      await auth.protect((require) => {
        return require({ role: 'admin' });
      });
    }
  }, {
  appCheck: {
    strategy: 'redis',
    skipInMemoryFirst: false,
    redis: {
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    }
  },
  session: { maxAge: '90 minutes' }
},
);
