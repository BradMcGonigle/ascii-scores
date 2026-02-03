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

### Git Workflow (MANDATORY)

**NEVER commit directly to `main`.** Always use feature branches and pull requests:

1. **Create a feature branch** before making changes:

   ```bash
   git checkout -b <type>/<short-description>
   # Examples: feat/add-nhl-standings, fix/mobile-nav-focus, refactor/api-caching
   ```

2. **Make commits on the feature branch**, not `main`

3. **Open a PR** to merge into `main` when work is complete

4. **Branch naming convention**:
   - `feat/` - New features
   - `fix/` - Bug fixes
   - `refactor/` - Code refactoring
   - `docs/` - Documentation only
   - `chore/` - Maintenance tasks

If you find yourself on `main` with uncommitted changes, stash or create a branch before committing.

### Pre-Commit Checklist (MANDATORY)

Before committing any changes, you MUST complete these steps:

1. **Run code checks**: `pnpm lint && pnpm typecheck`
2. **Evaluate documentation needs** for the branch/PR (see decision tree below)
3. **Create or update documentation** as needed (one ADR per decision, not per commit)

## Versioning with Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelog generation. This approach eliminates merge conflicts when multiple PRs are in flight.

### How It Works

1. **PRs add changeset files** (not version bumps)
2. **Changesets are additive** - multiple PRs can add changesets without conflicts
3. **Version bumping happens separately** when ready to release
4. **Changelog is auto-generated** from changeset descriptions

### For Each PR: Add a Changeset

When your PR includes changes that should be noted in the changelog, run:

```bash
pnpm changeset
```

This will prompt you to:

1. Select the type of change (major/minor/patch)
2. Write a description of the change

A markdown file is created in `.changeset/` - commit this with your PR.

#### Changeset Types

| Type      | When to Use                                                           |
| --------- | --------------------------------------------------------------------- |
| **minor** | New features (`feat:`), new pages, new components                     |
| **patch** | Bug fixes (`fix:`), performance improvements (`perf:`), style changes |
| **none**  | Refactoring, docs, chore, tests (no version bump needed)              |

#### Writing Good Changeset Descriptions

Prefix descriptions with the change type for proper categorization on the changelog page:

```markdown
feat: Add dark mode toggle to settings
fix: Resolve timezone bug in game status display
perf: Optimize API response caching
style: Improve mobile navigation layout
refactor: Simplify date parsing logic
```

### When to Skip Changesets

Not every PR needs a changeset. Skip for:

- Documentation-only changes
- Refactoring with no user-visible changes
- Test additions/updates
- Dependency updates (unless they affect functionality)
- Chore/maintenance tasks

### Releasing a New Version

When ready to release (typically after merging PRs to main):

```bash
pnpm version
```

This command:

1. Consumes all pending changesets in `.changeset/`
2. Bumps the version in `package.json` based on collected changesets
3. Updates `CHANGELOG.md` with all changes
4. Deletes the consumed changeset files

Then commit and push the version bump.

### How Version Numbers Work

- **Minor changes** (features) bump 0.X.0 → 0.(X+1).0
- **Patch changes** (fixes) bump 0.0.X → 0.0.(X+1)
- Multiple changesets are combined - the highest bump type wins

### Automatic Version Display

The footer version is read directly from `package.json` at build time - no manual updates needed.

The changelog page (`/changelog`) reads from `CHANGELOG.md` and automatically displays all entries.

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

## Documentation Maintenance (MANDATORY)

**Documentation is NOT optional.** Like running `pnpm lint && pnpm typecheck`, documentation must be completed as part of your work. This ensures future AI agents and developers understand the context behind decisions.

### Scope: Branch/PR, Not Per-Commit

Documentation is scoped to the **entire branch or PR**, not individual commits:

- **One ADR per decision**, not per commit. If you're iterating on a feature across multiple commits, create the ADR once and refine it as needed.
- **One Historical Context Log entry per feature/decision**, updated as understanding evolves.
- **Review documentation before the PR is merged**, ensuring it reflects the final implementation.
- If a previous commit in the same branch already created an ADR, **update it** rather than creating a new one.

### Documentation Decision Tree

Before committing, walk through this decision tree:

```
┌─ Did you add/remove a dependency or external service?
│  └─ YES → Create ADR (see below)
│
├─ Did you change how data is fetched, cached, or stored?
│  └─ YES → Create ADR
│
├─ Did you establish a pattern that will be used in 2+ places?
│  └─ YES → Create ADR + update CLAUDE.md
│
├─ Did you make a trade-off (chose X over Y for a reason)?
│  └─ YES → Create ADR
│
├─ Did you add a new feature or component type?
│  └─ YES → Add entry to Historical Context Log in AGENTS.md
│
├─ Did you refactor existing architecture?
│  └─ YES → Create ADR if approach changed, update ARCHITECTURE.md
│
└─ Did you learn something important (gotcha, failed approach)?
   └─ YES → Add entry to Historical Context Log in AGENTS.md
```

### ADR Triggers (MUST create ADR)

Create an ADR in `docs/decisions/` when ANY of these apply:

| Trigger | Example |
|---------|---------|
| New dependency added | Adding Vercel Analytics, a date library, etc. |
| Dependency removed | Removing TanStack Query in favor of built-in caching |
| New external API/service | Integrating OpenF1, adding SEO tools |
| Caching strategy change | Different TTLs for historical vs live data |
| Component architecture pattern | Server-first components, client boundary rules |
| Accessibility approach | WCAG compliance level, reduced motion handling |
| Performance optimization pattern | Code splitting rules, bundle size strategies |
| Security decision | Auth approach, API key handling |

### Historical Context Log Triggers (MUST add entry)

Add to the Historical Context Log in `AGENTS.md` when:

| Trigger | Example |
|---------|---------|
| New feature type added | PGA Tour golf (non-date-based sport) |
| Visual/UX decision | Simplifying CRT effects for clarity |
| Tool/service adoption | Adding Vercel Analytics |
| Implementation insight | Theme system localStorage approach |
| Failed approach worth noting | Why a library didn't work out |

### Creating an ADR

1. Copy `docs/decisions/000-template.md` to `docs/decisions/NNN-title.md`
2. Fill in ALL sections (Context, Decision, Consequences, Alternatives)
3. Update `docs/decisions/README.md` table
4. Update `AGENTS.md` Quick Decision Reference table
5. Reference ADR in commit message

### Commit Message References

When implementing documented decisions, reference them:

```text
feat: implement ESPN scoreboard caching

Implements caching strategy from ADR-001 using Next.js 16
"use cache" directive with 30-second TTL for live games.

Relates to: ADR-001, ADR-003
```

### Verification Before Merge

Before merging a PR (or on final commit of a branch), verify:

- [ ] Code checks pass: `pnpm lint && pnpm typecheck`
- [ ] Documentation decision tree evaluated for the branch as a whole
- [ ] Required ADRs created/updated and tables updated
- [ ] Historical Context Log updated if applicable
- [ ] ADRs reflect the **final implementation**, not intermediate iterations
- [ ] Commit/PR message references relevant ADRs

**During iteration:** Focus on code quality. Update existing documentation if the approach changes significantly, but don't create new ADRs for each iteration on the same decision.
