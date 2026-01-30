# Claude Code Instructions

This file provides context and guidelines for Claude Code when working on this project.

> **See also:** [`AGENTS.md`](AGENTS.md) for broader AI agent context, decision history, and project understanding.

## Project Overview

ASCII Scores is a real-time sports scoreboard web application that displays live scores for NHL, NFL, NBA, MLB, MLS, and Formula 1 - rendered entirely in ASCII art style.

## Key Documentation

| Document | Purpose |
|----------|---------|
| `AGENTS.md` | AI agent context, decision history, project status |
| `ARCHITECTURE.md` | System design, data flows, component structure |
| `docs/decisions/` | Architecture Decision Records (ADRs) |
| `CONTRIBUTING.md` | Human contributor guidelines |

## Tech Stack

- **Framework**: Next.js 16.1 with App Router and Turbopack
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (CSS-first configuration)
- **Package Manager**: pnpm
- **Deployment**: Vercel

## Architecture

See `ARCHITECTURE.md` for detailed architecture documentation including:
- Data sources (ESPN API, OpenF1 API)
- Component structure
- Caching strategies
- ASCII rendering system

## Key Patterns

### Data Fetching

Use Next.js fetch with `revalidate` for server-side caching:

```typescript
export async function getScoreboard(league: League) {
  const response = await fetch(url, {
    next: { revalidate: 30 }, // Cache for 30 seconds
  });
  // parse and return data
}
```

### Client-Side Polling

Use `router.refresh()` for revalidating server components:

```typescript
"use client";
import { useRouter } from 'next/navigation';

// Call router.refresh() on interval to update scores
```

### ASCII Rendering

- Use Unicode box-drawing characters for borders
- Keep ASCII art monospace-friendly
- Provide text alternatives for accessibility

#### Available ASCII Components

| Component | Purpose |
|-----------|---------|
| `AsciiBox` | Content container with multiple border styles (single, double, rounded, heavy) |
| `AsciiTable` | Data table with ASCII borders and column alignment |
| `AsciiLogo` / `AsciiLogoCompact` | Site branding in ASCII art |
| `AsciiSportIcon` | Sport emoji icons for each league (compact, default, boxed variants) |
| `AsciiDecorations` | Dividers, frames, status indicators, progress bars, cursors |

#### CSS Utilities for Retro Effects

| Class | Effect |
|-------|--------|
| `glow-green` / `glow-amber` / `glow-blue` | Phosphor text glow effects |
| `glow-pulse` | Animated pulsing glow |
| `text-glow` / `text-glow-strong` | Subtle text shadow glow |
| `retro-card` | Card with gradient background and hover glow |
| `matrix-bg` | Subtle grid pattern background |
| `cursor-blink` | Blinking block cursor after element |

The site uses CRT-style effects (scanlines, vignette) applied globally via `body::before` and `body::after` pseudo-elements.

## Directory Structure

```
src/
├── app/           # Pages and API routes
├── components/
│   ├── ascii/     # ASCII primitives (AsciiBox, AsciiTable)
│   ├── scoreboards/  # Sport-specific components
│   └── layout/    # Header, Navigation, Footer
└── lib/
    ├── api/       # ESPN and OpenF1 clients
    ├── ascii/     # Rendering utilities
    └── utils/     # Helpers
```

## Development Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm test         # Run tests
```

## Code Style Guidelines

- Use TypeScript with proper types for all API responses
- Prefer server components; use `"use client"` only when necessary
- Keep components focused and single-purpose
- Follow conventional commits for commit messages
- **Always run checks before committing**: `pnpm lint && pnpm typecheck`

## React Best Practices

This project follows [Vercel's React Best Practices](https://vercel.com/blog/introducing-react-best-practices). These patterns are critical for performance and maintainability.

### Critical: Eliminating Waterfalls

Waterfalls are the #1 performance killer. Always parallelize independent operations.

```typescript
// ❌ BAD: Sequential fetches (waterfall)
const sessions = await fetchSessions();
const positions = await fetchPositions(sessions[0].id);
const drivers = await fetchDrivers(sessions[0].id);

// ✅ GOOD: Parallel fetches with Promise.all
const [positionsResponse, driversResponse] = await Promise.all([
  fetch(`/position?session_key=${sessionKey}`),
  fetch(`/drivers?session_key=${sessionKey}`),
]);
```

**Guidelines:**
- Use `Promise.all()` for independent async operations
- Defer `await` until the value is actually needed
- Use Suspense boundaries to render wrapper UI while data loads

### Critical: Bundle Size Optimization

```typescript
// ❌ BAD: Barrel file imports (can load thousands of unused exports)
import { Button, Input, Modal } from "@/components";

// ✅ GOOD: Direct imports from source files
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
```

**Guidelines:**
- Avoid barrel files (index.ts re-exports) for large component libraries
- Use `next/dynamic` for heavy components (editors, charts, maps)
- Preload components based on user intent (hover, focus)

### High: Server Component Patterns

```typescript
// ✅ GOOD: Server component with data fetching
export default async function LeaguePage({ params }: Props) {
  const scoreboard = await getESPNScoreboard(league);
  return <LeagueScoreboard scoreboard={scoreboard} />;
}

// ✅ GOOD: Parallel data fetching in server components
async function Dashboard() {
  const [scores, standings] = await Promise.all([
    getScores(),
    getStandings(),
  ]);
  return <>{/* render both */}</>;
}
```

**Guidelines:**
- Default to server components; only use `"use client"` when necessary
- Use `React.cache()` to deduplicate requests within a single render
- Only pass fields that clients actually use at RSC boundaries

### Medium: Re-render Optimization

```typescript
// ❌ BAD: Derived state stored in useState
const [fullName, setFullName] = useState(`${first} ${last}`);
useEffect(() => {
  setFullName(`${first} ${last}`);
}, [first, last]);

// ✅ GOOD: Calculate during render
const fullName = `${first} ${last}`;
```

```typescript
// ❌ BAD: Unstable references in deps
useEffect(() => {
  fetchData(options); // options is recreated each render
}, [options]);

// ✅ GOOD: Stable callback with useCallback
const handleRefresh = useCallback(() => {
  startTransition(() => router.refresh());
}, [router]);
```

**Guidelines:**
- Calculate derived values during render, not in effects
- Use `useCallback` for stable function references in deps
- Use `useTransition` for non-urgent updates to maintain responsiveness
- Use `useRef` for values that shouldn't trigger re-renders

### Medium: Client-Side Patterns

```typescript
// ✅ GOOD: useTransition for non-blocking updates
const [isPending, startTransition] = useTransition();

const handleRefresh = () => {
  startTransition(() => {
    router.refresh();
  });
};

// ✅ GOOD: Functional setState to avoid stale closures
setCount(prev => prev + 1);
```

**Guidelines:**
- Use `router.refresh()` to revalidate server components
- Wrap non-urgent updates in `startTransition`
- Use functional updates to avoid stale closure bugs
- Keep client components minimal and focused

### Low-Medium: JavaScript Performance

```typescript
// ❌ BAD: O(n²) repeated array searches
items.forEach(item => {
  const match = allItems.find(i => i.id === item.id);
});

// ✅ GOOD: O(n) with Map lookup
const itemMap = new Map(allItems.map(i => [i.id, i]));
items.forEach(item => {
  const match = itemMap.get(item.id);
});
```

**Guidelines:**
- Use `Map`/`Set` for O(1) lookups instead of repeated array searches
- Combine multiple array iterations into single passes
- Cache expensive computations and property access in hot paths

### Quick Reference: When to Use Each Pattern

| Scenario | Pattern |
|----------|---------|
| Multiple independent API calls | `Promise.all()` |
| Heavy component (editor, chart) | `next/dynamic` |
| Stable function reference | `useCallback` |
| Non-blocking UI update | `useTransition` |
| Value that shouldn't trigger re-render | `useRef` |
| Lookup by ID in large arrays | `Map` or `Set` |
| Server-side data with caching | `fetch` with `revalidate` |
| Revalidate server components | `router.refresh()` |

## External APIs

### ESPN API (Unofficial)

- Base URL: `https://site.api.espn.com`
- Rate limiting: Be respectful, cache aggressively
- Endpoints documented in `ARCHITECTURE.md`

### OpenF1 API

- Base URL: `https://api.openf1.org/v1`
- Free and community-driven
- Used for F1 sessions, positions, lap times

## Testing

- Write tests for new functionality
- Test API response parsing
- Test ASCII rendering at various widths

## Important Notes

- This project uses unofficial ESPN APIs - do not abuse rate limits
- ASCII art should work in standard terminal widths (80+ chars)
- Prioritize accessibility - scores should be readable by screen readers

## Documentation Maintenance

**You are expected to maintain documentation during development.** This ensures future AI agents and developers understand the context behind decisions.

### When to Update Documentation

| Action | Documentation Required |
|--------|----------------------|
| Add new library/dependency | Create ADR in `docs/decisions/` |
| Change architectural patterns | Create ADR + update `ARCHITECTURE.md` |
| Establish new coding patterns | Update this file (`CLAUDE.md`) |
| Complete development phase | Update `AGENTS.md` status |
| Make significant trade-offs | Create ADR documenting decision |

### Creating an ADR

1. Copy `docs/decisions/000-template.md` to `docs/decisions/NNN-title.md`
2. Fill in all sections (Context, Decision, Consequences, Alternatives)
3. Update `docs/decisions/README.md` table
4. Update `AGENTS.md` quick reference table
5. Reference ADR in commit message

### Commit Message References

When implementing documented decisions, reference them:

```
feat: implement ESPN scoreboard caching

Implements caching strategy from ADR-001 using Next.js 16
"use cache" directive with 30-second TTL for live games.

Relates to: ADR-001, ADR-003
```

### Historical Context

When you learn something important during development (gotchas, failed approaches, insights), add it to the "Historical Context Log" section in `AGENTS.md`.
