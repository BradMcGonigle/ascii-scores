---
"ascii-scores": minor
---

feat: Display sport-specific player stats on game detail pages

Previously, all sports were showing NHL stats (Hits, SOG, etc.) on game detail pages.
Now each sport shows appropriate stats with dynamic columns from ESPN API.

**Category-based stats for NFL and MLB:**
- NFL: Separate tables for Passing, Rushing, Receiving, Defense, Kicking, etc.
- MLB: Separate tables for Batting and Pitching

**Sport-specific fallback columns:**
- NBA/NCAAM/NCAAW: MIN, PTS, REB, AST, STL, BLK, FG, 3PT, FT, TO
- NFL: C/ATT, YDS, TD, INT, CAR, REC, TGTS, RYDS
- MLB: AB, R, H, RBI, HR, BB, SO, AVG
- MLS/EPL: G, A, SH, ST, FC, FS, SV, OF
- NHL: G, A, P, +/-, SOG, HIT, BLK, TOI (unchanged)
