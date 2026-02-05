---
"ascii-scores": minor
---

feat: Display sport-specific player stats with dynamic columns and category support

Previously, all sports were showing NHL stats (Hits, SOG, etc.) on game detail pages. Now each sport displays appropriate statistics with proper formatting.

**Category-based stats for NFL and MLB:**
- NFL: Separate tables for Passing, Rushing, Receiving, Defense, Kicking, Punting, Returns
- MLB: Separate tables for Batting and Pitching

**Dynamic columns from ESPN API:**
- Uses stat keys provided by ESPN for accurate column display
- Comprehensive abbreviation mapping (e.g., "completions/passingAttempts" → "C/ATT")
- Falls back to sport-specific defaults when ESPN keys unavailable

**UX improvements:**
- Player name column is sticky during horizontal scroll
- Player Statistics section hidden when no data available (EPL/MLS don't provide player box scores)
- Improved name display with fallback chain (shortName → displayName → name)

**Sport-specific fallback columns:**
- NBA/NCAAM/NCAAW: MIN, PTS, REB, AST, STL, BLK, FG, 3PT, FT, TO
- NFL: C/ATT, YDS, TD, INT, CAR, REC, TGTS, RYDS
- MLB: AB, R, H, RBI, HR, BB, SO, AVG
- MLS/EPL: Hidden (ESPN doesn't provide player-level stats for soccer)
- NHL: G, A, P, +/-, SOG, HIT, BLK, TOI (unchanged)
