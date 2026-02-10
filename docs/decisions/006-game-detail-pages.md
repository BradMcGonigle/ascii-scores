# [ADR-006] Game Detail Pages with ESPN Summary API

> **Status:** Accepted
>
> **Date:** 2026-02
>
> **Authors:** @BradMcGonigle

## Context

ASCII Scores currently displays live scoreboards with basic game information (scores, status, team records). Users requested more detailed game information including:
- Full boxscore with period-by-period breakdown
- Player statistics and game leaders
- Scoring timeline with assists and goal types
- Team statistics comparison
- Goalie/goalkeeper statistics

The ESPN unofficial API provides a Summary endpoint that includes all this data for completed and in-progress games.

## Decision

We will implement **game detail pages** using ESPN's unofficial Summary API endpoint.

Base URL: `https://site.api.espn.com/apis/site/v2/sports/{sport}/summary?event={gameId}`

### Implementation Details

1. **Route Structure**: `/{league}/game/{gameId}`
2. **Supported Leagues**: NHL, NFL, NBA, MLB, MLS, EPL, NCAAM, NCAAW (all ESPN-based leagues)
3. **Navigation**: Make game cards clickable to navigate to detail pages
4. **Caching Strategy**: ISR with 30-second revalidation
5. **Data Mapping**: Sport-specific parsers to handle different ESPN response formats

### Data Handling

Different sports use different data structures:
- **NBA**: Uses `displayValue` for linescores
- **NHL/NFL/MLB**: Use `value` for linescores
- **Hockey**: Separate stats for goalies vs. skaters
- **Soccer**: Possession-based stats
- **Basketball/Football**: Shooting/passing percentage stats

### Caching Strategy

```typescript
export const revalidate = 30; // Page-level ISR config
```

- **Final games**: Cached for 30s, then effectively infinite (data doesn't change)
- **Live games**: Revalidates every 30s for score updates
- **Scheduled games**: Revalidates every 30s until game starts
- **On Vercel**: ISR keeps pages cached until next deployment

**API Cost**: 1 additional request per game viewed, cached for 30s

## Consequences

### Positive

- **Rich Detail**: Users get comprehensive game information beyond basic scores
- **Same Data Source**: Reuses ESPN API infrastructure (ADR-003)
- **Efficient Caching**: Final games cached indefinitely, live games update frequently
- **Sport-Aware**: Handles each sport's unique stats and terminology
- **Low API Cost**: Aggressive caching minimizes requests (30s revalidation)
- **Graceful Degradation**: Missing data (stats, leaders, etc.) handled with null checks

### Negative

- **ESPN Dependency**: More reliance on unofficial ESPN API
- **Complex Data Mapping**: Each sport has different response structure requiring custom parsers
- **Maintenance Burden**: Need to update parsers if ESPN changes formats
- **No F1/PGA Support**: ESPN doesn't provide summary data for these leagues

### Neutral

- **Additional Route**: Adds `/{league}/game/{gameId}` route pattern
- **Client Components**: Some interactivity (refresh button) requires client components
- **TypeScript Complexity**: Extensive types needed for all sports' stats

## Alternatives Considered

### Alternative 1: Scoreboard Data Only

Keep the app scoreboard-only without detail pages.

**Pros:**
- Simpler architecture
- Lower API usage
- Easier maintenance

**Cons:**
- Limited user value
- No competitive differentiation
- Users must go to ESPN.com for details

**Why not chosen:** Users explicitly requested detailed game information.

### Alternative 2: Client-Side Fetching

Fetch game details on the client side instead of server-side.

**Pros:**
- Lower server load
- Faster initial page load

**Cons:**
- No SEO benefits
- Slower perceived performance (loading states)
- Can't leverage Next.js ISR caching
- CORS issues with ESPN API

**Why not chosen:** Server-side rendering with ISR provides better UX and caching.

### Alternative 3: Build Static Pages for All Games

Pre-render detail pages for all games at build time.

**Pros:**
- Fastest possible page loads
- Zero API requests after build

**Cons:**
- Massive build times (thousands of games per day)
- Can't update live game data
- Vercel build limits would be exceeded

**Why not chosen:** ISR provides the right balance of performance and freshness.

### Alternative 4: Separate API Service

Build our own backend service that fetches and caches ESPN data.

**Pros:**
- Full control over caching logic
- Can implement complex retry/fallback logic
- Could aggregate data from multiple sources

**Cons:**
- Requires separate infrastructure
- Additional operational complexity
- More expensive (server costs)
- Duplicates Next.js's built-in caching

**Why not chosen:** Next.js ISR already provides excellent caching capabilities.

## Implementation Notes

### Sport-Specific Data Handling

Each sport requires custom mapping logic:

```typescript
// NBA uses displayValue for linescores
const score = ls.value ?? (ls.displayValue ? parseInt(ls.displayValue, 10) : 0);

// Hockey separates goalies from skaters
const isGoalieCategory = category.name?.toLowerCase().includes("goalie");

// Period labels vary by sport
NHL: P1, P2, P3, OT
NBA/NFL: Q1, Q2, Q3, Q4, OT
MLB: 1, 2, 3, 4, 5, 6, 7, 8, 9...
MLS/EPL: 1H, 2H, ET
```

### Defensive Data Parsing

ESPN API responses are inconsistent. All parsers include:
- Null checks for missing data: `if (!category.athletes) continue;`
- Optional chaining: `category.name?.toLowerCase()`
- Fallback values: `ls.value ?? 0`
- Filter operations: `.filter((l) => l.athlete && l.team)`

### Responsive Design

ASCII borders use flexbox for responsive width:

```tsx
<span className="flex-1 overflow-hidden whitespace-nowrap tracking-[0]">
  {"═".repeat(200)}
</span>
```

This ensures borders fill available width on all screen sizes.

### Error Handling

- Missing game data: Show "Game not found" message
- API errors: Log detailed error info, return null
- Partial data: Show available sections, hide missing ones

## References

- [ADR-003: ESPN Unofficial API](003-espn-unofficial-api.md)
- [ESPN Summary API Examples](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)
- [Next.js ISR Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)

## Re-evaluation Triggers

Consider changes if:
- ESPN blocks or rate-limits the Summary endpoint
- API structure changes frequently across sports
- Users request features not available in ESPN data (advanced analytics, historical comparisons)
- Performance issues arise from complex data parsing
