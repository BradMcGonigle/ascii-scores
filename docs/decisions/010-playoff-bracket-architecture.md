# [ADR-010] Playoff Bracket Architecture

> **Status:** Accepted
>
> **Date:** 2026-02
>
> **Authors:** @BradMcGonigle

## Context

NFL playoffs just ended (Super Bowl LX, February 2026). We want to display playoff brackets showing the full tournament structure with matchups, scores, and progression.

ESPN's unofficial scoreboard API provides individual game data but has no structured bracket or seed endpoint. Additionally, the API's `year` parameter does not work for historical postseason data — it always returns the current season's data regardless of what year value is passed.

We are starting with NFL but designing the system to be extensible for NBA, NHL, and MLB playoff brackets later.

Key constraints:

- No dedicated ESPN playoffs/bracket API exists
- The `year` query parameter on the scoreboard endpoint is ignored for postseason data
- NFL expanded to a 14-team playoff format starting in the 2020 season
- Home/away positioning in NFL playoff games indicates seeding (higher seed hosts)
- Unicode box-drawing characters have inconsistent rendered widths across browsers and fonts, making character-counting approaches for responsive borders unreliable

## Decision

We will build playoff brackets from ESPN scoreboard game data using a **date-based discovery approach**:

1. **Calendar discovery**: Make an anchor-date API call to the ESPN scoreboard endpoint to retrieve the playoff calendar from `leagues[0].calendar`, which contains round names and date ranges
2. **Parallel game fetching**: Fetch all games within each round's date range using `Promise.all()` for parallel requests
3. **Conference parsing**: Extract conference affiliation (AFC/NFC) from `competition.notes[].headline` field
4. **Seed inference**: Infer team seeds from home/away positioning, as the higher seed hosts in NFL playoff games
5. **Typed bracket structure**: Build the bracket using `PlayoffBracket`, `PlayoffMatchup`, and `BracketTeam` types designed for multi-league extensibility

### Layout

- **Desktop**: 7-column CSS grid layout: `AFC-WC | AFC-DIV | AFC-CONF | SB | NFC-CONF | NFC-DIV | NFC-WC`
- **Mobile**: Stacked rounds in reverse order (championship first) for immediate visibility of the most important games

### Historical Seasons

Historical seasons are supported via a `?year=` query parameter. Since the ESPN `year` param doesn't work for postseason, we use the calendar discovery approach to find the correct date ranges for any given season. Supported range is 2020+ (NFL expanded playoff format with 14 teams).

### Responsive Box-Drawing Borders

For Unicode box-drawing borders that need to fill available space, we use a **CSS flex-based overflow pattern**: a flex-1 container with `overflow-hidden` containing repeated box-drawing characters. This approach adapts to any container width without JavaScript measurement. Character-counting approaches were attempted first but abandoned due to inconsistent Unicode character widths across browsers and fonts.

## Consequences

### Positive

- Works for all NFL seasons from 2020 onward (expanded playoff format)
- Parallel fetching via `Promise.all()` minimizes total load time despite multiple API calls
- Type system (`PlayoffBracket`, `PlayoffMatchup`, `BracketTeam`) is designed for extensibility to NBA, NHL, and MLB brackets
- Date-based discovery is resilient to ESPN API changes since it uses the API's own calendar data
- CSS flex-based borders are truly responsive without JavaScript measurement or resize observers

### Negative

- Multiple API calls required per bracket render: one for calendar discovery plus one per round date range
- Seed inference relies on the NFL convention that the higher seed hosts — this assumption may not hold for other leagues
- Conference extraction depends on parsing free-text `notes[].headline` field, which could change format

### Neutral

- Game data is cached with a 5-minute TTL for active games; calendar data is cached with a 24-hour TTL since round date ranges don't change
- The 7-column desktop grid works well for NFL's symmetric AFC/NFC bracket but will need adaptation for leagues with different bracket structures

## Alternatives Considered

### Alternative 1: ESPN Playoffs API Endpoint

Use a dedicated ESPN playoffs or bracket API endpoint that returns structured bracket data.

**Pros:**
- Would provide seeds, matchups, and bracket structure directly
- Single API call instead of multiple

**Cons:**
- No such endpoint exists in ESPN's unofficial API
- Even if discovered, unofficial endpoints can disappear without notice

**Why not chosen:** The endpoint does not exist. ESPN's API surfaces playoff games through the same scoreboard endpoint as regular season games.

### Alternative 2: ESPN `year` Parameter for Historical Data

Use the scoreboard endpoint's `year` query parameter to fetch historical postseason data directly.

**Pros:**
- Simple single-parameter approach
- No date math or calendar discovery needed

**Cons:**
- Does not work — the `year` parameter is ignored for postseason data and always returns the current season

**Why not chosen:** Tested and confirmed non-functional. The API always returns current-season postseason data regardless of the `year` value passed.

### Alternative 3: Character-Counting for Box-Drawing Borders

Calculate the number of Unicode box-drawing characters needed to fill a container width based on character width measurements.

**Pros:**
- Precise control over exact character count
- Conceptually simple approach

**Cons:**
- Unicode box-drawing characters (e.g., `─`, `═`) render at inconsistent widths across browsers and fonts
- Requires JavaScript measurement and resize observers
- Breaks when font loading is delayed or when the browser applies font substitution

**Why not chosen:** Attempted and abandoned. The inconsistent character widths in browsers make this approach fundamentally unreliable. The CSS flex-based overflow pattern solves the problem without any JavaScript.

## References

- [ESPN Scoreboard API](https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard) - Game data source
- [ADR-003 - ESPN Unofficial API](./003-espn-unofficial-api.md) - Base ESPN API integration decisions
- [ADR-009 - Hybrid Caching Strategy](./009-hybrid-caching-strategy.md) - Caching approach for live vs historical data

---

## Implementation Notes

- The `leagues[0].calendar` array in the ESPN scoreboard response contains entries with `label` (round name) and `startDate`/`endDate` fields that define each playoff round
- Conference is extracted by checking if `competition.notes[].headline` contains "AFC" or "NFC"
- For the Super Bowl, both conferences are represented in a single neutral-site game
- The `BracketTeam` type includes an optional `seed` field to support leagues where seeds are explicitly provided rather than inferred
