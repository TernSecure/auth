# @tern-secure/nextjs

## 5.2.0

### Minor Changes

- add features to the authentication ([#22](https://github.com/TernSecure/auth/pull/22)) by [@kayp514](https://github.com/kayp514)

- add features to the authentication ([#24](https://github.com/TernSecure/auth/pull/24)) by [@kayp514](https://github.com/kayp514)

### Patch Changes

- fix(auth): update default project ID in .firebaserc and improve error handling in TokenApi ([#38](https://github.com/TernSecure/auth/pull/38)) by [@kayp514](https://github.com/kayp514)

- feat(auth): implement getAuth functionality for custom token handling ([#29](https://github.com/TernSecure/auth/pull/29)) by [@kayp514](https://github.com/kayp514)

- fix(auth): enhance error handling and add referer support in token exchange and session management ([#41](https://github.com/TernSecure/auth/pull/41)) by [@kayp514](https://github.com/kayp514)

- feat(auth): implement RequestProcessorContext for enhanced request handling ([#33](https://github.com/TernSecure/auth/pull/33)) by [@kayp514](https://github.com/kayp514)

- feat: Enhance API client with base path and local URL handling; add utility functions for path and case transformations ([#26](https://github.com/TernSecure/auth/pull/26)) by [@kayp514](https://github.com/kayp514)

- fix(auth): enhance error handling and response structure in session creation ([#37](https://github.com/TernSecure/auth/pull/37)) by [@kayp514](https://github.com/kayp514)

- feat: Update Firebase initialization in TernSecureAuth and refine request handling in ternSecureEdgeMiddleware ([#27](https://github.com/TernSecure/auth/pull/27)) by [@kayp514](https://github.com/kayp514)

- Update cookie handling and refactor session management in TernSecureAuth and related modules ([#28](https://github.com/TernSecure/auth/pull/28)) by [@kayp514](https://github.com/kayp514)

- feat: Refactor session handling and endpoint routing ([#25](https://github.com/TernSecure/auth/pull/25)) by [@kayp514](https://github.com/kayp514)

- fix(auth): update response handling in getAuth to correctly access idToken and refreshToken ([#40](https://github.com/TernSecure/auth/pull/40)) by [@kayp514](https://github.com/kayp514)

  refactor(TokenApi): streamline exchangeCustomForIdAndRefreshTokens method by removing try-catch and simplifying request logic

  style(TokenApi): standardize string quotes and remove unnecessary whitespace

  chore(request): clean up code by removing extra line in createRequest function

- fix(auth): update project ID in .firebaserc and enhance error handling in TokenApi ([#36](https://github.com/TernSecure/auth/pull/36)) by [@kayp514](https://github.com/kayp514)

- canary release: Removed getCookieName in custom token ([#30](https://github.com/TernSecure/auth/pull/30)) by [@kayp514](https://github.com/kayp514)

- canary release: fix: emulator ([#31](https://github.com/TernSecure/auth/pull/31)) by [@kayp514](https://github.com/kayp514)

- fix(auth): improve error handling in token exchange by checking for idToken ([#39](https://github.com/TernSecure/auth/pull/39)) by [@kayp514](https://github.com/kayp514)

- feat(auth): add debug logging for custom tokens in refreshCookieWithIdToken function ([#35](https://github.com/TernSecure/auth/pull/35)) by [@kayp514](https://github.com/kayp514)

- feat(auth): enhance custom token endpoint for emulator support and add debug logging for cookie extraction ([#32](https://github.com/TernSecure/auth/pull/32)) by [@kayp514](https://github.com/kayp514)

- Updated dependencies [[`4ae94b2`](https://github.com/TernSecure/auth/commit/4ae94b2a8572e7c747b5be5af409c96d29389a7f), [`f502628`](https://github.com/TernSecure/auth/commit/f5026288569cbebe85fcc4b33fc627c51ba51a63), [`589fe85`](https://github.com/TernSecure/auth/commit/589fe8500c45c1d5c451fe6558bdd3b86f3684df), [`fcb909e`](https://github.com/TernSecure/auth/commit/fcb909e9b5b8aba514b59f194886e6dd2d80087e), [`db27265`](https://github.com/TernSecure/auth/commit/db27265152844583de0f89c5b7af075ea9780061), [`5002028`](https://github.com/TernSecure/auth/commit/5002028a57ab959022e8d1e5951b21319bdb3815), [`b4a161a`](https://github.com/TernSecure/auth/commit/b4a161a0f59f3cbf7b57a2b75dcf776e5d46fe82), [`34642ab`](https://github.com/TernSecure/auth/commit/34642abf1dcd5ce485b42343be4bc8182bfad360), [`e187e46`](https://github.com/TernSecure/auth/commit/e187e46a825be61ec5aa134303cbbf443a731bd4), [`6bd52d2`](https://github.com/TernSecure/auth/commit/6bd52d270f845de9b9ce8212c72bde979c00a1c4), [`fb08ec2`](https://github.com/TernSecure/auth/commit/fb08ec210f9a324ab76947cda4bb539c9d482def), [`be59eda`](https://github.com/TernSecure/auth/commit/be59eda4c9696c4ef8719d46bcc61f6799d41c6a), [`728c672`](https://github.com/TernSecure/auth/commit/728c6723e35a75c97f3fcd246283b5c443b31e7c), [`38e9681`](https://github.com/TernSecure/auth/commit/38e9681625b4aa51985f29ba8208b5972e0f3343), [`0db3d6b`](https://github.com/TernSecure/auth/commit/0db3d6b723f575a03504e2a76096964075ce4624), [`a5d5175`](https://github.com/TernSecure/auth/commit/a5d5175cc144ae0f652af5d2b9b41b14bbe6ead1), [`d5afeeb`](https://github.com/TernSecure/auth/commit/d5afeeb9900f4eb7d77b1b6793dbd82b812858f8), [`15631dd`](https://github.com/TernSecure/auth/commit/15631dddd55c519c500a39778d3ff4dbdfc08e2c)]:
  - @tern-secure/backend@1.2.0
  - @tern-secure/shared@1.3.0
  - @tern-secure/react@1.2.0
  - @tern-secure/types@1.1.0

## 5.1.9

### Patch Changes

- aeb1f5a: Canary Release
- Updated dependencies [aeb1f5a]
  - @tern-secure/backend@1.1.7
  - @tern-secure/shared@1.2.1
  - @tern-secure/react@1.1.6
  - @tern-secure/types@1.0.5

## 5.1.8

### Patch Changes

- ead8f4e: fix: fixed firebase-admin dependecy
- Updated dependencies [ead8f4e]
  - @tern-secure/react@1.1.5

## 5.1.7

### Patch Changes

- c77edd0: fix: removed unused dependecies
  - @tern-secure/react@1.1.4

## 5.1.6

### Patch Changes

- bc5e08e: fix: update dependencies and scripts for consistency across packages
- Updated dependencies [bc5e08e]
  - @tern-secure/react@1.1.3

## 5.1.5

### Patch Changes

- 2e908c2: enhance versioning across packages.
- Updated dependencies [2e908c2]
  - @tern-secure/shared@1.2.0
  - @tern-secure/backend@1.1.3
  - @tern-secure/react@1.1.2
  - @tern-secure/types@1.0.4

## 5.1.4

### Patch Changes

- 7af68e4: update backend
- Updated dependencies [7af68e4]
  - @tern-secure/backend@1.1.2
  - @tern-secure/shared@1.1.2
  - @tern-secure/react@1.1.1
  - @tern-secure/types@1.0.3

## 5.1.3

### Patch Changes

- Updated dependencies [ccd486a]
  - @tern-secure/backend@1.1.1

## 5.1.2

### Patch Changes

- 246f528: refactor: remove unused exports and dependencies from admin module and tsup config

## 5.1.1

### Patch Changes

- f784994: fix: added backend package as dependency

## 5.1.0

### Minor Changes

- 5f29862: advanced Auth cookies and session management

### Patch Changes

- Updated dependencies [5f29862]
  - @tern-secure/react@1.1.0
  - @tern-secure/shared@1.1.1
  - @tern-secure/types@1.0.2

## 5.0.1

### Patch Changes

- 367a100: fix: Update ternUIgetScriptUrl to use TernSecureDev flag and switch CDN to HTTPS.
- Updated dependencies [367a100]
  - @tern-secure/shared@1.1.0
  - @tern-secure/react@1.0.1
  - @tern-secure/types@1.0.1

## 5.0.0

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
  - @tern-secure/react@1.0.0
  - @tern-secure/types@1.0.0

## 4.2.7

### Patch Changes

- a711aef: feat: Enhance authentication state management and middleware
  - Add auth state cookie for server-side authentication tracking
  - Update auth middleware to set secure auth state cookie
  - Modify server-side auth check to validate auth state
  - Remove unused import in sign-in component
  - Update Edge runtime configuration in middleware

## 4.2.6

### Patch Changes

- 1757b10: refactor: Improve TernSecure middleware type definitions and error handling
  - Update import types from 'next/server'
  - Modify function signatures to improve type safety
  - Enhance error handling with explicit redirect URL creation
  - Adjust return types for middleware and callback functions

## 4.2.5

### Patch Changes

- 6240f3a: refactor: Improve TernSecure middleware response handling
  - Update middleware to return Response or undefined
  - Modify authentication flow to use NextResponse.redirect
  - Simplify error handling and callback processing
  - Make callback parameter optional
  - Streamline middleware return logic

## 4.2.4

### Patch Changes

- 45aadf2: refactor: Simplify TernSecure middleware and error handling
  - Remove unused imports and error classes
  - Modify route matching regex pattern
  - Streamline authentication middleware logic
  - Add Edge runtime support
  - Improve error redirection and handling
  - Clean up response headers

## 4.2.3

### Patch Changes

- b0e8300: refactor: Enhance authentication and session management
  - Improve token verification and error handling in JWT modules
  - Update authentication methods to use centralized error handling
  - Modify session verification to support more flexible token checks
  - Refactor middleware to handle authentication redirects more robustly
  - Add caching to authentication methods for improved performance

## 4.2.2

### Patch Changes

- 496c2a9: refactor: Centralize types and improve JWT token verification
  - Create new `types.ts` file to centralize shared type definitions
  - Enhance JWT verification with more robust error handling and logging
  - Add caching for JWKS using React cache
  - Improve token decoding and validation logic
  - Update import paths across authentication modules

## 4.2.1

### Patch Changes

- 942b66f: refactor: Restructure server authentication and session management
  - Move server-side authentication files to a new `admin` directory
  - Update package.json exports to reflect new file structure
  - Simplify ESLint configuration by removing unused variable rules
  - Update import paths in sign-in and sign-out components
  - Minor configuration adjustments in tsup config

## 4.2.0

### Minor Changes

- 1496d6e: chore: Enhance authentication middleware and session management
  - Update auth mechanism to support edge runtime
  - Implement flexible route matching for public paths
  - Add robust session verification using multiple methods
  - Improve error handling and user information extraction
  - Update session cookie and token management

## 4.1.0

### Minor Changes

- 1f4f6f0: feat: Enhance error handling and authentication flow
  - Modify `getErrorAlertVariant` to handle undefined error cases and simplify error variant selection logic, removing redundant success checks.
  - Enhance error code extraction and mapping mechanisms with comprehensive error pattern matching for Firebase authentication errors, improving error response generation with default messages.
  - Rename `ErrorAlertVariant` to `getErrorAlertVariant` and update Turbo to version 2.4.0 in package.json and package-lock.json.
  - Minor code formatting improvements, including the removal of redundant semicolons and extra blank lines.
  - Add a password visibility toggle button and enhance error display with animation, refactoring input layout and error handling.
  - Error handling in authentication components, adding comprehensive Firebase authentication error mapping and improving error display and variant selection.
  - Update sign-in, sign-up, and sign-out components to use new error handling, enhancing URL redirect and validation utilities.
  - Add explicit 'type="button"' to prevent unintended form submission and ensure email verification button behaves as a standalone interactive element.
  - Add utility functions for route type checking and redirect prevention, enhancing sign-in and sign-out components with more robust redirect logic and improving URL construction and redirect parameter handling.
  - Implement redirect loop prevention mechanisms and add new authentication status and error types, improving authentication state tracking and redirect handling for login and verification flows.

- 527515c: Fix EsLint

## 4.0.0

### Major Changes

- 403fc4d: feat: Add email verification and sign-out button, enhance authentication flow

## 3.4.3

### Patch Changes

- 686fb5c: chore: improve password input styling and interaction

## 3.4.2

### Patch Changes

- f4ddaa3: chore: remove name field from sign-up form state

## 3.4.1

### Patch Changes

- 9ad43a8: chore: add build step to release workflow

## 3.4.0

### Minor Changes

- 8f40361: feat: add sign-up functionality and email verification
  - Implement createUser function for user registration
  - Add resendEmailVerification function
  - Update TernSecureClientProvider to handle email state
  - Export SignUp component in index files
  - Modify sign-in component to link to correct sign-up route

## 3.3.5

### Patch Changes

- b6942c4: chore: add verbose logging to npm publish in release workflow

## 3.3.4

### Patch Changes

- a2c2a6c: chore: configure npm authentication for private registry

## 3.3.3

### Patch Changes

- a1fa601: fix: remove auth token and update sign-in signup link
  - Remove hardcoded NPM registry authentication token from .npmrc
  - Delete unused TypeScript declaration file in dist/types
  - Update sign-in component to link to signup page with '/signup' href

## 3.3.1

### Patch Changes

- ba72742: chore: enhance release workflow with NPM authentication
  - Add NPM authentication step to the GitHub Actions workflow for secure publishing.
  - Update the publish command to use 'npm publish --access public' instead of 'npm run release'.
  - Improve clarity and organization of the release process.

## 3.3.0

### Minor Changes

- 7335e8f: chore: update package-lock.json and enhance release workflow
  - Update multiple package versions in package-lock.json, including @esbuild and @eslint dependencies.
  - Remove outdated dependencies from package-lock.json to streamline the project.
  - Modify GitHub Actions release workflow to use 'npm run release' for publishing instead of direct npm publish command.
  - Clean up NPM authentication steps in the workflow for improved clarity.

## 3.3.0

### Minor Changes

- cf2af23: New authentication providers have been added:
  - Integration with Google sign-in
  - Integration with Microsoft sign-in
