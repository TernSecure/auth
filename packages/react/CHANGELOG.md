# @tern-secure/react

## 1.2.0

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

- fix: update JWT decoding in getAuthDataFromRequest to use ternDecodeJwt ([#79](https://github.com/TernSecure/auth/pull/79)) by [@kayp514](https://github.com/kayp514)

- fix(auth): update project ID in .firebaserc and enhance error handling in TokenApi ([#36](https://github.com/TernSecure/auth/pull/36)) by [@kayp514](https://github.com/kayp514)

- feat(auth): enhance social sign-in functionality with custom parameters and options ([#47](https://github.com/TernSecure/auth/pull/47)) by [@kayp514](https://github.com/kayp514)

- canary release: Removed getCookieName in custom token ([#30](https://github.com/TernSecure/auth/pull/30)) by [@kayp514](https://github.com/kayp514)

- feat(auth): enhance TernSecureAuth initialization with appName and tenantId options; refactor session management and request handling ([#49](https://github.com/TernSecure/auth/pull/49)) by [@kayp514](https://github.com/kayp514)

- canary release: fix: emulator ([#31](https://github.com/TernSecure/auth/pull/31)) by [@kayp514](https://github.com/kayp514)

- fix(auth): improve error handling in token exchange by checking for idToken ([#39](https://github.com/TernSecure/auth/pull/39)) by [@kayp514](https://github.com/kayp514)

- feat(auth): add debug logging for custom tokens in refreshCookieWithIdToken function ([#35](https://github.com/TernSecure/auth/pull/35)) by [@kayp514](https://github.com/kayp514)

- feat(deps): update React and TypeScript dependencies to use catalog references; ([#50](https://github.com/TernSecure/auth/pull/50)) by [@kayp514](https://github.com/kayp514)

- feat: enhance useAuth to support sessionClaims and improve user state handling ([#86](https://github.com/TernSecure/auth/pull/86)) by [@kayp514](https://github.com/kayp514)

- feat(auth): enhance custom token endpoint for emulator support and add debug logging for cookie extraction ([#32](https://github.com/TernSecure/auth/pull/32)) by [@kayp514](https://github.com/kayp514)

- Updated dependencies [[`a3b4db9`](https://github.com/TernSecure/auth/commit/a3b4db954aa667904d33f2a78538d3e5a713f6ac), [`4ae94b2`](https://github.com/TernSecure/auth/commit/4ae94b2a8572e7c747b5be5af409c96d29389a7f), [`f502628`](https://github.com/TernSecure/auth/commit/f5026288569cbebe85fcc4b33fc627c51ba51a63), [`d6f6fb5`](https://github.com/TernSecure/auth/commit/d6f6fb50b3d6039f48ca422ffac321c7849c8f90), [`cf0b8df`](https://github.com/TernSecure/auth/commit/cf0b8df93fa5987398f783b78b112497b4eb65dd), [`27553ab`](https://github.com/TernSecure/auth/commit/27553abbe3574f4a4f3c71ccb32058eb51848487), [`7ce164e`](https://github.com/TernSecure/auth/commit/7ce164e83be56216dd7bf301f371d205f5a03bb1), [`589fe85`](https://github.com/TernSecure/auth/commit/589fe8500c45c1d5c451fe6558bdd3b86f3684df), [`3c779bf`](https://github.com/TernSecure/auth/commit/3c779bfdcc5872e4dddbd71a19363e699e6b6b97), [`a8cee1a`](https://github.com/TernSecure/auth/commit/a8cee1a2cc2bdc59a0147d20306b48a4e933836d), [`fcb909e`](https://github.com/TernSecure/auth/commit/fcb909e9b5b8aba514b59f194886e6dd2d80087e), [`db27265`](https://github.com/TernSecure/auth/commit/db27265152844583de0f89c5b7af075ea9780061), [`5002028`](https://github.com/TernSecure/auth/commit/5002028a57ab959022e8d1e5951b21319bdb3815), [`b4a161a`](https://github.com/TernSecure/auth/commit/b4a161a0f59f3cbf7b57a2b75dcf776e5d46fe82), [`34642ab`](https://github.com/TernSecure/auth/commit/34642abf1dcd5ce485b42343be4bc8182bfad360), [`b342dc4`](https://github.com/TernSecure/auth/commit/b342dc4e7b1969e20aabca988efe51cabc493331), [`dc941c6`](https://github.com/TernSecure/auth/commit/dc941c6f254e9d198d2956696bdec85bf2a6ab88), [`51c563e`](https://github.com/TernSecure/auth/commit/51c563ef5db3ecbc894d14642fe78ddf6ba6f648), [`3567ad0`](https://github.com/TernSecure/auth/commit/3567ad0c467b9c8d16ff11ef934b2a1a74fc6bb3), [`6c3e841`](https://github.com/TernSecure/auth/commit/6c3e8413bbb902a8f2531c0cc920c00f41ebb6ab), [`6bd52d2`](https://github.com/TernSecure/auth/commit/6bd52d270f845de9b9ce8212c72bde979c00a1c4), [`9c5c4aa`](https://github.com/TernSecure/auth/commit/9c5c4aac94775b337ea14dfc4ea91e5790aa80be), [`59a888d`](https://github.com/TernSecure/auth/commit/59a888d13efc248289a4f99e224a52ca144b4590), [`b39d9bc`](https://github.com/TernSecure/auth/commit/b39d9bc38db6896a8f33c8a641d22d95ff9771ff), [`fb08ec2`](https://github.com/TernSecure/auth/commit/fb08ec210f9a324ab76947cda4bb539c9d482def), [`be59eda`](https://github.com/TernSecure/auth/commit/be59eda4c9696c4ef8719d46bcc61f6799d41c6a), [`844b992`](https://github.com/TernSecure/auth/commit/844b9925651c41b1d1e55c004348a6cd9a358f8f), [`8b9c2bb`](https://github.com/TernSecure/auth/commit/8b9c2bbaeddceb31ed5c7e7131bf3ed2ba541012), [`728c672`](https://github.com/TernSecure/auth/commit/728c6723e35a75c97f3fcd246283b5c443b31e7c), [`a90bf41`](https://github.com/TernSecure/auth/commit/a90bf410443eaa0f2ad5618123d980942b00f30e), [`38e9681`](https://github.com/TernSecure/auth/commit/38e9681625b4aa51985f29ba8208b5972e0f3343), [`711e49b`](https://github.com/TernSecure/auth/commit/711e49bbcde4e8304f394bca9f37ae61183644f8), [`0db3d6b`](https://github.com/TernSecure/auth/commit/0db3d6b723f575a03504e2a76096964075ce4624), [`a5d5175`](https://github.com/TernSecure/auth/commit/a5d5175cc144ae0f652af5d2b9b41b14bbe6ead1), [`d5afeeb`](https://github.com/TernSecure/auth/commit/d5afeeb9900f4eb7d77b1b6793dbd82b812858f8), [`2ab4368`](https://github.com/TernSecure/auth/commit/2ab43681510205a70348fcbc254ce7cf1a5f60eb), [`15631dd`](https://github.com/TernSecure/auth/commit/15631dddd55c519c500a39778d3ff4dbdfc08e2c)]:
  - @tern-secure/shared@1.3.0
  - @tern-secure/types@1.1.0

## 1.1.6

### Patch Changes

- aeb1f5a: Canary Release
- Updated dependencies [aeb1f5a]
  - @tern-secure/shared@1.2.1
  - @tern-secure/types@1.0.5
  - @tern-secure/auth@1.0.1

## 1.1.5

### Patch Changes

- ead8f4e: fix: fixed firebase-admin dependecy
- Updated dependencies [ead8f4e]
  - @tern-secure/backend@1.1.6

## 1.1.4

### Patch Changes

- Updated dependencies [c77edd0]
  - @tern-secure/backend@1.1.5

## 1.1.3

### Patch Changes

- bc5e08e: fix: update dependencies and scripts for consistency across packages
- Updated dependencies [bc5e08e]
  - @tern-secure/backend@1.1.4

## 1.1.2

### Patch Changes

- 2e908c2: enhance versioning across packages.
- Updated dependencies [2e908c2]
  - @tern-secure/shared@1.2.0
  - @tern-secure/types@1.0.4

## 1.1.1

### Patch Changes

- 7af68e4: update backend
- Updated dependencies [7af68e4]
  - @tern-secure/shared@1.1.2
  - @tern-secure/types@1.0.3

## 1.1.0

### Minor Changes

- 5f29862: advanced Auth cookies and session management

### Patch Changes

- Updated dependencies [5f29862]
  - @tern-secure/shared@1.1.1
  - @tern-secure/types@1.0.2

## 1.0.1

### Patch Changes

- 367a100: fix: Update ternUIgetScriptUrl to use TernSecureDev flag and switch CDN to HTTPS.
- Updated dependencies [367a100]
  - @tern-secure/shared@1.1.0
  - @tern-secure/types@1.0.1

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

### Patch Changes

- Updated dependencies [2603f2b]
  - @tern-secure/shared@1.0.0
  - @tern-secure/types@1.0.0
