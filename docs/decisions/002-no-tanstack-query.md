# [ADR-002] No TanStack Query

> **Status:** Accepted
>
> **Date:** 2026-01
>
> **Authors:** @BradMcGonigle

## Context

TanStack Query (formerly React Query) is a popular library for server state management in React applications. It provides:
- Caching and cache invalidation
- Background refetching
- Stale-while-revalidate patterns
- Optimistic updates
- Devtools

We need to decide whether to include TanStack Query for data fetching in ASCII Scores.

## Decision

We will **not use TanStack Query**. Instead, we will rely on Next.js 16's built-in caching primitives:

- `"use cache"` directive for server-side caching
- `cacheLife()` for TTL configuration
- `revalidateTag()` / `revalidatePath()` for cache invalidation
- `router.refresh()` for client-side revalidation

## Consequences

### Positive

- **One less dependency** - Reduced bundle size and maintenance burden
- **Simpler mental model** - All caching in one framework
- **Native integration** - Caching works seamlessly with Server Components
- **No client-side cache sync issues** - Server is source of truth

### Negative

- **No devtools** - TanStack Query's devtools are excellent for debugging
- **Less flexibility** - TanStack Query offers more granular cache control
- **No optimistic updates** - Would need custom implementation if needed later

### Neutral

- Learning different patterns than TanStack Query tutorials show

## Alternatives Considered

### Alternative 1: Use TanStack Query

Add TanStack Query for all data fetching.

**Pros:**
- Industry-standard patterns
- Excellent documentation and devtools
- Handles complex caching scenarios

**Cons:**
- Additional 13kb+ to bundle
- Duplicates functionality Next.js 16 provides
- Adds complexity for our simple use case

**Why not chosen:** Our app is read-only with simple polling. We don't need optimistic updates, mutations, or complex cache invalidation that TanStack Query excels at.

### Alternative 2: SWR

Vercel's lighter-weight data fetching library.

**Pros:**
- Smaller than TanStack Query
- Made by Vercel, good Next.js integration

**Cons:**
- Still an additional dependency
- Less feature-rich than TanStack Query

**Why not chosen:** Same reasoning - Next.js 16 caching covers our needs.

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Next.js 16 Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [ADR-001](001-nextjs-16-framework.md) - Next.js 16 decision

---

## Implementation Notes

### Polling Implementation

Instead of TanStack Query's `refetchInterval`, we use:

```typescript
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ScoreboardRefresh({ intervalMs = 30000 }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh(); // Revalidates Server Components
    }, intervalMs);

    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return null;
}
```

### Caching Implementation

Instead of TanStack Query's `staleTime`, we use:

```typescript
export async function getScoreboard(league: League) {
  "use cache";
  cacheLife("seconds", 30);

  // fetch logic
}
```

### Re-evaluation Triggers

Consider adding TanStack Query if we later need:
- Complex mutation workflows
- Optimistic UI updates
- Infinite scroll with cache management
- Offline support with cache persistence
