# [ADR-007] Server Component Patterns for Minimal Client JavaScript

> **Status:** Accepted
>
> **Date:** 2026-01-30
>
> **Authors:** @BradMcGonigle

## Context

React Server Components (RSC) allow components to render on the server, sending only HTML to the client. This reduces JavaScript bundle size and improves performance. However, any interactivity requires client components (`"use client"`).

ASCII Scores' Navigation component initially used `usePathname()` to highlight the active league, making the entire navigation a client component. This pattern:
- Shipped unnecessary JavaScript to the client
- Prevented server-side rendering of navigation
- Set a precedent for over-using client components

As the application grows, unchecked client component usage could bloat the bundle significantly.

## Decision

We will follow a **server-first component pattern** with minimal client boundaries:

### 1. Default to Server Components
- All components are server components unless they need client features
- Data fetching happens in server components
- Static content renders on the server

### 2. Minimal Client Boundaries
- Only wrap the smallest necessary portion in `"use client"`
- Extract interactive parts into dedicated client components
- Pass server-computed state as props instead of using client-side hooks

### 3. Pattern: Composition over Client Hooks

**Before (entire component is client):**
```typescript
"use client";
export function Navigation() {
  const pathname = usePathname();
  const activeLeague = pathname.split("/")[1];
  return <nav>...</nav>;
}
```

**After (server component with minimal client child):**
```typescript
// NavigationLinks.tsx (server component)
export function NavigationLinks({ activeLeague }: Props) {
  return leagues.map(league => (
    <Link className={league === activeLeague ? "active" : ""}>
      {league}
    </Link>
  ));
}

// MobileNavigation.tsx (client component - only handles toggle)
"use client";
export function MobileNavigation({ children }) {
  const [open, setOpen] = useState(false);
  return <Sheet open={open}>{children}</Sheet>;
}

// Navigation.tsx (server component - composes both)
export function Navigation({ activeLeague }: Props) {
  return (
    <>
      <NavigationLinks activeLeague={activeLeague} />
      <MobileNavigation>
        <NavigationLinks activeLeague={activeLeague} />
      </MobileNavigation>
    </>
  );
}
```

### 4. State from Server, Not Hooks
- Compute `activeLeague` in the page's server component from route params
- Pass it down as a prop rather than using `usePathname()` on the client

## Consequences

### Positive

- **Smaller JavaScript bundle** - Server components ship zero JS
- **Faster initial load** - Less code to download, parse, and execute
- **Better SEO** - Navigation renders in initial HTML
- **Clear boundaries** - Easy to identify what runs on client vs server
- **Scalable pattern** - Prevents bundle bloat as app grows

### Negative

- **More components** - Splitting requires additional files
- **Prop drilling** - State flows down from server instead of being read locally
- **Initial complexity** - Pattern requires understanding RSC boundaries

### Neutral

- Development experience unchanged once pattern is learned
- No impact on functionality

## Alternatives Considered

### Alternative 1: All client components for simplicity

Keep using client components freely for any interactivity.

**Pros:**
- Simpler mental model (classic React)
- No need to think about RSC boundaries

**Cons:**
- Larger JavaScript bundles
- Slower page loads
- Against Next.js best practices

**Why not chosen:** Performance matters for a real-time scores app; users want fast loads.

### Alternative 2: Heavy use of dynamic imports

Use `next/dynamic` to lazy-load client components.

**Pros:**
- Defers loading of non-critical code
- Can reduce initial bundle

**Cons:**
- Adds loading states complexity
- Still ships the JS eventually
- Layout shift risks

**Why not chosen:** Server components eliminate the JS entirely; dynamic imports are a secondary optimization.

### Alternative 3: Islands architecture (like Astro)

Explicitly mark interactive "islands" in an otherwise static page.

**Pros:**
- Very minimal JS
- Clear mental model

**Cons:**
- Not how Next.js works
- Would require framework change

**Why not chosen:** Next.js Server Components provide similar benefits within our chosen framework.

## References

- [PR #16: Convert Navigation to server component](https://github.com/BradMcGonigle/ascii-scores/pull/16)
- [ADR-001: Next.js 16 Framework](./001-nextjs-16-framework.md)
- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [Next.js Server Components docs](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

---

## Implementation Notes

- Navigation split into `NavigationLinks` (server) and `MobileNavigation` (client)
- `activeLeague` passed from page layout via props
- Pattern documented in `CLAUDE.md` under "Code Style Guidelines"
- Same pattern should be applied to future interactive components
