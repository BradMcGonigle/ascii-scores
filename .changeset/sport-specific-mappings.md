---
"ascii-scores": patch
---

refactor: Use sport-specific stat abbreviation mappings

Each sport now has its own mapping for stat keys to abbreviations, preventing conflicts when different sports use the same key with different conventions.

**Sport-specific mappings:**
- NHL: assists="A", points="P", hits="HIT"
- NBA/NCAAM/NCAAW: assists="AST", points="PTS"
- NFL: Full passing/rushing/receiving/defense stat abbreviations
- MLB: Batting (hits="H") and pitching stat abbreviations
- MLS/EPL: Soccer-specific stat abbreviations

Also adds missing NHL stat abbreviations: powerPlayGoals (PPG), powerPlayAssists (PPA), shortHandedGoals (SHG), gameWinningGoals (GWG), shotPct (S%), faceoffPct (FO%), avgTimeOnIce (ATOI).
