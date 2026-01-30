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

### 2026-01

- **Project initiated** with focus on ASCII aesthetic and minimal dependencies
- **Architecture planned** around Next.js 16's new caching primitives
- **Decision to avoid TanStack Query** - evaluated but determined Next.js 16 covers our read-only use case
- **Adopted Vercel React Best Practices** - enhanced ESLint with jsx-a11y plugin, documented patterns in CLAUDE.md (ADR-005)

---

*This file should be updated whenever significant decisions are made or project context changes.*
