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
- it uses workspace packages for testing integration

### Build System
- Uses `tsup` for package building# CLAUDE.md

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
- it uses workspace packages for testing integration

### Build System
- Uses `tsup` for package building
- TypeScript compilation with `tsc` for type definitions
- Turbo for monorepo task orchestration
- ESM and CJS output formats supported

## Code Quality Best Practices

### Resilient Code Design
When writing code, always design for change resilience:

**Write Modular, Loosely Coupled Code**
- Break complex functions into smaller, single-purpose functions
- Use dependency injection and inversion of control patterns
- Create abstractions that hide implementation details
- Separate concerns - business logic, data access, UI, and configuration should be isolated

**Use Interface-Based Design**
- Define clear interfaces and contracts between modules
- Code against interfaces, not concrete implementations
- Use TypeScript interfaces to enforce contracts
- Make dependencies explicit through parameters rather than global state

**Implement Defensive Programming**
- Validate inputs at function boundaries
- Use optional chaining and nullish coalescing for safer property access
- Implement graceful fallbacks for edge cases
- Add proper error boundaries and error handling

**Design for Extension, Not Modification**
- Follow the Open/Closed Principle - open for extension, closed for modification
- Use composition over inheritance
- Implement plugin architectures where appropriate
- Use configuration objects instead of hardcoded values

**Example of Resilient vs Fragile Code:**

```typescript
// Fragile - tightly coupled, hard to change
function processUserAuth(email: string) {
  const user = firebase.auth().currentUser;
  if (user.email === email) {
    localStorage.setItem('session', user.uid);
    redirectToAdmin();
  }
}

// Resilient - modular, testable, adaptable
interface AuthProvider {
  getCurrentUser(): Promise<User | null>;
}

interface SessionStore {
  setSession(userId: string): Promise<void>;
}

interface Router {
  redirect(path: string): void;
}

const processUserAuth = async (
  email: string,
  authProvider: AuthProvider,
  sessionStore: SessionStore,
  router: Router
) => {
  try {
    const user = await authProvider.getCurrentUser();
    if (user?.email === email) {
      await sessionStore.setSession(user.id);
      router.redirect('/admin');
    }
  } catch (error) {
    console.error('Auth processing failed:', error);
    // Implement fallback behavior
  }
};
```

**Key Principles:**
- **Single Responsibility**: Each function/class has one reason to change
- **Dependency Inversion**: Depend on abstractions, not concretions  
- **Configuration over Convention**: Make behavior configurable rather than hardcoded
- **Fail-Safe Defaults**: Provide sensible fallbacks when things go wrong
- **Immutable Data Structures**: Prevent unintended side effects
- **Pure Functions**: Functions that don't depend on or modify external state when possible

This approach ensures that when requirements change, you modify configuration or add new implementations rather than rewriting core logic.
- TypeScript compilation with `tsc` for type definitions
- Turbo for monorepo task orchestration
- ESM and CJS output formats supported