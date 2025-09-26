# @tern-secure/backend

## 1.2.0

### Minor Changes

- add features to the authentication ([#22](https://github.com/TernSecure/auth/pull/22)) by [@kayp514](https://github.com/kayp514)

- add features to the authentication ([#24](https://github.com/TernSecure/auth/pull/24)) by [@kayp514](https://github.com/kayp514)

### Patch Changes

- feat: Enhance API client with base path and local URL handling; add utility functions for path and case transformations ([#26](https://github.com/TernSecure/auth/pull/26)) by [@kayp514](https://github.com/kayp514)

- feat: Update Firebase initialization in TernSecureAuth and refine request handling in ternSecureEdgeMiddleware ([#27](https://github.com/TernSecure/auth/pull/27)) by [@kayp514](https://github.com/kayp514)

- Update cookie handling and refactor session management in TernSecureAuth and related modules ([#28](https://github.com/TernSecure/auth/pull/28)) by [@kayp514](https://github.com/kayp514)

- feat: Refactor session handling and endpoint routing ([#25](https://github.com/TernSecure/auth/pull/25)) by [@kayp514](https://github.com/kayp514)

- Updated dependencies [[`db27265`](https://github.com/TernSecure/auth/commit/db27265152844583de0f89c5b7af075ea9780061), [`b4a161a`](https://github.com/TernSecure/auth/commit/b4a161a0f59f3cbf7b57a2b75dcf776e5d46fe82), [`34642ab`](https://github.com/TernSecure/auth/commit/34642abf1dcd5ce485b42343be4bc8182bfad360), [`fb08ec2`](https://github.com/TernSecure/auth/commit/fb08ec210f9a324ab76947cda4bb539c9d482def), [`be59eda`](https://github.com/TernSecure/auth/commit/be59eda4c9696c4ef8719d46bcc61f6799d41c6a)]:
  - @tern-secure/shared@1.3.0
  - @tern-secure/types@1.1.0

## 1.1.7

### Patch Changes

- aeb1f5a: Canary Release
- Updated dependencies [aeb1f5a]
  - @tern-secure/shared@1.2.1
  - @tern-secure/types@1.0.5

## 1.1.6

### Patch Changes

- ead8f4e: fix: fixed firebase-admin dependecy

## 1.1.5

### Patch Changes

- c77edd0: fix: removed unused dependecies

## 1.1.4

### Patch Changes

- bc5e08e: fix: update dependencies and scripts for consistency across packages

## 1.1.3

### Patch Changes

- 2e908c2: enhance versioning across packages.
- Updated dependencies [2e908c2]
  - @tern-secure/types@1.0.4

## 1.1.2

### Patch Changes

- 7af68e4: update backend
- Updated dependencies [7af68e4]
  - @tern-secure/types@1.0.3

## 1.1.1

### Patch Changes

- ccd486a: fix: update package.json to include 'dist' in files and remove '@tern-secure/types' from external dependencies in tsup.config

## 1.1.0

### Minor Changes

- 5f29862: advanced Auth cookies and session management

### Patch Changes

- Updated dependencies [5f29862]
  - @tern-secure/types@1.0.2

## 1.0.1

### Patch Changes

- 367a100: fix: Update ternUIgetScriptUrl to use TernSecureDev flag and switch CDN to HTTPS.
- Updated dependencies [367a100]
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
  - @tern-secure/types@1.0.0
