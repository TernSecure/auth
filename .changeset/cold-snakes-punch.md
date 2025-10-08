---
'@tern-secure/nextjs': patch
'@tern-secure/shared': patch
'@tern-secure/react': patch
'@tern-secure/types': patch
'@tern-secure/auth': patch
---

Refactor authentication types and context

Updated exports in index.ts to include theme.

Refactored instanceTree.ts to import types from auth instead of auth module.

Renamed types in signIn.ts for consistency and clarity.

Updated signUp.ts to use the new SignInResponse type.

Removed deprecated ternsecure.ts file.

Updated pnpm-lock.yaml with new dependencies and versions.

Added SignInCtx context provider for managing sign-in state and actions in React
