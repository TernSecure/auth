---
'@tern-secure/backend': patch
'@tern-secure/nextjs': patch
'@tern-secure/shared': patch
'@tern-secure/react': patch
'@tern-secure/types': patch
'@tern-secure/auth': patch
---

Refactor authentication handling in Next.js app-router

- Updated error messages in `buildRequestLike` to clarify usage of auth functions.
- Removed deprecated `useAuth` export and replaced it with `usePromiseAuth` from `PromiseAuthProvider`.
- Changed import path for `TernSecureProvider` to point to the server version.
- Deleted unused edge session and JWT verification files to streamline codebase.
- Introduced `TernSecureProvider` for better state management in the app-router.
- Added `NextOptionsCtx` and `PromiseAuthProvider` for improved context handling.
- Enhanced `useAuth` hook to derive authentication state more effectively.
- Updated types to include extended session claims and user information.
- Improved serialization of auth objects for server-client communication.
