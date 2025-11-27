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
  firebaseAdminConfig: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  },
  session: { maxAge: '1 hour' }
},
);
