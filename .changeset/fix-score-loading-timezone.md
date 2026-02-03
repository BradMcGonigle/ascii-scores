---
"ascii-scores": patch
---

fix: resolve score loading errors on past dates

Fixed issues causing "Error loading scoreboard" on NHL, NBA, and other league pages when viewing yesterday's scores:

- Removed revalidateTag call that threw errors during Server Component rendering (not allowed in Next.js 16)
- Changed past date caching strategy from "cache forever with manual invalidation" to 5-minute time-based revalidation
- Fixed timezone inconsistencies: ESPNContent and validateDate now use league-appropriate timezone (Eastern for US sports, UK for EPL) instead of server UTC time
- Exported getTodayForLeague and getTimezoneForLeague functions from ESPN API module for reuse
