# Sports Event Notifications Implementation Plan

## Overview

This plan outlines the architecture and implementation approach for adding user-subscribable event notifications for NHL and NFL games in ASCII Scores. Users will be able to subscribe to individual games and receive browser push notifications for specific events.

## Notification Requirements

### NHL

| Event | Trigger | Notification Content |
|-------|---------|---------------------|
| Game Start | `status: scheduled → live` | "BOS vs TOR has started!" |
| Goal Scored | New entry in `scoringPlays[]` | "GOAL! BOS: Pastrnak (PP) - BOS 2, TOR 1" |
| Period End | `period` increases | "End of 2nd Period - BOS 2, TOR 1" |
| Game End | `status: live → final` | "FINAL: BOS 3, TOR 2" |

### NFL

| Event | Trigger | Notification Content |
|-------|---------|---------------------|
| Game Start | `status: scheduled → live` | "KC vs SF has kicked off!" |
| Score | Score increases (any amount) | "TOUCHDOWN! KC scores - KC 14, SF 7" |
| Quarter End | `period` increases | "End of Q2 - KC 14, SF 10" |
| Game End | `status: live → final` | "FINAL: KC 31, SF 28" |

---

## Architecture

### Recommended Approach: Hybrid Push Architecture

The system uses Web Push API with a lightweight polling backend hosted on Vercel:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NOTIFICATION ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐      ┌─────────────────┐      ┌─────────────────────────┐  │
│  │   Browser   │◄────▶│  Service Worker │◄─────│    Web Push Server      │  │
│  │             │      │  (Background)   │      │    (Vercel Edge/KV)     │  │
│  └─────────────┘      └─────────────────┘      └───────────┬─────────────┘  │
│                                                             │                │
│  User subscribes to game ─► Subscription stored ─► Server polls ESPN        │
│                                                             │                │
│                                                             ▼                │
│                                              ┌─────────────────────────────┐ │
│                                              │  ESPN API (existing)        │ │
│                                              │  30-second poll interval    │ │
│                                              └─────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Server-Side Push

| Factor | Client-Only Pull | Server Push (Recommended) |
|--------|------------------|---------------------------|
| Background delivery | Requires tab open | Works when browser closed |
| Battery impact | High (constant polling) | Low (push-based) |
| Scalability | Per-user polling | Single poll, multi-user push |
| Complexity | Lower | Higher (needs backend) |
| User experience | Poor | Native notification feel |

---

## Data Models

### User Notification Subscription

```typescript
interface NotificationSubscription {
  id: string;                         // UUID
  pushSubscription: PushSubscription; // Web Push subscription object
  subscribedGames: GameSubscription[];
  createdAt: Date;
  lastSeen: Date;                     // For cleanup of stale subscriptions
}

interface GameSubscription {
  gameId: string;
  league: "nhl" | "nfl";
  homeTeam: string;
  awayTeam: string;
  events: {
    gameStart: boolean;
    gameEnd: boolean;
    scoring: boolean;     // Goals (NHL) or any score (NFL)
    periodEnd: boolean;   // Periods (NHL) or quarters (NFL)
  };
  subscribedAt: Date;
}
```

### Cached Game State (for event detection)

```typescript
interface CachedGameState {
  gameId: string;
  league: string;
  status: GameStatus;
  homeScore: number;
  awayScore: number;
  period: number;
  scoringPlaysCount: number;  // For detecting new scores
  lastUpdated: Date;
}
```

### Local Storage Schema

```typescript
interface LocalNotificationState {
  subscriptionId: string;     // Links to server subscription
  subscribedGames: {
    [gameId: string]: {
      league: string;
      events: EventPreferences;
    };
  };
  permissionGranted: boolean;
  lastPromptDismissed?: Date; // For "don't ask again" UX
}
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/notifications/subscribe` | POST | Register push subscription + game preferences |
| `/api/notifications/unsubscribe` | DELETE | Remove subscription for a game |
| `/api/notifications/subscriptions` | GET | Get user's active subscriptions |
| `/api/notifications/vapid-public-key` | GET | Return VAPID public key for push subscription |

---

## Event Detection Logic

### NHL Goal Detection

```typescript
function detectNHLGoal(prev: GameState, curr: GameState): ScoringEvent | null {
  // Check if scoring plays array grew
  if (curr.scoringPlays.length > prev.scoringPlays.length) {
    const newPlay = curr.scoringPlays[curr.scoringPlays.length - 1];
    return {
      type: "goal",
      scorer: newPlay.scorer.name,
      team: newPlay.team.abbreviation,
      strength: newPlay.strength, // PP, SH, EN, etc.
      assists: newPlay.assists?.map(a => a.name),
      newScore: { home: newPlay.homeScore, away: newPlay.awayScore },
    };
  }
  return null;
}
```

### NFL Score Detection

```typescript
function detectNFLScore(prev: GameState, curr: GameState): ScoringEvent | null {
  const homeScored = curr.homeScore > prev.homeScore;
  const awayScored = curr.awayScore > prev.awayScore;

  if (homeScored || awayScored) {
    const pointsScored = homeScored
      ? curr.homeScore - prev.homeScore
      : curr.awayScore - prev.awayScore;

    const scoreType = getScoreType(pointsScored);

    return {
      type: "score",
      team: homeScored ? curr.homeTeam.abbreviation : curr.awayTeam.abbreviation,
      scoreType,
      pointsScored,
      newScore: { home: curr.homeScore, away: curr.awayScore },
    };
  }
  return null;
}

function getScoreType(points: number): string {
  if (points === 6 || points === 7 || points === 8) return "TOUCHDOWN";
  if (points === 3) return "FIELD GOAL";
  if (points === 2) return "SAFETY";
  return "SCORE";
}
```

### Generic Event Detection

```typescript
async function detectEvents(
  previousState: CachedGameState,
  currentState: GameState
): Promise<NotificationEvent[]> {
  const events: NotificationEvent[] = [];

  // Game started
  if (previousState.status === "scheduled" && currentState.status === "live") {
    events.push({ type: "gameStart" });
  }

  // Game ended
  if (previousState.status === "live" && currentState.status === "final") {
    events.push({
      type: "gameEnd",
      finalScore: `${currentState.awayScore}-${currentState.homeScore}`
    });
  }

  // New scoring play
  if (currentState.homeScore + currentState.awayScore >
      previousState.homeScore + previousState.awayScore) {
    events.push({ type: "scoring", newScore: currentState });
  }

  // Period/Quarter ended
  if (currentState.period > previousState.period) {
    events.push({ type: "periodEnd", period: previousState.period });
  }

  return events;
}
```

---

## Frontend Components

### New Components Required

| Component | Type | Purpose |
|-----------|------|---------|
| `NotificationSubscriptionButton` | Client | Subscribe/unsubscribe toggle for games |
| `NotificationSettingsPanel` | Client | Global settings and subscription list |
| `NotificationPermissionPrompt` | Client | First-time permission request UI |

### Integration Points

- **GameCard**: Add notification bell icon/button
- **GameDetailDisplay**: Add prominent subscribe button in header

### Service Worker (`/public/sw.js`)

```javascript
// Handle incoming push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-badge.png',
    tag: data.gameId,  // Prevents duplicate notifications
    data: {
      url: `/${data.league}/game/${data.gameId}`,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click - open game page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

---

## Implementation Phases

### Phase 1: Foundation

**Goal:** Set up infrastructure and basic subscription flow

1. **Service Worker Setup**
   - Create `/public/sw.js` with push event handling
   - Register service worker in app layout
   - Handle notification clicks for deep linking

2. **VAPID Key Generation**
   - Generate VAPID keys for Web Push
   - Store private key in Vercel environment variables
   - Create endpoint to serve public key

3. **Basic Subscription UI**
   - Create `NotificationSubscriptionButton` component
   - Add to `GameCard` component
   - Implement permission request flow

4. **Local Storage Management**
   - Create notification preferences hook
   - Store subscription state locally

### Phase 2: Backend Service

**Goal:** Build notification delivery infrastructure

1. **Vercel KV Setup**
   - Configure Vercel KV for subscription storage
   - Create data models for subscriptions and game state

2. **API Routes**
   - `POST /api/notifications/subscribe`
   - `DELETE /api/notifications/unsubscribe`
   - `GET /api/notifications/subscriptions`

3. **Polling Service**
   - Create Vercel Cron job for game monitoring
   - Implement event detection logic
   - Integrate Web Push sending

4. **State Caching**
   - Cache game states in KV for comparison
   - Implement efficient polling (only active games)

### Phase 3: Event Detection & Notifications

**Goal:** Implement sport-specific event detection

1. **NHL Event Detection**
   - Goal detection from scoring plays
   - Period end detection
   - Game start/end detection

2. **NFL Event Detection**
   - Score change detection (TD, FG, Safety)
   - Quarter end detection
   - Game start/end detection

3. **Notification Formatting**
   - Create notification templates for each event type
   - Include team abbreviations
   - Add action buttons (view game, dismiss)

### Phase 4: Polish & UX

**Goal:** Refine user experience

1. **Settings Panel**
   - Create `NotificationSettingsPanel` component
   - Allow granular event preferences
   - Show active subscriptions list

2. **Subscription Management**
   - Auto-unsubscribe after game ends
   - Bulk subscription options (all games for a team)
   - Notification history

3. **Error Handling**
   - Handle push permission denial gracefully
   - Retry failed notifications
   - Clean up stale subscriptions

---

## Dependencies

### New npm Dependencies

```json
{
  "dependencies": {
    "@vercel/kv": "^1.0.0",
    "web-push": "^3.6.0"
  }
}
```

### Environment Variables

```bash
VAPID_PUBLIC_KEY=...           # For client subscription
VAPID_PRIVATE_KEY=...          # For server push sending
VAPID_SUBJECT=mailto:...       # Contact for push service
KV_REST_API_URL=...            # Vercel KV endpoint
KV_REST_API_TOKEN=...          # Vercel KV auth
```

---

## Trade-offs and Alternatives

### Key Trade-offs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Delivery method | Server-side push | Better UX, works in background |
| Storage | Vercel KV | Low-latency, Vercel-native, Redis-compatible |
| Polling interval | 30 seconds | Matches existing cache TTL; faster would strain API |
| Subscription scope | Per-game | Simpler than per-team; can extend later |

### Alternatives Considered

1. **Client-Only Polling**
   - Simpler but notifications only when tab is open
   - Could serve as MVP fallback

2. **Third-Party Push Service (OneSignal, Firebase)**
   - Faster implementation but adds vendor dependency
   - Overkill for this use case

3. **WebSocket Real-Time Updates**
   - True real-time but significant complexity
   - ESPN doesn't offer WebSocket API

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| ESPN API changes | Graceful degradation; disable if detection fails |
| Browser push support | Feature detection; fallback to in-app notifications |
| Rate limiting | Aggregate polling; respect 30s minimum |
| Stale subscriptions | Cleanup job; TTL on subscriptions |

---

## Critical Implementation Files

| File | Purpose |
|------|---------|
| `src/lib/api/espn.ts` | Core ESPN data fetching; expose scoring data for detection |
| `src/lib/api/espn-summary.ts` | ScoringPlay mapping pattern to follow |
| `src/components/scoreboards/GameCard.tsx` | Primary integration point for subscription button |
| `src/components/layout/ThemeProvider.tsx` | Pattern for preferences context and localStorage |
| `src/app/manifest.ts` | PWA manifest; add service worker registration |

---

## Documentation Requirements

### ADR Required

Create `docs/decisions/010-sports-notifications.md`:
- Document push vs pull decision
- Explain Vercel KV choice
- Detail event detection approach

### Updates Needed

- **CLAUDE.md**: Add notification component patterns, service worker integration
- **AGENTS.md**: Add to Historical Context Log, update Active Development Areas
