---
"ascii-scores": patch
---

fix: Display sport-specific player stats on game detail pages

Previously, all sports were showing NHL stats (Hits, SOG, etc.) on game detail pages.
Now each sport shows appropriate stats:
- NBA/NCAAM/NCAAW: MIN, PTS, REB, AST, STL, BLK, FG, 3PT, FT, TO
- NFL: C/ATT, YDS, TD, INT, CAR, REC, TGTS, RYDS
- MLB: AB, R, H, RBI, HR, BB, SO, AVG
- MLS/EPL: G, A, SH, ST, FC, FS, SV, OF
- NHL: G, A, P, +/-, SOG, HIT, BLK, TOI (unchanged)
