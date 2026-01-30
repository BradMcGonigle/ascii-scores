# [ADR-004] OpenF1 for Formula 1 Data

> **Status:** Accepted
>
> **Date:** 2026-01
>
> **Authors:** @BradMcGonigle

## Context

ASCII Scores includes Formula 1 race leaderboards. F1 data is notably difficult to obtain:

1. **Official F1 API** - Requires commercial partnership
2. **Ergast API** - Historical data only, no live timing (deprecated 2024)
3. **OpenF1** - Community project providing live F1 data

OpenF1 is a free, open-source API that captures and serves live F1 timing data including positions, lap times, telemetry, and race control messages.

## Decision

We will use **OpenF1 API** for all Formula 1 data.

Base URL: `https://api.openf1.org/v1`

Key endpoints:
```
GET /sessions                    # Race sessions (practice, quali, race)
GET /drivers?session_key={key}   # Driver info for session
GET /laps?session_key={key}      # Lap timing data
GET /position?session_key={key}  # Live position data
GET /car_data?session_key={key}  # Telemetry (speed, throttle, etc.)
GET /race_control               # Flags, safety car, messages
```

## Consequences

### Positive

- **Free and open source** - No cost, community maintained
- **Live data** - Real-time positions and timing during sessions
- **Rich data** - Includes telemetry, pit stops, race control
- **Good documentation** - Well-documented API with examples
- **Aligned values** - Open source project supporting open source project

### Negative

- **Community maintained** - No SLA or guaranteed uptime
- **Session-based** - Data organized by session, requires session lookup
- **F1 schedule dependent** - Only useful during race weekends
- **Data lag** - May have slight delay from official timing

### Neutral

- Different data structure than ESPN API (session-based vs event-based)

## Alternatives Considered

### Alternative 1: Official F1 API

Partner with Formula 1 for official data access.

**Pros:**
- Official, accurate data
- Real-time with no lag
- Full support

**Cons:**
- Requires commercial partnership
- Likely very expensive
- Complex approval process

**Why not chosen:** Not accessible for open source hobby projects.

### Alternative 2: Ergast API

Use the long-standing Ergast F1 API.

**Pros:**
- Well-established
- Good historical data

**Cons:**
- Deprecated as of 2024
- No live timing data
- Historical/results only

**Why not chosen:** Deprecated and lacks live data we need for real-time leaderboards.

### Alternative 3: FastF1 (Python Library)

Use FastF1 Python library via a backend service.

**Pros:**
- Excellent data analysis capabilities
- Access to historical timing data

**Cons:**
- Python dependency
- Requires separate backend service
- Primarily for post-session analysis

**Why not chosen:** Designed for analysis, not real-time display. Would add architectural complexity.

### Alternative 4: Web Scraping

Scrape live timing from F1 website.

**Pros:**
- Access to official displayed data

**Cons:**
- Extremely fragile
- Likely violates ToS
- Complex real-time scraping

**Why not chosen:** OpenF1 already does this work and provides a clean API.

## References

- [OpenF1 Documentation](https://openf1.org/)
- [OpenF1 GitHub](https://github.com/br-g/openf1)
- [FastF1 Library](https://github.com/theOehrly/Fast-F1)

---

## Implementation Notes

### Polling Strategy

F1 sessions have different data needs than ball sports:

```typescript
const F1_POLL_INTERVALS = {
  LIVE_SESSION: 10_000,    // 10 seconds during active sessions
  BETWEEN_SESSIONS: 300_000, // 5 minutes between sessions
  NO_WEEKEND: 3600_000     // 1 hour when no race weekend
};
```

### Session Detection

Before fetching position data, we need to find active sessions:

```typescript
export async function getCurrentF1Session() {
  "use cache";
  cacheLife("minutes", 5);

  const sessions = await fetch('https://api.openf1.org/v1/sessions?year=2026');
  const data = await sessions.json();

  // Find current or most recent session
  return findActiveSession(data);
}
```

### Data Mapping

OpenF1 position data maps to our leaderboard:

| OpenF1 Field | Display |
|--------------|---------|
| `position` | P (position column) |
| `driver_number` | Driver number |
| `name_acronym` | VER, HAM, LEC, etc. |
| `team_name` | Team name |
| `gap_to_leader` | Gap column |
| `last_lap_duration` | Last lap time |

### Graceful Handling

During non-race weekends:
- Show next scheduled session
- Display results from last completed session
- Clear messaging about data availability
