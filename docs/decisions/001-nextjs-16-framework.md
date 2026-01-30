# [ADR-001] Use Next.js 16 Framework

> **Status:** Accepted
>
> **Date:** 2026-01
>
> **Authors:** @BradMcGonigle

## Context

ASCII Scores needs a modern React framework that can:
- Efficiently fetch and cache data from external APIs
- Render content server-side for fast initial loads
- Handle real-time updates without complex state management
- Deploy easily to edge networks

The application is read-heavy with simple polling requirements - users view live scores that update every 30 seconds during games.

## Decision

We will use **Next.js 16.1** with the App Router and Turbopack as our primary framework.

Key features we're adopting:
- **`"use cache"` directive** - Server-side caching without external libraries
- **`cacheLife()` configuration** - Fine-grained cache TTL control
- **Server Components** - Default server rendering, minimal client JS
- **Turbopack** - Fast development builds
- **App Router** - Modern routing with layouts and loading states

## Consequences

### Positive

- **Built-in caching eliminates external dependencies** - No need for Redis, TanStack Query, or custom caching layers
- **Simplified architecture** - Data fetching, caching, and rendering in one framework
- **Excellent Vercel integration** - Native deployment with edge functions
- **Future-proof** - Using latest stable patterns from React and Next.js teams

### Negative

- **Cutting-edge features** - `"use cache"` is relatively new; less community examples
- **Vercel lock-in** - While deployable elsewhere, optimized for Vercel
- **Learning curve** - App Router patterns differ from Pages Router

### Neutral

- TypeScript configuration is handled by Next.js defaults

## Alternatives Considered

### Alternative 1: Next.js 15 with TanStack Query

Use the previous stable Next.js with TanStack Query for data fetching.

**Pros:**
- More established patterns
- TanStack Query has excellent devtools

**Cons:**
- Additional dependency for caching
- More complex setup for simple polling use case

**Why not chosen:** Next.js 16's built-in caching covers our needs without the complexity of managing an additional library.

### Alternative 2: Remix

Modern React framework with excellent data loading patterns.

**Pros:**
- Strong data loading primitives
- Good error handling

**Cons:**
- Smaller ecosystem than Next.js
- Less integrated caching story

**Why not chosen:** Next.js 16's `"use cache"` provides a simpler solution for our caching-heavy use case.

### Alternative 3: Astro

Content-focused framework with island architecture.

**Pros:**
- Minimal JavaScript by default
- Great for static content

**Cons:**
- Less suited for real-time updates
- React integration is secondary

**Why not chosen:** Our app needs frequent client updates for live scores; Astro's architecture is optimized for more static content.

## References

- [Next.js 16 Release Notes](https://nextjs.org/blog)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023)
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Full system design

---

## Implementation Notes

- Using `next.config.ts` (TypeScript config) as recommended in Next.js 16
- Turbopack enabled by default in development
- App Router structure in `src/app/`
