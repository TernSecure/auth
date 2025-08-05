# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm dev` - Start development server across all packages using Turbo
- `pnpm build` - Build all packages using Turbo
- `pnpm lint` - Run linting across all packages
- `pnpm check-types` - Type check all packages

### Package Management
- `pnpm clean` - Clean all build artifacts and node_modules
- This is a pnpm workspace with packages in `packages/` and `apps/`
- Uses Turbo for build orchestration and caching

### Testing Applications
- `cd apps/test && pnpm dev` - Test app with full Next.js features

## Architecture

### Monorepo Structure
This is a TypeScript monorepo for TernSecure Authentication - a Firebase Auth wrapper that provides:
- Streamlined authentication for Next.js applications
- React components and hooks for auth
- Backend utilities for server-side auth
- Type-safe interfaces throughout

### Core Packages

**@tern-secure/auth** (`packages/auth/`)
- Core Firebase authentication client
- Main entry points: `TernSecureAuth` and `TernServerAuth` classes
- Client-side auth state management and Firebase integration

**@tern-secure/backend** (`packages/backend/`)
- Server-side authentication utilities
- JWT handling and verification
- Firebase Admin SDK integration
- Exports: main, `/admin`, `/jwt` subpackages

**@tern-secure/nextjs** (`packages/nextjs/`)
- Next.js specific integrations
- Server and client components for auth
- Middleware for protected routes
- Exports: main, `/server`, `/server/node`, `/admin`

**@tern-secure/react** (`packages/react/`)
- React components and hooks
- Auth providers and context
- UI components with Tailwind styling

**@tern-secure/types** (`packages/types/`)
- Shared TypeScript definitions
- Auth interfaces and types

**@tern-secure/shared** (`packages/shared/`)
- Common utilities across packages
- Event handling and state management

### Key Components

**Authentication Flow**
- Firebase Auth as the underlying provider
- Session management with JWT tokens
- Redis integration for session storage (`@upstash/redis`)
- Support for both client and server-side authentication

**Next.js Integration**
- App Router support with middleware
- Server actions for auth operations
- Protected routes and components
- Edge runtime compatibility

**Development Apps**
- `apps/test/` - Full-featured test application
- `apps/test-auth-only/` - Minimal auth-only test app
- Both use workspace packages for testing integration

### Build System
- Uses `tsup` for package building
- TypeScript compilation with `tsc` for type definitions
- Turbo for monorepo task orchestration
- ESM and CJS output formats supported