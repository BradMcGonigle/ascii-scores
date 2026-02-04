import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { LeagueScoreboard } from "@/components/scoreboards/LeagueScoreboard";
import { F1StandingsDisplay } from "@/components/scoreboards/F1Standings";
import { F1SessionsList } from "@/components/scoreboards/F1SessionsList";
import { GolfLeaderboardDisplay } from "@/components/scoreboards/GolfLeaderboard";
import { RefreshButton } from "@/components/scoreboards/RefreshButton";
import { DateNavigation } from "@/components/scoreboards/DateNavigation";
import { F1RaceWeekendNav } from "@/components/scoreboards/F1RaceWeekendNav";
import { LeagueJsonLd } from "@/components/seo";
import { getESPNScoreboard, getDatesWithGames, getTodayForLeague } from "@/lib/api/espn";
import { getF1Standings, getF1RaceWeekends, getF1RaceWeekendSessions } from "@/lib/api/openf1";
import { getPGALeaderboard, getPGATournamentCalendar } from "@/lib/api/pga";
import { PGATournamentNav } from "@/components/scoreboards/PGATournamentNav";
import { LEAGUES, isLeagueInSeason, getSeasonStartDate, type League } from "@/lib/types";
import { addDays, formatDateForAPI, getRelativeDateLabel, parseDateFromAPI } from "@/lib/utils/format";

// Leagues that have standings pages
const STANDINGS_LEAGUES = ["nhl", "nfl", "nba", "mlb", "mls", "epl", "ncaam", "ncaaw"];

// How far users can navigate via URL (validates date param)
const MAX_DAYS = 365;

// How many dates to check for navigation hints (PREV/NEXT buttons)
// Kept smaller to limit API calls - users navigate in "hops"
const NAV_WINDOW = 30;

interface LeaguePageProps {
  params: Promise<{ league: string }>;
  searchParams: Promise<{ date?: string; weekend?: string; event?: string }>;
}

// Generate static params for all leagues
export function generateStaticParams() {
  return Object.keys(LEAGUES).map((league) => ({ league }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ascii-scores.vercel.app";

// Generate metadata for each league page
export async function generateMetadata({ params }: LeaguePageProps) {
  const { league: leagueId } = await params;
  const league = LEAGUES[leagueId as League];

  if (!league) {
    return { title: "League Not Found" };
  }

  const title = `${league.name} Scores`;
  const description = `Live ${league.fullName} scores and standings rendered in ASCII art style. Real-time updates with a retro terminal aesthetic.`;
  const url = `${SITE_URL}/${leagueId}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${league.name} Scores | ASCII Scores`,
      description,
      url,
      siteName: "ASCII Scores",
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${league.fullName} Live Scores - ASCII Scores`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${league.name} Scores | ASCII Scores`,
      description,
      images: ["/og-image.png"],
    },
  };
}

/**
 * Validate and parse the date parameter
 * Returns the validated date or null if invalid/out of range
 * Uses league-appropriate timezone to ensure consistent date handling
 */
function validateDate(
  dateStr: string | undefined,
  league: Exclude<League, "f1" | "pga">,
  daysBack: number = MAX_DAYS,
  daysForward: number = MAX_DAYS
): Date | null {
  if (!dateStr) return null;

  const parsed = parseDateFromAPI(dateStr);
  if (!parsed) return null;

  // Check if date is within allowed range
  // Use league-appropriate timezone for "today" to match client expectations
  const today = getTodayForLeague(league);
  const minDate = addDays(today, -daysBack);
  const maxDate = addDays(today, daysForward);

  // Reset time components for comparison
  const normalizedParsed = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const normalizedMin = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  const normalizedMax = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());

  if (normalizedParsed < normalizedMin || normalizedParsed > normalizedMax) {
    return null;
  }

  return parsed;
}

export default async function LeaguePage({ params, searchParams }: LeaguePageProps) {
  const { league: leagueId } = await params;
  const { date: dateParam, weekend: weekendParam, event: eventParam } = await searchParams;

  // Validate league
  if (!Object.keys(LEAGUES).includes(leagueId)) {
    notFound();
  }

  const league = LEAGUES[leagueId as League];
  const isOffSeason = !isLeagueInSeason(league);

  // Parse and validate date parameter (for ESPN leagues only)
  const isF1 = leagueId === "f1";
  const isPGA = leagueId === "pga";
  const isESPNLeague = !isF1 && !isPGA;
  const selectedDate = isESPNLeague
    ? validateDate(dateParam, leagueId as Exclude<League, "f1" | "pga">)
    : null;

  // Determine if we should show navigation
  // All leagues have navigation, but PGA uses tournament nav instead of date nav
  const showNavigation = true;

  return (
    <>
      <LeagueJsonLd
        leagueName={`${league.name} Scores`}
        leagueUrl={`${SITE_URL}/${leagueId}`}
      />
      <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-mono text-2xl text-terminal-fg">
                <span className="text-terminal-border">[</span>
                {league.name}
                <span className="text-terminal-border">]</span>
                {" "}
                <span className="text-terminal-muted">
                  {leagueId === "pga" ? "Leaderboard" : "Scores"}
                </span>
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-terminal-muted font-mono text-sm">
                  {league.fullName}
                </p>
                {STANDINGS_LEAGUES.includes(leagueId) && (
                  <Link
                    href={`/${leagueId}/standings`}
                    className="font-mono text-xs text-terminal-cyan hover:text-terminal-green transition-colors"
                  >
                    [Standings]
                  </Link>
                )}
              </div>
              {isOffSeason && (
                <p className="font-mono text-xs text-terminal-yellow mt-2">
                  <span className="text-terminal-border">[</span>
                  <span className="mx-1">⏱ Season starts {getSeasonStartDate(league)}</span>
                  <span className="text-terminal-border">]</span>
                </p>
              )}
            </div>
            <RefreshButton />
          </div>

          {/* Navigation */}
          {showNavigation && (
            <div className="mb-8">
              <Suspense fallback={<DateNavigationSkeleton />}>
                {isF1 ? (
                  <F1RaceWeekendNavWrapper />
                ) : leagueId === "pga" ? (
                  <PGATournamentNavWrapper />
                ) : (
                  <DateNavigationWrapper
                    league={leagueId as Exclude<League, "f1" | "pga">}
                    currentDate={selectedDate ?? undefined}
                  />
                )}
              </Suspense>
            </div>
          )}

          {/* Scoreboard content */}
          {leagueId === "f1" ? (
            <F1Content weekendId={weekendParam} />
          ) : leagueId === "pga" ? (
            <PGAContent eventId={eventParam} />
          ) : (
            <ESPNContent
              league={leagueId as Exclude<League, "f1" | "pga">}
              date={selectedDate ?? undefined}
            />
          )}
      </div>
    </>
  );
}

/**
 * Server component wrapper that fetches dates with games (ESPN leagues)
 * Fetches NAV_WINDOW days in each direction from the current view.
 * Users navigate in "hops" - each page load checks ±30 days, allowing
 * them to eventually reach any date within MAX_DAYS (365).
 */
async function DateNavigationWrapper({
  league,
  currentDate,
}: {
  league: Exclude<League, "f1" | "pga">;
  currentDate?: Date;
}) {
  const datesWithGames = await getDatesWithGames(
    league,
    NAV_WINDOW,
    NAV_WINDOW,
    currentDate
  );
  return <DateNavigation league={league} datesWithGames={datesWithGames} />;
}

/**
 * Server component wrapper that fetches F1 race weekends
 */
async function F1RaceWeekendNavWrapper() {
  const weekends = await getF1RaceWeekends();
  return <F1RaceWeekendNav weekends={weekends} />;
}

/**
 * Server component wrapper that fetches PGA tournament calendar
 */
async function PGATournamentNavWrapper() {
  const calendar = await getPGATournamentCalendar();
  return <PGATournamentNav tournaments={calendar.tournaments} />;
}

/**
 * Loading skeleton for date navigation
 */
function DateNavigationSkeleton() {
  return (
    <div className="font-mono text-sm">
      <div className="flex items-center justify-center gap-2">
        <div className="px-3 py-1 border border-terminal-muted text-terminal-muted">
          ◄ PREV
        </div>
        <div className="px-4 py-1 min-w-[160px] text-center">
          <span className="text-terminal-border">[</span>
          <span className="mx-2 text-terminal-muted">Loading...</span>
          <span className="text-terminal-border">]</span>
        </div>
        <div className="px-3 py-1 border border-terminal-muted text-terminal-muted">
          NEXT ►
        </div>
      </div>
    </div>
  );
}

/**
 * ESPN-based scoreboard content
 */
async function ESPNContent({
  league,
  date,
}: {
  league: Exclude<League, "f1" | "pga">;
  date?: Date;
}) {
  try {
    // Fetch scoreboard and dates with games in parallel
    const [scoreboard, datesWithGames] = await Promise.all([
      getESPNScoreboard(league, date),
      getDatesWithGames(league, 0, NAV_WINDOW), // Only need future dates for "next game" hint
    ]);

    // Find next date with games (after today)
    // Use league-appropriate timezone to ensure consistency with getDatesWithGames
    const todayStr = formatDateForAPI(getTodayForLeague(league));
    const sortedDates = [...datesWithGames].sort((a, b) => a.localeCompare(b));
    const nextDateStr = sortedDates.find((d) => d > todayStr);
    const nextGameDateLabel = nextDateStr
      ? getRelativeDateLabel(parseDateFromAPI(nextDateStr)!)
      : undefined;

    return <LeagueScoreboard scoreboard={scoreboard} nextGameDateLabel={nextGameDateLabel} />;
  } catch (error) {
    console.error(`Failed to fetch ${league} scoreboard:`, error);
    return (
      <div className="overflow-x-auto">
        <div className="font-mono text-center py-8 text-terminal-red inline-block min-w-full">
          <div className="text-terminal-border" aria-hidden="true">
            ╔══════════════════════════════════════════╗
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">║</span>
            <span className="px-4">
              {"  "}Error loading scoreboard. Try again.{"  "}
            </span>
            <span className="text-terminal-border" aria-hidden="true">║</span>
          </div>
          <div className="text-terminal-border" aria-hidden="true">
            ╚══════════════════════════════════════════╝
          </div>
        </div>
      </div>
    );
  }
}

/**
 * F1 standings content
 * When a specific race weekend ID is provided, shows all sessions for that weekend
 * Otherwise shows the most recent session (live or completed)
 */
async function F1Content({ weekendId }: { weekendId?: string }) {
  try {
    // If a specific weekend ID is provided, show all sessions for that weekend
    if (weekendId) {
      const sessions = await getF1RaceWeekendSessions(weekendId);
      return (
        <F1SessionsList
          sessions={sessions}
          lastUpdated={new Date()}
        />
      );
    }

    // Default: show the most recent/live session
    const standings = await getF1Standings();

    if (!standings) {
      return (
        <div className="overflow-x-auto">
          <div className="font-mono text-center py-8 inline-block min-w-full">
            <div className="text-terminal-border" aria-hidden="true">
              ╔═══════════════════════════════════════════════╗
            </div>
            <div>
              <span className="text-terminal-border" aria-hidden="true">║</span>
              <span className="text-terminal-muted px-4">
                {"  "}No active F1 session at this time{"  "}
              </span>
              <span className="text-terminal-border" aria-hidden="true">║</span>
            </div>
            <div className="text-terminal-border" aria-hidden="true">
              ╚═══════════════════════════════════════════════╝
            </div>
          </div>
        </div>
      );
    }

    return <F1StandingsDisplay standings={standings} />;
  } catch (error) {
    console.error("Failed to fetch F1 standings:", error);
    return (
      <div className="overflow-x-auto">
        <div className="font-mono text-center py-8 text-terminal-red inline-block min-w-full">
          <div className="text-terminal-border" aria-hidden="true">
            ╔══════════════════════════════════════════╗
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">║</span>
            <span className="px-4">
              {"  "}Error loading F1 data. Try again.{"  "}
            </span>
            <span className="text-terminal-border" aria-hidden="true">║</span>
          </div>
          <div className="text-terminal-border" aria-hidden="true">
            ╚══════════════════════════════════════════╝
          </div>
        </div>
      </div>
    );
  }
}

/**
 * PGA Tour leaderboard content
 */
async function PGAContent({ eventId }: { eventId?: string }) {
  try {
    const leaderboard = await getPGALeaderboard(eventId);

    return <GolfLeaderboardDisplay leaderboard={leaderboard} />;
  } catch (error) {
    console.error("Failed to fetch PGA leaderboard:", error);
    return (
      <div className="overflow-x-auto">
        <div className="font-mono text-center py-8 text-terminal-red inline-block min-w-full">
          <div className="text-terminal-border" aria-hidden="true">
            ╔═══════════════════════════════════════════════╗
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">║</span>
            <span className="px-4">
              {"  "}Error loading PGA data. Try again.{"  "}
            </span>
            <span className="text-terminal-border" aria-hidden="true">║</span>
          </div>
          <div className="text-terminal-border" aria-hidden="true">
            ╚═══════════════════════════════════════════════╝
          </div>
        </div>
      </div>
    );
  }
}
