# Claude Code Instructions

This file provides context and guidelines for Claude Code when working on this project.

## Project Overview

ASCII Scores is a real-time sports scoreboard web application that displays live scores for NHL, NFL, NBA, MLB, MLS, and Formula 1 - rendered entirely in ASCII art style.

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

Use Next.js 16 `"use cache"` directive for server-side caching:

```typescript
export async function getScoreboard(league: League) {
  "use cache";
  cacheLife("seconds", 30);
  // fetch logic
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
