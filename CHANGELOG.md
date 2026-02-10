# ascii-scores

## 0.28.0

### Minor Changes

- 43c93b7: feat: Redesign PGA leaderboard with ESPN-style layout and sticky columns

  - Add tournament score header with top 3 leaders display
  - Implement horizontally scrollable table with sticky POS and PLAYER columns
  - Add zebra striping for better readability
  - Fix NaN display issue in TOT column when round data is incomplete
  - Hide country codes on mobile for better space utilization
  - Improve tournament navigation responsiveness on mobile devices

## 0.27.0

### Minor Changes

- dfd09ff: feat: Improve F1 leaderboard with tabbed sessions, lap data, and ESPN-style layout

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

### Patch Changes

- 6f1902f: style: Add zebra striping to player stats tables on game detail pages

## 0.26.1

### Patch Changes

- a2f8477: refactor: Use sport-specific stat abbreviation mappings

  Each sport now has its own mapping for stat keys to abbreviations, preventing conflicts when different sports use the same key with different conventions.

  **Sport-specific mappings:**

  - NHL: assists="A", points="P", hits="HIT"
  - NBA/NCAAM/NCAAW: assists="AST", points="PTS"
  - NFL: Full passing/rushing/receiving/defense stat abbreviations
  - MLB: Batting (hits="H") and pitching stat abbreviations
  - MLS/EPL: Soccer-specific stat abbreviations

  Also adds missing NHL stat abbreviations: powerPlayGoals (PPG), powerPlayAssists (PPA), shortHandedGoals (SHG), gameWinningGoals (GWG), shotPct (S%), faceoffPct (FO%), avgTimeOnIce (ATOI).

## 0.26.0

### Minor Changes

- 45d5153: feat: Display sport-specific player stats with dynamic columns and category support

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

## 0.25.0

### Minor Changes

- 07f430b: style: Add responsive ASCII line utilities and standardize double-line borders

  ### Responsive ASCII Lines

  - Add `.ascii-line` and `.ascii-fill` CSS utilities for responsive ASCII borders
  - These utilities use flexbox to create borders that fill available width without overflow
  - Pattern: use `flex-1 overflow-hidden whitespace-nowrap` with repeated characters

  ### Double-Line Border Standardization

  - Update all game cards to use double-line borders (`═`, `║`, `╔`, `╗`, `╚`, `╝`) regardless of game status
  - Update game detail score header and period scores table to use double-line borders
  - Maintain visual differentiation through color:
    - Live games: green
    - Final games: muted gray
    - Scheduled games: yellow

  ### Updated Components

  - `AsciiDivider`: Now responsive by default (pass `width` prop for fixed-width behavior)
  - `GameCard`: All statuses use consistent double-line borders
  - `GameDetail`: Score header and period scores table use double-line borders
  - Changelog page: Uses new responsive divider pattern

  ### Bug Fix

  - Fix horizontal rule overflow on mobile changelog page

## 0.24.0

### Minor Changes

- 75f03d2: feat: Add ASCII stat comparison bars to game detail pages

  Team statistics on game detail pages now display visual comparison bars below each stat, showing the proportional split between away and home teams. The leading team's bar is highlighted in a distinct color for quick visual comparison.

## 0.23.2

### Patch Changes

- 41758a5: fix: Improve loading screen border alignment and preserve page layout during loading

## 0.23.1

### Patch Changes

- e8a5d28: style: Change league page grid from 4 to 3 columns on desktop

## 0.23.0

### Minor Changes

- ae6a127: feat: Add enhanced game details for scheduled games

  - Display team matchup section with full team names and records
  - Show team colors as accent borders for visual identification
  - Label statistics as "Season Stats" to clarify these are season-to-date numbers
  - Display college rankings prominently for NCAA basketball games
  - Show venue name and location in game info section
  - Display game type badges (Preseason, Postseason, All-Star) for non-regular season games
  - Improve responsive layout with two-column design on desktop
  - Fix period scores table responsiveness on mobile devices

## 0.22.0

### Minor Changes

- f76ee3a: feat: Add tournament navigation and enhanced leaderboard for PGA
- f76ee3a: feat: Add TV broadcast info to game cards and detail pages

### Patch Changes

- 983c1d2: fix: Improve color contrast ratios to meet WCAG AA accessibility standards

  - Dark theme: Updated muted text color from #5c6370 to #8b949e (5.5:1 contrast ratio)
  - Dark theme: Updated border color from #1a1f29 to #30363d (3:1 contrast ratio)
  - Light theme: Updated muted text color from #6b7280 to #57606a (6:1 contrast ratio)
  - Light theme: Updated border color from #d1d5db to #9ca3af (3:1 contrast ratio)
  - Animation: Increased glow-pulse minimum opacity from 0.7 to 0.85 to maintain contrast

- 9e0518d: fix: resolve score loading errors on past dates

  Fixed issues causing "Error loading scoreboard" on NHL, NBA, and other league pages when viewing yesterday's scores:

  - Removed revalidateTag call that threw errors during Server Component rendering (not allowed in Next.js 16)
  - Changed past date caching strategy from "cache forever with manual invalidation" to 5-minute time-based revalidation
  - Fixed timezone inconsistencies: ESPNContent and validateDate now use league-appropriate timezone (Eastern for US sports, UK for EPL) instead of server UTC time
  - Exported getTodayForLeague and getTimezoneForLeague functions from ESPN API module for reuse

## 0.21.0

### Minor Changes

- feat: Extend date navigation to allow browsing up to 1 year of past games
- feat: Extend F1 race weekend navigation to show full year of past races

### Patch Changes

- perf: Implement sliding window navigation to minimize API calls while allowing deep history browsing

## 0.20.2

### Patch Changes

- fix: Fix timezone bug causing stale game statuses (live games showing as scheduled or vice versa)

## 0.20.1

### Patch Changes

- fix: Fix game detail score layout overflowing on mobile devices

## 0.20.0

### Minor Changes

- feat: Add game detail pages with full boxscore, scoring summary, and player stats for all ESPN leagues
- feat: Add ESPN Summary API integration with sport-specific data mapping (NBA, NHL, NFL, MLB, MLS, EPL, NCAAM, NCAAW)
- feat: Add period-by-period scoring breakdown with sport-specific labels (periods, quarters, innings, halves)
- feat: Add scoring timeline with assists and strength indicators (power play, short-handed, etc.)
- feat: Add team statistics comparison side-by-side (shots, possession, faceoffs, etc.)
- feat: Add game leaders display for top performers in key stat categories
- feat: Add detailed player stats tables with goalie-specific stats for hockey
- feat: Make game cards clickable to navigate to detail pages
- feat: Implement ISR caching with 30s revalidation (effectively infinite cache for final games)
- feat: Add responsive ASCII borders that adapt to desktop and mobile widths
- feat: Add expanded stats to standings pages (streak, home/away, L10, etc.)
- feat: Add horizontally scrollable standings tables with sticky team column

### Patch Changes

- fix: Handle sport-specific ESPN API data structures (NBA displayValue vs NHL value)
- fix: Add defensive data parsing with null checks for incomplete API responses
- fix: Remove redundant 'View Details' text from game cards (entire card is clickable)
- style: Optimize ASCII border rendering with tight line-height for seamless appearance

## 0.19.0

### Minor Changes

- feat: Add day-level precision for league season dates (e.g., MLS starts Feb 21, not Mar 1)
- feat: Add division/conference toggle to standings pages

### Patch Changes

- style: Improve homepage layout with equal-height league cards
- style: Remove terminal-style pre-header for cleaner interface
- style: Move theme selector to footer with consistent styling
- style: Make 'no games' message responsive on mobile
- fix: Limit homepage grid to 3 columns for wide league names (NCAAM/NCAAW)

## 0.18.1

### Patch Changes

- fix: Fix stale 'today' view showing yesterday's games after midnight
- fix: Use league-appropriate timezones for schedules (US Eastern for US sports, UK for EPL)

## 0.18.0

### Minor Changes

- feat: Add league standings pages for all ESPN sports
- feat: Display division/conference standings with ASCII tables
- feat: Add standings link to league score pages

## 0.17.0

### Minor Changes

- feat: Sort leagues by season status and popularity
- feat: Add separate 'In Season' and 'Off-Season' sections on homepage
- feat: Add season dates and popularity rankings to league configuration

## 0.16.0

### Minor Changes

- feat: Add English Premier League (EPL) support

### Patch Changes

- refactor: Sort leagues alphabetically in navigation and homepage

## 0.15.0

### Minor Changes

- feat: Add changelog page with full history of changes

## 0.14.0

### Minor Changes

- feat: Add countdown to next auto-refresh in sync status

### Patch Changes

- fix: Display last synced time in user's local timezone

## 0.13.1

### Patch Changes

- fix: Pad ASCII art lines to equal length for consistent rendering
- revert: Remove Fira Code web font - made rendering worse

## 0.13.0

### Minor Changes

- feat: Add NCAA men's and women's basketball support
- feat: Add ASCII block letters for NCAAM and NCAAW leagues

### Patch Changes

- fix: Add college basketball to mobile navigation
- fix: Only show top 25 rankings for college basketball
- fix: Use NBA stats format for college basketball game cards

## 0.12.1

### Minor Changes

- feat: Add accessible stat definitions with abbr elements

### Patch Changes

- fix: Restore NHL, NFL, NBA block letters styling

## 0.12.0

### Minor Changes

- feat: Replace sport icons with ASCII block letter league names
- feat: Implement large ASCII league icons on homepage

## 0.11.0

### Minor Changes

- feat: Add team records to game cards
- feat: Update NHL game stats to show G, A, SV%
- feat: Update NBA live stats and scheduled game venue display
- feat: Update NBA final game stats to show shooting percentages

### Patch Changes

- fix: Align period scores borders with other card rows

## 0.10.0

### Patch Changes

- fix: Display scheduled game times in user's local timezone

## 0.9.0

### Minor Changes

- feat: Add PGA to navigation and enable full-width layout for PGA/F1

## 0.8.0

### Minor Changes

- feat: Add race weekend navigation for F1
- feat: Cache F1 historical races and add date navigation
- feat: Cache historical scores indefinitely to reduce API calls

## 0.7.0

### Minor Changes

- feat: Implement comprehensive SEO best practices
- feat: Improve golf leaderboard with round tabs and better formatting
- feat: Add PGA Tour golf support

### Patch Changes

- fix: Improve PGA API with multiple endpoint fallbacks

## 0.6.0

### Patch Changes

- fix: Comprehensive accessibility improvements for WCAG 2.1 AA compliance

## 0.5.0

### Patch Changes

- refactor: Convert Navigation to server component with minimal client boundary

## 0.4.0

### Minor Changes

- feat: Add period/quarter/inning score breakdowns to game cards
- feat: Add game statistics and update README examples

### Patch Changes

- style: Simplify CRT effects for cleaner ASCII aesthetic

## 0.3.0

### Minor Changes

- feat: Add light theme with system/dark/light selector

### Patch Changes

- fix: Use theme-aware colors for cards, shadows, and patterns
- fix: Show theme selector on mobile screens

## 0.2.0

### Minor Changes

- feat: Add smart date navigation that skips to days with games
- feat: Add date navigation for viewing past and upcoming scores

### Patch Changes

- fix: Make scoreboard cards responsive with flexible alignment

## 0.1.0

### Minor Changes

- feat: Enhance ASCII art styling with retro CRT terminal aesthetic
- feat: Adopt Vercel React best practices

### Patch Changes

- fix: Add mobile hamburger menu to navigation
- fix: Improve mobile responsive layout to prevent horizontal scrolling
- feat: Scaffold Next.js 16 application structure
