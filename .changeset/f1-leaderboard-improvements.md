---
"ascii-scores": minor
---

feat: Improve F1 leaderboard with tabbed sessions, lap data, and ESPN-style layout

- Add tabbed interface to switch between race weekend sessions (Race, Qualifying, Sprint, Practice)
- Convert fixed-width ASCII tables to responsive HTML tables with full-width layout
- Add zebra striping and sticky driver column for better readability
- Fetch additional data from OpenF1 API: lap times, pit stops, stints
- Show different columns based on session type (matching ESPN layout):
  - Race: POS, DRIVER, TEAM, RACE TIME, LAPS, PITS, FASTEST LAP
  - Sprint: POS, DRIVER, TEAM, RACE TIME, LAPS, FASTEST LAP
  - Qualifying/Practice: POS, DRIVER, TEAM, TIME, LAPS
- Display full driver names instead of three-letter codes
- Default to most important session (Race > Qualifying > Sprint > Practice)
