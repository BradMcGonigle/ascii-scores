import type { Game } from "@/lib/types";
import type {
  PlayoffBracket,
  PlayoffMatchup,
  BracketTeam,
} from "@/lib/types/playoffs";
import {
  NFL_PLAYOFF_ROUNDS,
  NFL_CONFERENCES,
} from "@/lib/types/playoffs";
import { type ESPNEvent, type ESPNSeason, mapEvent } from "./espn";

const ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports";

/**
 * Extended ESPN event with playoff-specific fields
 */
interface ESPNPlayoffEvent extends ESPNEvent {
  competitions: Array<
    ESPNEvent["competitions"][0] & {
      notes?: Array<{ headline: string }>;
    }
  >;
}

interface ESPNPlayoffResponse {
  events: ESPNPlayoffEvent[];
  season?: ESPNSeason;
  leagues?: Array<{
    calendar?: Array<{
      label: string;
      entries: Array<{
        label: string;
        detail: string;
        value: string;
        startDate: string;
        endDate: string;
      }>;
    }>;
  }>;
}

/**
 * Parsed playoff calendar entry with round date ranges
 */
interface PlayoffCalendarEntry {
  label: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Determine the NFL season year for playoff data.
 * NFL playoffs for the 2025 season happen in January/February 2026.
 */
function getDefaultNFLSeasonYear(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  // If January-July, the playoffs belong to the previous calendar year's season
  if (month <= 7) {
    return year - 1;
  }
  return year;
}

/**
 * Parse conference from ESPN competition notes headline.
 * Examples: "AFC Wild Card Playoffs", "NFC Divisional Playoffs", "Super Bowl LX"
 */
function parseConference(notes?: Array<{ headline: string }>): string | undefined {
  if (!notes || notes.length === 0) return undefined;

  const headline = notes[0].headline.toUpperCase();
  if (headline.includes("AFC")) return "AFC";
  if (headline.includes("NFC")) return "NFC";
  return undefined;
}

/**
 * Build a BracketTeam from a Game's team data
 */
function buildBracketTeam(
  game: Game,
  side: "home" | "away",
  seed?: number
): BracketTeam {
  const team = side === "home" ? game.homeTeam : game.awayTeam;
  const score = side === "home" ? game.homeScore : game.awayScore;
  const otherScore = side === "home" ? game.awayScore : game.homeScore;
  const isFinal = game.status === "final";

  return {
    abbreviation: team.abbreviation,
    displayName: team.displayName,
    seed,
    score: game.status !== "scheduled" ? score : undefined,
    isWinner: isFinal ? score > otherScore : undefined,
  };
}

/**
 * Format a Date as YYYYMMDD for ESPN API
 */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * Generate all dates between start and end (inclusive)
 */
function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Step 1: Discover the playoff calendar for a season.
 *
 * The ESPN scoreboard `year` param doesn't work for historical postseason data —
 * it always returns the current season. However, the `dates` param anchors
 * the response to the correct season and includes a calendar with exact
 * date ranges for each playoff round.
 *
 * We use January 15 of (seasonYear + 1) as the anchor date since it always
 * falls within the NFL playoff window.
 */
async function fetchPlayoffCalendar(
  seasonYear: number
): Promise<PlayoffCalendarEntry[]> {
  const anchorDate = `${seasonYear + 1}0115`;
  const url = `${ESPN_BASE_URL}/football/nfl/scoreboard?seasontype=3&dates=${anchorDate}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 }, // Calendar data is static — cache for 24 hours
  });

  if (!response.ok) {
    return [];
  }

  const data: ESPNPlayoffResponse = await response.json();

  // Extract the postseason calendar entries from the response
  const postseasonCalendar = data.leagues?.[0]?.calendar?.find(
    (cal) => cal.label.toLowerCase() === "postseason"
  );

  if (!postseasonCalendar?.entries) {
    return [];
  }

  return postseasonCalendar.entries.map((entry) => ({
    label: entry.label,
    startDate: new Date(entry.startDate),
    endDate: new Date(entry.endDate),
  }));
}

/**
 * Map calendar entry labels to our round IDs.
 * ESPN labels: "Wild Card", "Divisional Round", "Conference Championship",
 *              "Pro Bowl", "Pro Bowl Games", "Super Bowl"
 */
function mapCalendarLabelToRoundId(label: string): string | undefined {
  const lower = label.toLowerCase();
  if (lower.includes("wild card")) return "wild-card";
  if (lower.includes("divisional")) return "divisional";
  if (lower.includes("conference")) return "conference";
  if (lower.includes("super bowl")) return "super-bowl";
  // Skip Pro Bowl
  return undefined;
}

/**
 * Step 2: Fetch all games within a date range for a playoff round.
 * Fetches each date in the range in parallel and collects postseason games.
 */
async function fetchGamesForDateRange(
  startDate: Date,
  endDate: Date
): Promise<{ games: Game[]; events: ESPNPlayoffEvent[] }> {
  const dates = getDateRange(startDate, endDate);

  const results = await Promise.all(
    dates.map(async (date) => {
      const dateStr = formatDate(date);
      const url = `${ESPN_BASE_URL}/football/nfl/scoreboard?dates=${dateStr}`;

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 }, // 5 minute cache
      });

      if (!response.ok) {
        return { games: [] as Game[], events: [] as ESPNPlayoffEvent[] };
      }

      const data: ESPNPlayoffResponse = await response.json();

      // Filter to postseason events only
      const postseasonEvents = data.events.filter((event) => {
        const seasonType = event.season?.type ?? data.season?.type;
        return seasonType === 3;
      });

      const games = postseasonEvents.map((event) => {
        const eventWithSeason = {
          ...event,
          season: event.season ?? data.season,
        } as ESPNEvent;
        return mapEvent(eventWithSeason, "nfl");
      });

      return { games, events: postseasonEvents };
    })
  );

  // Combine results, deduplicating by game ID
  const seenIds = new Set<string>();
  const allGames: Game[] = [];
  const allEvents: ESPNPlayoffEvent[] = [];

  for (const result of results) {
    for (let i = 0; i < result.games.length; i++) {
      const game = result.games[i];
      if (!seenIds.has(game.id)) {
        seenIds.add(game.id);
        allGames.push(game);
        allEvents.push(result.events[i]);
      }
    }
  }

  return { games: allGames, events: allEvents };
}

/**
 * Assign seed numbers to Wild Card teams.
 * In the NFL, the higher seed always hosts in the playoffs.
 * Wild Card matchups are: 2v7, 3v6, 4v5.
 */
function assignWildCardSeeds(
  games: Game[],
  events: ESPNPlayoffEvent[],
  conference: string
): Map<string, number> {
  const seedMap = new Map<string, number>();

  const conferenceGames: Game[] = [];
  for (let i = 0; i < games.length; i++) {
    const eventConf = parseConference(events[i].competitions[0].notes);
    if (eventConf === conference) {
      conferenceGames.push(games[i]);
    }
  }

  // Sort by game date (ESPN typically returns them in seed order)
  conferenceGames.sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  // Wild Card seed pairs: home=higher seed, away=lower seed
  const seedPairs = [
    [2, 7],
    [3, 6],
    [4, 5],
  ];

  for (let i = 0; i < conferenceGames.length && i < seedPairs.length; i++) {
    const game = conferenceGames[i];
    seedMap.set(game.homeTeam.abbreviation, seedPairs[i][0]);
    seedMap.set(game.awayTeam.abbreviation, seedPairs[i][1]);
  }

  return seedMap;
}

/**
 * Fetch the complete NFL playoff bracket for a given season.
 *
 * Strategy:
 * 1. Discover the playoff calendar (round date ranges) via an anchor-date call
 * 2. Fetch all games within each round's date range in parallel
 * 3. Group games by round and conference using notes headlines
 * 4. Infer seeds from home/away positioning
 * 5. Build the bracket structure
 */
export async function getNFLPlayoffBracket(
  year?: number
): Promise<PlayoffBracket> {
  const seasonYear = year ?? getDefaultNFLSeasonYear();

  // Step 1: Discover the playoff calendar for this season
  const calendarEntries = await fetchPlayoffCalendar(seasonYear);

  // Step 2: Map calendar entries to our rounds and fetch games for each
  const roundData = new Map<
    string,
    { games: Game[]; events: ESPNPlayoffEvent[] }
  >();

  // Build fetch promises for each known round
  const fetchPromises: Array<{
    roundId: string;
    promise: Promise<{ games: Game[]; events: ESPNPlayoffEvent[] }>;
  }> = [];

  for (const entry of calendarEntries) {
    const roundId = mapCalendarLabelToRoundId(entry.label);
    if (!roundId) continue; // Skip Pro Bowl etc.

    fetchPromises.push({
      roundId,
      promise: fetchGamesForDateRange(entry.startDate, entry.endDate),
    });
  }

  // Fetch all rounds in parallel
  const fetchResults = await Promise.all(
    fetchPromises.map((fp) => fp.promise)
  );

  for (let i = 0; i < fetchPromises.length; i++) {
    roundData.set(fetchPromises[i].roundId, fetchResults[i]);
  }

  // Step 3: Build seed maps from Wild Card round
  const wcData = roundData.get("wild-card") ?? { games: [], events: [] };
  const divData = roundData.get("divisional") ?? { games: [], events: [] };
  const confData = roundData.get("conference") ?? { games: [], events: [] };

  const seedMaps = new Map<string, Map<string, number>>();

  for (const conf of NFL_CONFERENCES) {
    const confSeeds = assignWildCardSeeds(
      wcData.games,
      wcData.events,
      conf
    );
    seedMaps.set(conf, confSeeds);
  }

  // Identify #1 seeds from Divisional round (home teams not in Wild Card)
  for (const conf of NFL_CONFERENCES) {
    const confSeeds = seedMaps.get(conf)!;
    for (let i = 0; i < divData.games.length; i++) {
      const eventConf = parseConference(
        divData.events[i].competitions[0].notes
      );
      if (eventConf !== conf) continue;

      const game = divData.games[i];
      if (!confSeeds.has(game.homeTeam.abbreviation)) {
        confSeeds.set(game.homeTeam.abbreviation, 1);
      }
    }
  }

  // Carry seeds forward to conference championship
  for (let i = 0; i < confData.games.length; i++) {
    const eventConf = parseConference(
      confData.events[i].competitions[0].notes
    );
    if (!eventConf) continue;
    const confSeeds = seedMaps.get(eventConf);
    if (!confSeeds) continue;
    const game = confData.games[i];
    if (!confSeeds.has(game.homeTeam.abbreviation)) {
      confSeeds.set(game.homeTeam.abbreviation, 1);
    }
  }

  // Step 4: Build matchups for each round
  const matchups: PlayoffMatchup[] = [];

  for (const round of NFL_PLAYOFF_ROUNDS) {
    const data = roundData.get(round.id);
    if (!data) continue;

    const { games, events } = data;

    if (round.id === "super-bowl") {
      if (games.length > 0) {
        const game = games[0];
        let homeSeed: number | undefined;
        let awaySeed: number | undefined;
        for (const [, confSeeds] of seedMaps) {
          if (confSeeds.has(game.homeTeam.abbreviation)) {
            homeSeed = confSeeds.get(game.homeTeam.abbreviation);
          }
          if (confSeeds.has(game.awayTeam.abbreviation)) {
            awaySeed = confSeeds.get(game.awayTeam.abbreviation);
          }
        }

        matchups.push({
          id: "super-bowl",
          round: round.id,
          conference: undefined,
          position: 0,
          game,
          topTeam: buildBracketTeam(game, "home", homeSeed),
          bottomTeam: buildBracketTeam(game, "away", awaySeed),
          isBye: false,
        });
      }
      continue;
    }

    // Group games by conference
    for (const conf of NFL_CONFERENCES) {
      const confGamesInRound: Array<{
        game: Game;
        event: ESPNPlayoffEvent;
      }> = [];

      for (let i = 0; i < games.length; i++) {
        const eventConf = parseConference(events[i].competitions[0].notes);
        if (eventConf === conf) {
          confGamesInRound.push({ game: games[i], event: events[i] });
        }
      }

      confGamesInRound.sort(
        (a, b) => a.game.startTime.getTime() - b.game.startTime.getTime()
      );

      const confSeeds =
        seedMaps.get(conf) ?? new Map<string, number>();

      for (let pos = 0; pos < confGamesInRound.length; pos++) {
        const { game } = confGamesInRound[pos];
        const homeSeed = confSeeds.get(game.homeTeam.abbreviation);
        const awaySeed = confSeeds.get(game.awayTeam.abbreviation);

        matchups.push({
          id: `${conf.toLowerCase()}-${round.id}-${pos + 1}`,
          round: round.id,
          conference: conf,
          position: pos,
          game,
          topTeam: buildBracketTeam(game, "home", homeSeed),
          bottomTeam: buildBracketTeam(game, "away", awaySeed),
          isBye: false,
        });
      }

      // Add bye matchup for #1 seed in Wild Card round
      if (round.id === "wild-card") {
        const byeTeamAbbr = [...confSeeds.entries()].find(
          ([, seed]) => seed === 1
        )?.[0];

        if (byeTeamAbbr) {
          let byeDisplayName = byeTeamAbbr;
          for (const g of divData.games) {
            if (g.homeTeam.abbreviation === byeTeamAbbr) {
              byeDisplayName = g.homeTeam.displayName;
              break;
            }
            if (g.awayTeam.abbreviation === byeTeamAbbr) {
              byeDisplayName = g.awayTeam.displayName;
              break;
            }
          }

          matchups.push({
            id: `${conf.toLowerCase()}-bye`,
            round: round.id,
            conference: conf,
            position: confGamesInRound.length,
            game: null,
            topTeam: {
              abbreviation: byeTeamAbbr,
              displayName: byeDisplayName,
              seed: 1,
            },
            isBye: true,
          });
        }
      }
    }
  }

  return {
    league: "nfl",
    seasonYear,
    displayLabel: `${seasonYear}-${String(seasonYear + 1).slice(2)} NFL Playoffs`,
    conferences: [...NFL_CONFERENCES],
    rounds: NFL_PLAYOFF_ROUNDS,
    matchups,
    lastUpdated: new Date(),
  };
}
