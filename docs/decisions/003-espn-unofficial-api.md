# [ADR-003] ESPN Unofficial API

> **Status:** Accepted
>
> **Date:** 2026-01
>
> **Authors:** @BradMcGonigle

## Context

ASCII Scores needs real-time scoreboard data for NHL, NFL, NBA, MLB, and MLS. Options for sports data include:

1. **Official APIs** (ESPN, Sports Radar, etc.) - Require partnerships, expensive licensing
2. **Unofficial APIs** - Undocumented endpoints used by official apps
3. **Web scraping** - Fragile, potentially violates ToS

ESPN's website and mobile apps use a "hidden" API at `site.api.espn.com` that returns JSON data. This API is:
- Undocumented but widely used by hobbyist projects
- Free to access (no API key required)
- Relatively stable (has existed for years)

## Decision

We will use **ESPN's unofficial API** for NHL, NFL, NBA, MLB, and MLS scoreboard data.

Base URL: `https://site.api.espn.com`

Endpoints:
```
/apis/site/v2/sports/{sport}/{league}/scoreboard
/apis/site/v2/sports/{sport}/{league}/scoreboard?dates=YYYYMMDD
/apis/site/v2/sports/{sport}/{league}/teams
```

League mappings:
| League | Path |
|--------|------|
| NFL | `football/nfl` |
| NBA | `basketball/nba` |
| NHL | `hockey/nhl` |
| MLB | `baseball/mlb` |
| MLS | `soccer/usa.1` |

## Consequences

### Positive

- **Free access** - No licensing costs or API keys
- **Comprehensive data** - Scores, game status, team info all available
- **Multi-league** - Single API pattern for 5 leagues
- **Real-time** - Data updates during live games

### Negative

- **No guarantees** - API could change or disappear without notice
- **No documentation** - Must reverse-engineer response formats
- **Rate limits unknown** - Must be conservative with request frequency
- **Legal gray area** - Not officially sanctioned for third-party use

### Neutral

- Response format is consistent across leagues (with sport-specific fields)

## Alternatives Considered

### Alternative 1: Official Sports APIs

Use official APIs like ESPN Developer, Sports Radar, or MySportsFeeds.

**Pros:**
- Documented and supported
- Guaranteed uptime and stability
- Legal clarity

**Cons:**
- Expensive ($500-$10,000+/month)
- Often require business partnerships
- May have usage restrictions

**Why not chosen:** Cost prohibitive for an open-source hobby project.

### Alternative 2: Web Scraping

Scrape scores directly from ESPN.com or similar sites.

**Pros:**
- Access to any visible data

**Cons:**
- Extremely fragile to HTML changes
- Higher bandwidth usage
- Likely violates ToS
- Complex parsing logic

**Why not chosen:** The JSON API is more reliable and efficient than scraping HTML.

### Alternative 3: Multiple Official Free APIs

Combine free tiers from various providers.

**Pros:**
- Official support for each source

**Cons:**
- Different data formats per league
- Complex integration
- Free tiers often have severe limitations

**Why not chosen:** ESPN's unified API is simpler than cobbling together multiple sources.

## References

- [ESPN Hidden API Examples](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)
- Community projects using the API (many open source examples)

---

## Implementation Notes

### Mitigation Strategies

Since this API is unofficial, we implement several safeguards:

1. **Aggressive caching** - Cache responses for 30+ seconds to reduce requests
2. **Graceful degradation** - Show cached data with "stale" indicator on errors
3. **Per-league error boundaries** - One league failing doesn't break others
4. **Exponential backoff** - Retry failed requests with increasing delays

### Response Caching Strategy

```typescript
const CACHE_TTL = {
  LIVE: 30,        // 30 seconds during live games
  PREGAME: 300,    // 5 minutes before games
  POSTGAME: 3600,  // 1 hour after games end
  OFFSEASON: 86400 // 24 hours during offseason
};
```

### Monitoring

If we detect issues:
1. Check if API structure changed
2. Update response parsers
3. Consider alternative data sources for affected leagues

### Re-evaluation Triggers

Consider alternatives if:
- ESPN blocks third-party access
- API structure changes frequently
- Project grows to need commercial support
