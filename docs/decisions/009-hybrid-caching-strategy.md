# [ADR-009] Hybrid Caching Strategy for Historical vs Live Data

> **Status:** Accepted
>
> **Date:** 2026-01-30
>
> **Authors:** @BradMcGonigle

## Context

ASCII Scores fetches data from ESPN and OpenF1 APIs to display sports scores. The application supports viewing:
- **Today's scores** - Live games that update frequently
- **Historical scores** - Past games (up to 30 days back) that are final and won't change
- **Upcoming games** - Future scheduled games (up to 14 days forward)

Initially, all API requests used the same 30-second cache TTL. This approach:
- Wasted Vercel serverless function invocations on historical data that never changes
- Could hit rate limits unnecessarily
- Increased costs as users browse historical dates

## Decision

We will implement a **hybrid caching strategy** that varies cache duration based on the data's temporal nature:

1. **Historical data (past dates)**: Cache indefinitely (`revalidate: false`)
   - Final scores won't change; cache until next deployment
   - Applies to both ESPN league data and OpenF1 session data

2. **Live/current data (today)**: Cache for 30 seconds (`revalidate: 30`)
   - Scores update during games; need fresh data
   - Balances freshness with API respect

3. **Future data (upcoming games)**: Cache for 30 seconds (`revalidate: 30`)
   - Schedule changes are rare but possible
   - Same treatment as live data for simplicity

Implementation uses a shared `isDateInPast()` utility to determine caching behavior:

```typescript
const isPast = isDateInPast(date);
const response = await fetch(url, {
  next: { revalidate: isPast ? false : 30 },
});
```

## Consequences

### Positive

- **Reduced serverless invocations** - Historical pages served from cache indefinitely
- **Lower costs** - Fewer API calls when browsing past dates
- **Faster page loads** - Cached historical data served instantly
- **Better API citizenship** - Reduced load on ESPN/OpenF1 servers

### Negative

- **Stale historical data until redeploy** - If a game result is corrected (rare), users see old data until next deployment
- **Slight complexity** - Caching logic varies by date

### Neutral

- Cache invalidation on deployment clears all cached data, ensuring fresh start

## Alternatives Considered

### Alternative 1: Uniform 30-second caching for all data

Keep the original simple approach with consistent TTL.

**Pros:**
- Simple, predictable behavior
- Always fresh data

**Cons:**
- Wasteful for historical data
- Higher costs and function invocations

**Why not chosen:** The cost and efficiency benefits of differential caching outweigh the minor complexity.

### Alternative 2: Long TTL (1 hour) for historical data

Use a very long TTL instead of indefinite caching.

**Pros:**
- Data eventually refreshes without deployment
- Less aggressive than indefinite

**Cons:**
- Still has unnecessary revalidation for truly static data
- 1 hour is arbitrary

**Why not chosen:** Historical sports scores genuinely don't change; indefinite caching is appropriate and simpler.

### Alternative 3: Static generation for historical dates

Pre-render historical pages at build time.

**Pros:**
- Truly static, fastest possible
- No runtime caching logic

**Cons:**
- Would generate thousands of pages (all leagues × all dates)
- Build times would explode
- Can't pre-render future dates anyway

**Why not chosen:** On-demand caching with indefinite TTL achieves similar benefits without build-time complexity.

## References

- [PR #21: Cache historical scores indefinitely](https://github.com/BradMcGonigle/ascii-scores/pull/21) - Initial implementation for ESPN leagues
- [PR #22: Cache F1 historical races](https://github.com/BradMcGonigle/ascii-scores/pull/22) - Extended to OpenF1 with date navigation
- [ADR-001: Next.js 16 Framework](./001-nextjs-16-framework.md) - Foundation for caching approach
- [Next.js Data Fetching docs](https://nextjs.org/docs/app/building-your-application/data-fetching)

---

## Implementation Notes

- `isDateInPast()` utility located in `src/lib/utils/date.ts`
- Applied to both `src/lib/api/espn.ts` and `src/lib/api/openf1.ts`
- Date comparison uses local timezone for consistency with user expectations
