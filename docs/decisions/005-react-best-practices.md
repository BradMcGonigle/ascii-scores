# [ADR-005] Adopt Vercel React Best Practices

> **Status:** Accepted
>
> **Date:** 2026-01-30
>
> **Authors:** @claude

## Context

As the codebase grows, maintaining consistent coding patterns and ensuring optimal performance becomes increasingly important. Vercel has published a comprehensive set of React best practices based on 10+ years of React and Next.js optimization experience.

These practices address common performance issues:
- Request waterfalls (the #1 performance killer)
- Bundle size optimization
- Server component patterns
- Re-render optimization
- Client-side data fetching patterns

Additionally, proper ESLint configuration helps catch bugs early and enforces accessibility standards required by Vercel Conformance.

## Decision

We will adopt Vercel's React Best Practices as documented in:
- [Vercel Blog: Introducing React Best Practices](https://vercel.com/blog/introducing-react-best-practices)
- [vercel-labs/agent-skills/react-best-practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices/)

This includes:

### 1. Documentation Updates
- Added comprehensive React Best Practices section to `CLAUDE.md`
- Documented patterns with priority levels (Critical, High, Medium, Low-Medium)
- Included code examples showing anti-patterns vs correct patterns

### 2. ESLint Configuration Enhancements
- Added `eslint-plugin-jsx-a11y` for accessibility rules
- Enhanced React rules (`jsx-key`, `self-closing-comp`, `jsx-curly-brace-presence`)
- Added Next.js-specific rules (`no-img-element`, `no-sync-scripts`)
- Added stricter TypeScript rules (`no-explicit-any`, `prefer-as-const`)

### 3. Pattern Guidelines by Priority

| Priority | Category | Key Patterns |
|----------|----------|--------------|
| Critical | Waterfalls | `Promise.all()`, defer await, Suspense boundaries |
| Critical | Bundle Size | Direct imports, `next/dynamic`, no barrel files |
| High | Server | Server components by default, `React.cache()` |
| Medium | Re-renders | Derived state in render, `useCallback`, `useTransition` |
| Low-Medium | JavaScript | `Map`/`Set` lookups, combined iterations |

## Consequences

### Positive

- Consistent coding patterns across the codebase
- Early detection of performance anti-patterns via ESLint
- Improved accessibility through jsx-a11y rules
- AI agents have clear guidelines for writing performant React code
- Aligns with Vercel Conformance requirements

### Negative

- Stricter linting may require updates to existing code (currently all passes)
- Developers need to learn new patterns (documented in CLAUDE.md)
- Some rules are warnings rather than errors to avoid blocking development

### Neutral

- Existing codebase already follows most best practices (no changes needed)
- The patterns are recommendations, not absolute requirements

## Alternatives Considered

### Alternative 1: @vercel/style-guide Package

Use Vercel's complete style guide package for ESLint/Prettier configuration.

**Pros:**
- Single package for all tooling
- Matches Vercel's internal standards exactly

**Cons:**
- Very strict, may conflict with existing config
- Includes Prettier rules (we don't use Prettier)
- Larger dependency footprint

**Why not chosen:** Our existing ESLint config is already well-structured. Selectively adding the most impactful rules provides benefits without wholesale config changes.

### Alternative 2: No Additional Linting

Keep the existing ESLint configuration unchanged.

**Pros:**
- No configuration changes needed
- Lower risk of breaking existing code

**Cons:**
- Missing accessibility rules
- No automated enforcement of React patterns
- Less guidance for future development

**Why not chosen:** The benefits of automated pattern enforcement outweigh the minimal configuration effort.

## References

- [Vercel Blog: Introducing React Best Practices](https://vercel.com/blog/introducing-react-best-practices)
- [vercel-labs/agent-skills GitHub](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices/)
- [Vercel Conformance - ESLint Rules](https://vercel.com/docs/conformance/rules/ESLINT_REACT_RULES_REQUIRED)
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)

---

## Implementation Notes

- All existing code passes the enhanced ESLint rules without modification
- The codebase already demonstrates good practices:
  - `Promise.all()` for parallel fetching in `openf1.ts`
  - `useTransition` and `useCallback` in `RefreshButton.tsx`
  - Server components by default
  - Minimal client components (only 2)
