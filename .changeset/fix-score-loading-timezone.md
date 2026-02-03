---
"ascii-scores": patch
---

fix: resolve timezone mismatch causing score loading errors on past dates

Fixed timezone inconsistencies in date handling that could cause "Error loading scoreboard" on NHL, NBA, and other league pages when viewing yesterday's scores:

- ESPNContent now uses league-appropriate timezone (Eastern for US sports, UK for EPL) when determining "today" for next game hints
- validateDate function now uses league-specific timezone for date range validation instead of server UTC time
- Exported getTodayForLeague and getTimezoneForLeague functions from ESPN API module for reuse
