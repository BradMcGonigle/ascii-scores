# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) documenting significant technical and architectural decisions made during the development of ASCII Scores.

## What is an ADR?

An ADR is a document that captures an important architectural decision along with its context and consequences. ADRs help:

- **New contributors** understand why things are built a certain way
- **AI agents** make informed decisions that align with project philosophy
- **Future maintainers** understand trade-offs when considering changes
- **The team** remember why decisions were made months or years later

## When to Write an ADR

Create an ADR when:

- Choosing between multiple viable technical approaches
- Adopting, rejecting, or removing a library or framework
- Establishing patterns that will be used across the codebase
- Making trade-offs that have long-term implications
- Reversing or modifying a previous decision

**Don't** create an ADR for:

- Trivial decisions with obvious answers
- Temporary solutions clearly marked as tech debt
- Style preferences covered by linting rules

## ADR Format

Use the template in `000-template.md`. Each ADR should include:

1. **Title** - Short noun phrase (e.g., "Use Next.js 16 Framework")
2. **Status** - Proposed, Accepted, Deprecated, or Superseded
3. **Context** - What is the issue motivating this decision?
4. **Decision** - What is the change being proposed/adopted?
5. **Consequences** - What are the positive and negative results?
6. **Alternatives Considered** - What other options were evaluated?

## File Naming Convention

```
NNN-short-title.md
```

- `NNN` - Three-digit sequence number (001, 002, etc.)
- `short-title` - Lowercase, hyphen-separated summary

Examples:
- `001-nextjs-16-framework.md`
- `002-no-tanstack-query.md`
- `003-espn-unofficial-api.md`

## ADR Lifecycle

```
Proposed → Accepted → [Deprecated | Superseded]
```

- **Proposed** - Under discussion, not yet implemented
- **Accepted** - Decision made and implemented
- **Deprecated** - No longer relevant (e.g., feature removed)
- **Superseded** - Replaced by a newer ADR (link to replacement)

When superseding an ADR:
1. Update the old ADR's status to "Superseded by [ADR-NNN](./NNN-title.md)"
2. Reference the old ADR in the new one's context

## Current ADRs

| # | Title | Status | Date |
|---|-------|--------|------|
| [001](001-nextjs-16-framework.md) | Use Next.js 16 Framework | Accepted | 2026-01 |
| [002](002-no-tanstack-query.md) | No TanStack Query | Accepted | 2026-01 |
| [003](003-espn-unofficial-api.md) | ESPN Unofficial API | Accepted | 2026-01 |
| [004](004-openf1-api.md) | OpenF1 for Formula 1 | Accepted | 2026-01 |
| [005](005-react-best-practices.md) | Adopt Vercel React Best Practices | Accepted | 2026-01 |
| [006](006-game-detail-pages.md) | Game Detail Pages with ESPN Summary API | Accepted | 2026-02 |
| [007](007-server-component-patterns.md) | Server Component Patterns | Accepted | 2026-01 |
| [008](008-wcag-accessibility.md) | WCAG 2.1 AA Accessibility | Accepted | 2026-01 |
| [009](009-hybrid-caching-strategy.md) | Hybrid Caching Strategy | Accepted | 2026-01 |
| [010](010-playoff-bracket-architecture.md) | Playoff Bracket Architecture | Accepted | 2026-02 |

## Contributing

When adding a new ADR:

1. Copy `000-template.md` to `NNN-your-title.md`
2. Fill in all sections thoroughly
3. Update the table above
4. Update `AGENTS.md` quick reference table
5. Reference the ADR in commit messages when implementing
