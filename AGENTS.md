# AI Agents Guide

This file provides context for AI agents (Claude, GPT, Copilot, etc.) working on this codebase. It includes project understanding, historical context, and guidelines for maintaining documentation during development.

## Project Summary

**ASCII Scores** is a real-time sports scoreboard web application displaying live scores for NHL, NFL, NBA, MLB, MLS, and Formula 1 - rendered entirely in ASCII art.

### Core Principles

1. **Simplicity over complexity** - Use framework primitives before adding libraries
2. **Performance first** - Server-side rendering, aggressive caching, minimal client JS
3. **Accessibility** - ASCII art must have text alternatives for screen readers
4. **Respect external APIs** - Cache aggressively, never abuse rate limits

### Tech Stack Rationale

| Choice | Why |
|--------|-----|
| Next.js 16.1 | `"use cache"` directive, App Router, Turbopack - eliminates need for external caching libraries |
| No TanStack Query | App is read-only with simple polling; Next.js 16 caching covers our needs |
| Tailwind CSS v4 | CSS-first config, perfect for monospace/ASCII theming |
| pnpm | Fast, disk-efficient, strict dependency resolution |
| Vercel | Native Next.js support, edge functions, global CDN |

## Key Documentation

| Document | Purpose |
|----------|---------|
| `ARCHITECTURE.md` | Detailed system design, data flows, component structure |
| `CLAUDE.md` | Claude-specific coding instructions and patterns |
| `docs/decisions/` | Architecture Decision Records (ADRs) with historical context |
| `CONTRIBUTING.md` | Contribution guidelines for humans |

## Decision Records

All significant architectural and technical decisions are documented in `docs/decisions/` as Architecture Decision Records (ADRs).

**When to create an ADR:**
- Choosing between multiple viable approaches
- Adopting or rejecting a library/framework
- Establishing patterns that affect multiple files
- Making trade-offs with long-term implications
- Reversing or superseding a previous decision

**ADR Format:** See `docs/decisions/000-template.md`

### Quick Decision Reference

| Decision | Status | Summary |
|----------|--------|---------|
| [001 - Next.js 16 Framework](docs/decisions/001-nextjs-16-framework.md) | Accepted | Use Next.js 16.1 with App Router for built-in caching |
| [002 - No TanStack Query](docs/decisions/002-no-tanstack-query.md) | Accepted | Rely on Next.js caching instead of external state library |
| [003 - ESPN Unofficial API](docs/decisions/003-espn-unofficial-api.md) | Accepted | Use ESPN's hidden API with aggressive caching |
| [004 - OpenF1 for Formula 1](docs/decisions/004-openf1-api.md) | Accepted | Use community OpenF1 API for F1 data |
| [005 - React Best Practices](docs/decisions/005-react-best-practices.md) | Accepted | Adopt Vercel's React best practices and enhanced ESLint rules |
| [006 - Game Detail Pages](docs/decisions/006-game-detail-pages.md) | Accepted | Use ESPN Summary API for detailed game data with ISR caching |
| [007 - Server Component Patterns](docs/decisions/007-server-component-patterns.md) | Accepted | Minimize client JS with server-first component design |
| [008 - WCAG Accessibility](docs/decisions/008-wcag-accessibility.md) | Accepted | WCAG 2.1 AA compliance with reduced motion support |
| [009 - Hybrid Caching Strategy](docs/decisions/009-hybrid-caching-strategy.md) | Accepted | Cache historical data indefinitely, live data at 30s |
| [010 - Native Apple Companion App](docs/decisions/010-native-apple-companion-app.md) | Proposed | SwiftUI app in monorepo for widgets, Live Activities, and native Apple platform features |

## Development Context

### Current Phase

The project is in **Phase 1: Foundation** (see `ARCHITECTURE.md` for full roadmap).

### Active Development Areas

Update this section as development progresses:

- [ ] Project setup (Next.js 16.1, TypeScript, Tailwind v4)
- [ ] ASCII rendering utilities
- [ ] ESPN API integration
- [ ] Basic scoreboard components

### Known Constraints

1. **ESPN API is unofficial** - Could change without notice; design for graceful degradation
2. **Rate limits** - ESPN: unknown limits, be conservative; OpenF1: community resource, be respectful
3. **No official branding** - Cannot use league logos or trademarks

## Guidelines for AI Agents

### Before Making Changes

1. **Read relevant ADRs** in `docs/decisions/` to understand why things are built this way
2. **Check ARCHITECTURE.md** for system design context
3. **Review existing patterns** in similar files before creating new ones

### During Development

1. **Follow established patterns** - Don't introduce new patterns without documenting why
2. **Update documentation** when making significant changes:
   - New architectural decisions → Create ADR
   - API changes → Update ARCHITECTURE.md
   - New patterns → Update CLAUDE.md
3. **Keep this file current** - Update "Active Development Areas" as work progresses

### When to Create/Update Documentation

| Action | Documentation Required |
|--------|----------------------|
| Add new library | ADR explaining why it's needed |
| Change data fetching pattern | ADR + update ARCHITECTURE.md |
| Add new API endpoint | Update ARCHITECTURE.md |
| Establish new coding pattern | Update CLAUDE.md |
| Complete a development phase | Update this file's "Current Phase" |
| Make breaking changes | ADR documenting migration path |

### Commit Message Context

When commits relate to documented decisions, reference them:

```
feat: implement ESPN scoreboard caching

Implements caching strategy from ADR-001 using Next.js 16
"use cache" directive with 30-second TTL for live games.
```

## Historical Context Log

This section captures important context that doesn't fit in formal ADRs - discussions, experiments, and learnings.

### 2026-02

- **Added game detail pages** (PR #38) - click-through from scoreboard to full boxscore with play-by-play, team stats, and player stats; uses ESPN Summary API with ISR caching (ADR-006)
- **Added league standings pages** (PR #36) - comprehensive standings for all ESPN sports with division/conference groupings; reuses existing API patterns
- **Added division/conference toggle** (PR #37) - standings can be viewed by division, conference, or full league; user preference persisted
- **Added changelog page** (PR #32) - in-app changelog at /changelog showing version history; changelog maintained in code as TypeScript constant for type safety
- **Added NCAA basketball** (PR #29) - men's (NCAAM) and women's (NCAAW) college basketball; follows established ESPN league pattern
- **Added English Premier League** (PR #33) - EPL soccer support following existing MLS pattern
- **Extended hybrid caching to F1** (PR #22) - F1 historical sessions now cached indefinitely like ESPN leagues; added date navigation for browsing past race weekends
- **Local timezone display** (PR #24, #31, #39) - game times and "last synced" timestamps now display in user's local timezone; uses Intl.DateTimeFormat for localization
- **Semantic versioning adopted** (PR #30) - added semver workflow to CLAUDE.md; version bumps required for feat/fix commits with changelog entries
- **League sorting by season status** (PR #34) - homepage leagues sorted by active season first, then by popularity; improves UX during off-seasons

### 2026-01

- **Project initiated** with focus on ASCII aesthetic and minimal dependencies
- **Architecture planned** around Next.js 16's new caching primitives
- **Decision to avoid TanStack Query** - evaluated but determined Next.js 16 covers our read-only use case
- **Adopted Vercel React Best Practices** - enhanced ESLint with jsx-a11y plugin, documented patterns in CLAUDE.md (ADR-005)
- **Enhanced ASCII art styling** - added CRT effects (scanlines, vignette, phosphor glow), sport icons, and retro terminal aesthetic to differentiate from other sports score sites
- **Simplified CRT effects** (PR #15) - removed heavy scanline overlay and vignette effects in favor of cleaner ASCII borders; glow effects replaced with simple bold text; decision driven by visual clarity over maximum retro simulation
- **Added Vercel Web Analytics** (PR #11) - chose Vercel Analytics for native Next.js integration and zero-config setup; privacy-friendly (no cookies, GDPR compliant); tracks page views and Web Vitals automatically
- **Implemented theme system** (PR #14) - light/dark/system theme with localStorage persistence; CRT effects reduced in light mode; uses CSS variables for theme switching without flash; system preference detected via `prefers-color-scheme`
- **Added PGA Tour golf** (PR #19) - established pattern for adding non-date-based sports; golf uses tournament leaderboard view instead of daily scores; demonstrates extensibility of the league architecture
- **Comprehensive SEO implementation** (PR #20) - added OpenGraph/Twitter cards, JSON-LD structured data (Organization, WebSite, BreadcrumbList), XML sitemap, robots.txt, and PWA manifest; pattern for future metadata needs

---

*This file should be updated whenever significant decisions are made or project context changes.*
