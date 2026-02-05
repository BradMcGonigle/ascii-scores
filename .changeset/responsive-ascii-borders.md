---
"ascii-scores": minor
---

style: Add responsive ASCII line utilities and standardize double-line borders

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
