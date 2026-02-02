# ASCII Scores CLI - Development Roadmap

## Current Status (v0.1.0)

### Completed
- [x] Monorepo structure with pnpm workspaces
- [x] `@ascii-scores/core` package with shared code
- [x] Basic TUI with Ink framework
- [x] Dashboard screen (all leagues with status counts)
- [x] League view (games grouped by Live/Scheduled/Final)
- [x] Basic keyboard navigation (j/k, arrows, 1-8, q, b)
- [x] ESPN API client for team sports

### Not Yet Implemented
- [ ] F1 API client in core package
- [ ] PGA API client in core package
- [ ] Game detail view
- [ ] Standings view
- [ ] Live polling/auto-refresh
- [ ] Date navigation
- [ ] Configuration file
- [ ] npm publishing

---

## Phase 1: Complete API Layer

### 1.1 Add F1 API Client to Core
**Priority: High** | **Effort: Medium**

```
packages/core/src/api/openf1.ts
```

- Port OpenF1 API client from web package
- Remove Next.js caching, use standard fetch
- Export F1 session and standings functions
- Add to core index exports

### 1.2 Add PGA API Client to Core
**Priority: Medium** | **Effort: Low**

```
packages/core/src/api/pga.ts
```

- Port PGA/Golf API client from web package
- Handle tournament leaderboard fetching
- Add to core index exports

### 1.3 Add Game Summary API to Core
**Priority: High** | **Effort: Medium**

```
packages/core/src/api/espn-summary.ts
```

- Port boxscore/game summary API from web package
- Required for game detail view
- Includes scoring plays, player stats, leaders

---

## Phase 2: Enhanced CLI Features

### 2.1 Game Detail View
**Priority: High** | **Effort: High**

New screen showing detailed game information:
- Large score display with team names
- Period/quarter scores table
- Scoring plays timeline
- Team statistics comparison
- Game leaders (top performers)

**Keyboard:** `Enter` on a game card → detail view, `b` → back

### 2.2 Standings View
**Priority: Medium** | **Effort: Medium**

New screen accessible from league view:
- Conference/division groupings
- Stat columns appropriate for each league
- Toggle between division and conference view

**Keyboard:** `s` from league view → standings

### 2.3 Date Navigation
**Priority: Medium** | **Effort: Low**

Navigate to different dates from league view:
- Show yesterday/today/tomorrow
- Display relative date label
- Fetch scoreboard for selected date

**Keyboard:** `h/l` or `←/→` to change date

### 2.4 F1 Race Weekend View
**Priority: Medium** | **Effort: Medium**

Specialized view for F1:
- List sessions (Practice 1-3, Quali, Sprint, Race)
- Driver standings table
- Gap/interval display
- Session status indicators

### 2.5 Golf Leaderboard View
**Priority: Medium** | **Effort: Medium**

Specialized view for PGA:
- Tournament name and status
- Player leaderboard table
- Score to par with coloring
- Round-by-round scores
- Cut line indicator

---

## Phase 3: Live Updates & Polish

### 3.1 Auto-Refresh / Polling
**Priority: High** | **Effort: Medium**

Automatic data refresh while viewing:
- Poll every 30s when live games exist
- Poll every 5m when no live games
- Visual indicator showing refresh status
- Manual refresh with `r` key

### 3.2 Loading States
**Priority: Medium** | **Effort: Low**

Better loading UX:
- Spinner during initial load
- Stale data indicator during refresh
- Error states with retry option

### 3.3 Help Screen
**Priority: Low** | **Effort: Low**

Dedicated help screen (`?` key):
- Full keyboard shortcut reference
- Navigation guide
- Version and links

---

## Phase 4: Configuration & Distribution

### 4.1 Configuration File
**Priority: Medium** | **Effort: Medium**

Support `~/.ascii-scores.json` or `~/.config/ascii-scores/config.json`:

```json
{
  "favoriteLeagues": ["nhl", "nba"],
  "refreshInterval": 30,
  "theme": "default",
  "showOffseasonLeagues": false
}
```

### 4.2 Command Line Arguments
**Priority: Medium** | **Effort: Low**

Enhance CLI with arguments:
- `scores nhl` → jump directly to NHL
- `scores --no-refresh` → disable auto-refresh
- `scores --config <path>` → custom config file

### 4.3 npm Publishing
**Priority: High** | **Effort: Low**

Prepare for npm publish:
- Finalize package.json metadata
- Add README with install instructions
- Set up GitHub Actions for publishing
- Test global install: `npm i -g ascii-scores-cli`

---

## Phase 5: Advanced Features (Future)

### 5.1 Favorites & Notifications
- Mark favorite teams
- Desktop notifications for score changes
- Highlight favorite team games

### 5.2 Historical Data
- View past game results
- Season statistics
- Playoff brackets

### 5.3 Multiple Themes
- Dark/light themes
- Custom color schemes
- Reduced motion mode

### 5.4 Search
- Search for teams
- Filter games by team

---

## Technical Debt

### Web Package Updates
After CLI is stable, update web package to import from `@ascii-scores/core`:
- Update imports in web package
- Remove duplicate type definitions
- Share API clients between web and CLI

### Testing
- Add unit tests for API parsing
- Add component tests for Ink components
- Add integration tests for navigation flows

### Documentation
- CLI README with usage examples
- API documentation for core package
- Contributing guide for CLI development

---

## Implementation Order (Recommended)

1. **Phase 1.1** - F1 API client (enables F1 in CLI)
2. **Phase 1.3** - Game summary API (enables detail view)
3. **Phase 2.1** - Game detail view
4. **Phase 3.1** - Auto-refresh polling
5. **Phase 2.3** - Date navigation
6. **Phase 1.2** - PGA API client
7. **Phase 2.2** - Standings view
8. **Phase 2.4** - F1 race weekend view
9. **Phase 2.5** - Golf leaderboard view
10. **Phase 4.3** - npm publishing
11. **Phase 4.1** - Configuration file
12. **Phase 4.2** - CLI arguments

---

## Version Milestones

| Version | Features |
|---------|----------|
| 0.1.0 | ✅ Basic TUI, dashboard, league view |
| 0.2.0 | Game detail view, auto-refresh |
| 0.3.0 | Date navigation, standings view |
| 0.4.0 | F1 and PGA support |
| 0.5.0 | Configuration file, CLI args |
| 1.0.0 | npm publish, stable API |
