# ASCII Sports Scoreboard - Architecture Plan

```
    _    ____   ____ ___ ___   ____   ____ ___  ____  _____ ____
   / \  / ___| / ___|_ _|_ _| / ___| / ___/ _ \|  _ \| ____/ ___|
  / _ \ \___ \| |    | | | |  \___ \| |  | | | | |_) |  _| \___ \
 / ___ \ ___) | |___ | | | |   ___) | |__| |_| |  _ <| |___ ___) |
/_/   \_\____/ \____|___|___| |____/ \____\___/|_| \_\_____|____/

```

## Overview

An open-source web application that displays real-time sports scoreboards for NHL, NFL, NBA, MLS, MLB, and Formula 1 - rendered entirely in ASCII art style.

---

## Data Sources

### ESPN Hidden API (NHL, NFL, NBA, MLB, MLS)

| League | Sport Path | Scoreboard Endpoint |
|--------|------------|---------------------|
| NFL | `football/nfl` | `/apis/site/v2/sports/football/nfl/scoreboard` |
| NBA | `basketball/nba` | `/apis/site/v2/sports/basketball/nba/scoreboard` |
| NHL | `hockey/nhl` | `/apis/site/v2/sports/hockey/nhl/scoreboard` |
| MLB | `baseball/mlb` | `/apis/site/v2/sports/baseball/mlb/scoreboard` |
| MLS | `soccer/usa.1` | `/apis/site/v2/sports/soccer/usa.1/scoreboard` |

**Base URL:** `https://site.api.espn.com`

**Key Endpoints:**
```
GET /apis/site/v2/sports/{sport}/{league}/scoreboard
GET /apis/site/v2/sports/{sport}/{league}/scoreboard?dates=YYYYMMDD
GET /apis/site/v2/sports/{sport}/{league}/teams
GET /apis/site/v2/sports/{sport}/{league}/teams/{teamId}
```

### OpenF1 API (Formula 1)

**Base URL:** `https://api.openf1.org/v1`

**Key Endpoints:**
```
GET /sessions                    # Race sessions (practice, quali, race)
GET /drivers?session_key={key}   # Driver info for session
GET /laps?session_key={key}      # Lap timing data
GET /position?session_key={key}  # Live position data
GET /car_data?session_key={key}  # Telemetry (speed, throttle, etc.)
GET /race_control               # Flags, messages
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     ASCII RENDERER (React 19)                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │   NHL    │ │   NFL    │ │   NBA    │ │   MLB    │ │   MLS    │  │   │
│  │  │Scoreboard│ │Scoreboard│ │Scoreboard│ │Scoreboard│ │Scoreboard│  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  │                        ┌──────────┐                                  │   │
│  │                        │    F1    │                                  │   │
│  │                        │ Leaderboard                                 │   │
│  │                        └──────────┘                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS (REST / WebSocket)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EDGE / API LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 16.1 + Turbopack                          │   │
│  │                                                                       │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐    │   │
│  │   │  API Routes │    │   Caching   │    │  Rate Limit Handler │    │   │
│  │   │  /api/[lg]  │    │  (30-60s)   │    │   (Per-source)      │    │   │
│  │   └─────────────┘    └─────────────┘    └─────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│         ESPN HIDDEN API           │ │           OPENF1 API              │
│  ┌─────────────────────────────┐  │ │  ┌─────────────────────────────┐  │
│  │  site.api.espn.com          │  │ │  │  api.openf1.org/v1          │  │
│  │                             │  │ │  │                             │  │
│  │  • NFL Scoreboard           │  │ │  │  • Sessions                 │  │
│  │  • NBA Scoreboard           │  │ │  │  • Drivers                  │  │
│  │  • NHL Scoreboard           │  │ │  │  • Positions                │  │
│  │  • MLB Scoreboard           │  │ │  │  • Lap Times                │  │
│  │  • MLS Scoreboard           │  │ │  │  • Race Control             │  │
│  └─────────────────────────────┘  │ │  └─────────────────────────────┘  │
└───────────────────────────────────┘ └───────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 16.1 (App Router) | Server components, `"use cache"` directive, Turbopack |
| **Language** | TypeScript | Type safety for API responses |
| **Styling** | Tailwind CSS v4 | Monospace fonts, ASCII theming |
| **Data Fetching** | Server Components + `"use cache"` | Built-in caching, no external libraries needed |
| **Client Polling** | `useEffect` + `router.refresh()` | Simple, native React patterns |
| **Hosting** | Vercel | Edge functions, global CDN, native Next.js support |

### Why No TanStack Query?

Next.js 16 provides everything we need out of the box:

| Need | Next.js 16 Solution |
|------|---------------------|
| Server caching | `"use cache"` directive on components/functions |
| Time-based revalidation | `cacheLife()` configuration |
| Cache invalidation | `revalidateTag()` / `revalidatePath()` |
| Stale-while-revalidate | Built into fetch with `next: { revalidate }` |
| Client refresh | `router.refresh()` preserves client state |

This app is **read-only** with simple polling - no complex mutations or optimistic updates that would justify adding TanStack Query.

---

## Component Architecture

```
src/
├── app/
│   ├── layout.tsx              # ASCII-styled root layout
│   ├── page.tsx                # Dashboard with all leagues
│   ├── [league]/
│   │   └── page.tsx            # League-specific view
│   └── api/
│       ├── espn/
│       │   └── [league]/
│       │       └── route.ts    # ESPN proxy with caching
│       └── f1/
│           └── [endpoint]/
│               └── route.ts    # OpenF1 proxy with caching
│
├── components/
│   ├── ascii/
│   │   ├── AsciiBox.tsx        # Reusable bordered box
│   │   ├── AsciiTable.tsx      # Table with ASCII borders
│   │   ├── AsciiLogo.tsx       # Team/league logo renderer
│   │   └── AsciiProgress.tsx   # Progress bars (game clock, etc.)
│   │
│   ├── scoreboards/
│   │   ├── BaseScoreboard.tsx  # Shared scoreboard logic
│   │   ├── NHLScoreboard.tsx   # Hockey-specific (periods, SOG)
│   │   ├── NFLScoreboard.tsx   # Football-specific (quarters, downs)
│   │   ├── NBAScoreboard.tsx   # Basketball-specific (quarters)
│   │   ├── MLBScoreboard.tsx   # Baseball-specific (innings, outs)
│   │   ├── MLSScoreboard.tsx   # Soccer-specific (halves, stoppage)
│   │   └── F1Leaderboard.tsx   # Race positions, gaps, pit stops
│   │
│   └── layout/
│       ├── Header.tsx          # ASCII art header
│       ├── Navigation.tsx      # League selector
│       └── Footer.tsx          # Credits, refresh indicator
│
├── lib/
│   ├── api/
│   │   ├── espn.ts             # ESPN API client
│   │   ├── openf1.ts           # OpenF1 API client
│   │   └── types.ts            # Shared API response types
│   │
│   ├── ascii/
│   │   ├── renderer.ts         # Core ASCII rendering utilities
│   │   ├── fonts.ts            # ASCII art font definitions
│   │   └── logos.ts            # Team logo ASCII art
│   │
│   └── utils/
│       ├── cache.ts            # Caching utilities
│       └── format.ts           # Score/time formatting
│
└── styles/
    └── globals.css             # Monospace font, ASCII theme
```

---

## Data Flow

### Polling Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     POLLING INTERVALS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LIVE GAMES:                                                     │
│  ┌─────────┐                                                    │
│  │ 30 sec  │ ←── NHL, NFL, NBA, MLB, MLS (ESPN)                │
│  └─────────┘                                                    │
│  ┌─────────┐                                                    │
│  │ 10 sec  │ ←── F1 during sessions (OpenF1)                   │
│  └─────────┘                                                    │
│                                                                  │
│  NO LIVE GAMES:                                                  │
│  ┌─────────┐                                                    │
│  │  5 min  │ ←── All leagues (schedule check)                  │
│  └─────────┘                                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Caching Strategy

```typescript
// Cache TTL by game state
const CACHE_TTL = {
  LIVE: 30,        // 30 seconds during live games
  PREGAME: 300,    // 5 minutes before games
  POSTGAME: 3600,  // 1 hour after games end
  OFFSEASON: 86400 // 24 hours during offseason
};
```

### Data Normalization

```typescript
// Normalized game structure (all leagues)
interface NormalizedGame {
  id: string;
  league: 'nhl' | 'nfl' | 'nba' | 'mlb' | 'mls' | 'f1';
  status: 'scheduled' | 'live' | 'final' | 'postponed';
  startTime: Date;

  home: {
    id: string;
    name: string;
    abbreviation: string;
    score: number;
    logo?: string; // ASCII art reference
  };

  away: {
    id: string;
    name: string;
    abbreviation: string;
    score: number;
    logo?: string;
  };

  // League-specific details
  details: {
    period?: string;      // "2nd", "Q3", "7th"
    clock?: string;       // "12:34", "3:21"
    situation?: string;   // "1st & 10", "2 Outs"
  };
}
```

---

## ASCII Rendering System

### Box Drawing Characters

```
Standard Box:          Rounded Box:          Double Box:
┌──────────┐          ╭──────────╮          ╔══════════╗
│  Content │          │  Content │          ║  Content ║
└──────────┘          ╰──────────╯          ╚══════════╝

Table Structure:
┌────────┬────────┬────────┐
│ Header │ Header │ Header │
├────────┼────────┼────────┤
│  Data  │  Data  │  Data  │
└────────┴────────┴────────┘
```

### Example Scoreboard Renders

**NHL Game:**
```
╔══════════════════════════════════════════╗
║           NHL  •  2ND PERIOD             ║
║                  12:34                    ║
╠══════════════════════════════════════════╣
║                                          ║
║    BOS  ████████████████████░░░░  3     ║
║    TOR  ████████████░░░░░░░░░░░░  2     ║
║                                          ║
║  SOG: 24-18      PP: 1/2 - 0/1          ║
╚══════════════════════════════════════════╝
```

**NFL Game:**
```
╔══════════════════════════════════════════╗
║           NFL  •  Q3  8:42               ║
╠══════════════════════════════════════════╣
║                                          ║
║         KC     14  7  3  -  24          ║
║         SF      7  7  7  -  21          ║
║                                          ║
║     ◆ KC Ball • 2nd & 7 at SF 35       ║
╚══════════════════════════════════════════╝
```

**F1 Leaderboard:**
```
╔══════════════════════════════════════════╗
║      FORMULA 1  •  MONACO GP  LAP 42/78  ║
╠════╤═══════════════╤═══════╤═════════════╣
║ P  │ DRIVER        │ GAP   │ LAST LAP    ║
╠════╪═══════════════╪═══════╪═════════════╣
║  1 │ VER Red Bull  │ ----  │ 1:12.345    ║
║  2 │ LEC Ferrari   │ +2.1s │ 1:12.567    ║
║  3 │ HAM Mercedes  │ +4.8s │ 1:12.891    ║
║  4 │ NOR McLaren   │ +6.2s │ 1:13.012    ║
║  5 │ SAI Ferrari   │ +8.5s │ 1:13.234 P  ║
╚════╧═══════════════╧═══════╧═════════════╝
```

### ASCII Logo System

```typescript
// Team logos stored as ASCII art arrays
const TEAM_LOGOS: Record<string, string[]> = {
  'bos': [
    '  ____  ',
    ' | __ ) ',
    ' |  _ \\ ',
    ' | |_) |',
    ' |____/ ',
  ],
  // ... more teams
};
```

---

## Data Fetching Implementation

### Cached Data Functions (Next.js 16 "use cache")

```typescript
// lib/api/espn.ts
import { cacheLife } from 'next/cache';

const LEAGUE_MAP = {
  nhl: 'hockey/nhl',
  nfl: 'football/nfl',
  nba: 'basketball/nba',
  mlb: 'baseball/mlb',
  mls: 'soccer/usa.1',
} as const;

export type League = keyof typeof LEAGUE_MAP;

export async function getScoreboard(league: League) {
  "use cache";
  cacheLife("seconds", 30); // Cache for 30 seconds

  const path = LEAGUE_MAP[league];
  const url = `https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard`;

  const response = await fetch(url);
  const data = await response.json();

  return normalizeESPNData(data, league);
}
```

```typescript
// lib/api/openf1.ts
import { cacheLife } from 'next/cache';

export async function getF1Sessions() {
  "use cache";
  cacheLife("minutes", 5); // Cache for 5 minutes

  const response = await fetch('https://api.openf1.org/v1/sessions?year=2026');
  return response.json();
}

export async function getF1Positions(sessionKey: string) {
  "use cache";
  cacheLife("seconds", 10); // Cache for 10 seconds during live sessions

  const response = await fetch(
    `https://api.openf1.org/v1/position?session_key=${sessionKey}`
  );
  return response.json();
}
```

### Server Component Usage

```typescript
// app/[league]/page.tsx
import { getScoreboard, type League } from '@/lib/api/espn';
import { Scoreboard } from '@/components/scoreboards/Scoreboard';

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ league: League }>;
}) {
  const { league } = await params;
  const games = await getScoreboard(league);

  return <Scoreboard league={league} games={games} />;
}
```

### Client-Side Polling

```typescript
// components/ScoreboardRefresh.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ScoreboardRefresh({ intervalMs = 30000 }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh(); // Re-fetches server components, preserves client state
    }, intervalMs);

    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return null;
}
```

---

## Error Handling & Fallbacks

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING STRATEGY                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. API FAILURE                                                  │
│     └─→ Show cached data with "stale" indicator                 │
│     └─→ Retry with exponential backoff (2s, 4s, 8s)            │
│                                                                  │
│  2. RATE LIMITED                                                 │
│     └─→ Extend polling interval                                 │
│     └─→ Show "updating slowly" message                          │
│                                                                  │
│  3. NO GAMES TODAY                                               │
│     └─→ Show schedule for upcoming games                        │
│     └─→ Display last completed games                            │
│                                                                  │
│  4. ESPN API CHANGES                                             │
│     └─→ Graceful degradation per league                         │
│     └─→ Error boundary with ASCII error art                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### ASCII Error Display

```
╔══════════════════════════════════════════╗
║                                          ║
║      _____ ____  ____   ___  ____       ║
║     | ____|  _ \|  _ \ / _ \|  _ \      ║
║     |  _| | |_) | |_) | | | | |_) |     ║
║     | |___|  _ <|  _ <| |_| |  _ <      ║
║     |_____|_| \_\_| \_\\___/|_| \_\     ║
║                                          ║
║   Unable to load NHL scores              ║
║   Last updated: 5 minutes ago            ║
║                                          ║
║         [ Retry ]  [ View Cache ]        ║
╚══════════════════════════════════════════╝
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   Edge      │    │   Serverless │    │   Static    │        │
│   │   Network   │───▶│   Functions  │───▶│   Assets    │        │
│   │   (CDN)     │    │   (API)      │    │   (ISR)     │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│                             │                                    │
│                             ▼                                    │
│                    ┌─────────────┐                              │
│                    │  Vercel KV  │ (Optional Redis cache)       │
│                    └─────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Development Phases

### Phase 1: Foundation
- [ ] Project setup (Next.js 16.1, TypeScript, Tailwind v4)
- [ ] ASCII rendering utilities
- [ ] ESPN API integration (one league)
- [ ] Basic scoreboard component

### Phase 2: All Leagues
- [ ] All ESPN leagues (NHL, NFL, NBA, MLB, MLS)
- [ ] League-specific scoreboard designs
- [ ] OpenF1 integration
- [ ] F1 leaderboard component

### Phase 3: Polish
- [ ] Team ASCII logos
- [ ] Responsive design (mobile ASCII)
- [ ] Dark/light theme toggle
- [ ] Keyboard navigation

### Phase 4: Advanced Features
- [ ] Real-time updates (WebSocket/SSE)
- [ ] Game detail pages
- [ ] Historical scores
- [ ] PWA support

---

## File Structure Summary

```
ascii-scores/
├── README.md
├── ARCHITECTURE.md          # This document
├── package.json
├── next.config.ts           # Next.js 16 config (TypeScript)
├── tsconfig.json
│
├── public/
│   └── fonts/
│       └── monospace.woff2
│
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css      # Tailwind v4 (CSS-first config)
│   │   └── [league]/
│   │       └── page.tsx
│   ├── components/          # React components
│   └── lib/                 # Utilities & API clients
│
└── tests/
    ├── api/                 # API integration tests
    └── components/          # Component tests
```

---

## Key Considerations

### Performance
- Server-side rendering for initial load
- Edge caching for API responses
- Minimal client-side JavaScript
- ASCII art is lightweight (just text!)

### Accessibility
- Semantic HTML structure
- Screen reader friendly scores
- Keyboard navigation
- High contrast ASCII art

### Legal
- ESPN API is unofficial - respect rate limits
- OpenF1 is community-driven - follow their terms
- No official league branding/trademarks
- Open source under MIT license

---

*Architecture document for ASCII Sports Scoreboard*
*Data Sources: ESPN Hidden API, OpenF1 API*
