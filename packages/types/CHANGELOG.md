# @tern-secure/types

## 1.1.0

### Minor Changes

- add features to the authentication ([#22](https://github.com/TernSecure/auth/pull/22)) by [@kayp514](https://github.com/kayp514)

- add features to the authentication ([#24](https://github.com/TernSecure/auth/pull/24)) by [@kayp514](https://github.com/kayp514)

### Patch Changes

- feat(auth): enhance sign-in flow with improved redirect handling and session management ([#48](https://github.com/TernSecure/auth/pull/48)) by [@kayp514](https://github.com/kayp514)

- fix(auth): update default project ID in .firebaserc and improve error handling in TokenApi ([#38](https://github.com/TernSecure/auth/pull/38)) by [@kayp514](https://github.com/kayp514)

- feat(auth): implement getAuth functionality for custom token handling ([#29](https://github.com/TernSecure/auth/pull/29)) by [@kayp514](https://github.com/kayp514)

- Refactor authentication types and context ([#43](https://github.com/TernSecure/auth/pull/43)) by [@kayp514](https://github.com/kayp514)

  Updated exports in index.ts to include theme.

  Refactored instanceTree.ts to import types from auth instead of auth module.

  Renamed types in signIn.ts for consistency and clarity.

  Updated signUp.ts to use the new SignInResponse type.

  Removed deprecated ternsecure.ts file.

  Updated pnpm-lock.yaml with new dependencies and versions.

  Added SignInCtx context provider for managing sign-in state and actions in React

- fix: types missing ([#81](https://github.com/TernSecure/auth/pull/81)) by [@kayp514](https://github.com/kayp514)

- feat: Implement Tern Secure instrumentation and authentication for Next.js ([#51](https://github.com/TernSecure/auth/pull/51)) by [@kayp514](https://github.com/kayp514)

- feat(auth): centralize authentication handler options and improve cookie management ([#46](https://github.com/TernSecure/auth/pull/46)) by [@kayp514](https://github.com/kayp514)

- fix(auth): enhance error handling and add referer support in token exchange and session management ([#41](https://github.com/TernSecure/auth/pull/41)) by [@kayp514](https://github.com/kayp514)

- Refactor authentication handling in Next.js app-router ([#44](https://github.com/TernSecure/auth/pull/44)) by [@kayp514](https://github.com/kayp514)
  - Updated error messages in `buildRequestLike` to clarify usage of auth functions.
  - Removed deprecated `useAuth` export and replaced it with `usePromiseAuth` from `PromiseAuthProvider`.
  - Changed import path for `TernSecureProvider` to point to the server version.
  - Deleted unused edge session and JWT verification files to streamline codebase.
  - Introduced `TernSecureProvider` for better state management in the app-router.
  - Added `NextOptionsCtx` and `PromiseAuthProvider` for improved context handling.
  - Enhanced `useAuth` hook to derive authentication state more effectively.
  - Updated types to include extended session claims and user information.
  - Improved serialization of auth objects for server-client communication.

- feat: add appCheckToken support to resetPasswordEmail method and update handler ([#59](https://github.com/TernSecure/auth/pull/59)) by [@kayp514](https://github.com/kayp514)

- feat(auth): implement RequestProcessorContext for enhanced request handling ([#33](https://github.com/TernSecure/auth/pull/33)) by [@kayp514](https://github.com/kayp514)

- fix(auth): enhance error handling and response structure in session creation ([#37](https://github.com/TernSecure/auth/pull/37)) by [@kayp514](https://github.com/kayp514)

- Update cookie handling and refactor session management in TernSecureAuth and related modules ([#28](https://github.com/TernSecure/auth/pull/28)) by [@kayp514](https://github.com/kayp514)

- feat(auth): enhance phone authentication flow with reCAPTCHA support and verification code handling ([#53](https://github.com/TernSecure/auth/pull/53)) by [@kayp514](https://github.com/kayp514)

- fix(auth): update cookie handling and session management for improved security and configuration ([#42](https://github.com/TernSecure/auth/pull/42)) by [@kayp514](https://github.com/kayp514)

- feat: implemented authentication timeout. ([#52](https://github.com/TernSecure/auth/pull/52)) by [@kayp514](https://github.com/kayp514)

- feat: appcheck uses REST API ([#54](https://github.com/TernSecure/auth/pull/54)) by [@kayp514](https://github.com/kayp514)

- feat: Implement AppCheck token management and verification ([#56](https://github.com/TernSecure/auth/pull/56)) by [@kayp514](https://github.com/kayp514)

- fix(auth): update response handling in getAuth to correctly access idToken and refreshToken ([#40](https://github.com/TernSecure/auth/pull/40)) by [@kayp514](https://github.com/kayp514)

  refactor(TokenApi): streamline exchangeCustomForIdAndRefreshTokens method by removing try-catch and simplifying request logic

  style(TokenApi): standardize string quotes and remove unnecessary whitespace

  chore(request): clean up code by removing extra line in createRequest function

- feat: update sendPasswordResetEmail method to use \_basePost and return SignInResource ([#58](https://github.com/TernSecure/auth/pull/58)) by [@kayp514](https://github.com/kayp514)

- Refactor code structure for improved readability and maintainability ([#76](https://github.com/TernSecure/auth/pull/76)) by [@kayp514](https://github.com/kayp514)

- feat: clearcookie with cookieoptions ([#45](https://github.com/TernSecure/auth/pull/45)) by [@kayp514](https://github.com/kayp514)

- refactor: remove redundant redirect result check in SignIn class and add effect for redirect handling in SignInStart component ([#72](https://github.com/TernSecure/auth/pull/72)) by [@kayp514](https://github.com/kayp514)

- fix: update JWT decoding in getAuthDataFromRequest to use ternDecodeJwt ([#79](https://github.com/TernSecure/auth/pull/79)) by [@kayp514](https://github.com/kayp514)

- fix(auth): update project ID in .firebaserc and enhance error handling in TokenApi ([#36](https://github.com/TernSecure/auth/pull/36)) by [@kayp514](https://github.com/kayp514)

- feat(auth): enhance social sign-in functionality with custom parameters and options ([#47](https://github.com/TernSecure/auth/pull/47)) by [@kayp514](https://github.com/kayp514)

- canary release: Removed getCookieName in custom token ([#30](https://github.com/TernSecure/auth/pull/30)) by [@kayp514](https://github.com/kayp514)

- feat(auth): enhance TernSecureAuth initialization with appName and tenantId options; refactor session management and request handling ([#49](https://github.com/TernSecure/auth/pull/49)) by [@kayp514](https://github.com/kayp514)

- canary release: fix: emulator ([#31](https://github.com/TernSecure/auth/pull/31)) by [@kayp514](https://github.com/kayp514)

- fix(auth): improve error handling in token exchange by checking for idToken ([#39](https://github.com/TernSecure/auth/pull/39)) by [@kayp514](https://github.com/kayp514)

- feat(auth): add debug logging for custom tokens in refreshCookieWithIdToken function ([#35](https://github.com/TernSecure/auth/pull/35)) by [@kayp514](https://github.com/kayp514)

- feat(deps): update React and TypeScript dependencies to use catalog references; ([#50](https://github.com/TernSecure/auth/pull/50)) by [@kayp514](https://github.com/kayp514)

- feat(auth): enhance custom token endpoint for emulator support and add debug logging for cookie extraction ([#32](https://github.com/TernSecure/auth/pull/32)) by [@kayp514](https://github.com/kayp514)

## 1.0.5

### Patch Changes

- aeb1f5a: Canary Release

## 1.0.4

### Patch Changes

- 2e908c2: enhance versioning across packages.

## 1.0.3

### Patch Changes

- 7af68e4: update backend

## 1.0.2

### Patch Changes

- 5f29862: advanced Auth cookies and session management

## 1.0.1

### Patch Changes

- 367a100: fix: Update ternUIgetScriptUrl to use TernSecureDev flag and switch CDN to HTTPS.

## 1.0.0

### Major Changes

- 2603f2b: Initial stable release of TernSecure Authentication SDK

  This marks the first major release of the TernSecure Authentication monorepo, introducing a complete TypeScript SDK built on Firebase Authentication. The release includes:
  - Core authentication utilities and types
  - React hooks and components for seamless integration
  - UI components library with form handling
  - Backend utilities for server-side operations
  - Comprehensive TypeScript support

  All packages are now stable and ready for production use in React applications, Next.js projects, and general JavaScript/TypeScript environments.
