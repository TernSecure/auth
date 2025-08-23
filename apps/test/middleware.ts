import {
  ternSecureMiddleware,
  createRouteMatcher,
} from "@tern-secure/nextjs/server";

const publicPaths = createRouteMatcher(["/sign-in", "/sign-up"]);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

export default ternSecureMiddleware(
  async (auth, request) => {
    if (!publicPaths(request)) {
      await auth.protect();
    }
  },
  {
    debug: true,
    cookies: {
      session_cookie: {
        name: "_session_cookie",
        attributes: {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict" as const,
          maxAge: 60 * 60 * 24 * 5 * 1000, // 5 days
        },
      },
    },
    checkRevoked: {
      enabled: true,
      adapter: {
        type: "redis",
        config: {
          url: process.env.KV_REST_API_URL!,
          token: process.env.KV_REST_API_TOKEN!,
          keyPrefix: process.env.REDIS_KEY_PREFIX!,
        },
      },
    },
  }
);
