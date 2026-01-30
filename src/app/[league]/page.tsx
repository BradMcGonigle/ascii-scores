import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LeagueScoreboard } from "@/components/scoreboards/LeagueScoreboard";
import { F1StandingsDisplay } from "@/components/scoreboards/F1Standings";
import { GolfLeaderboardClient } from "@/components/scoreboards/GolfLeaderboardClient";
import { RefreshButton } from "@/components/scoreboards/RefreshButton";
import { DateNavigation } from "@/components/scoreboards/DateNavigation";
import { LeagueJsonLd } from "@/components/seo";
import { getESPNScoreboard, getDatesWithGames } from "@/lib/api/espn";
import { getF1Standings } from "@/lib/api/openf1";
import { getPGALeaderboard } from "@/lib/api/pga";
import { LEAGUES, type League } from "@/lib/types";
import { addDays, parseDateFromAPI } from "@/lib/utils/format";

const MAX_DAYS_PAST = 5;
const MAX_DAYS_FUTURE = 5;

interface LeaguePageProps {
  params: Promise<{ league: string }>;
  searchParams: Promise<{ date?: string }>;
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
 */
function validateDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;

  const parsed = parseDateFromAPI(dateStr);
  if (!parsed) return null;

  // Check if date is within allowed range
  const today = new Date();
  const minDate = addDays(today, -MAX_DAYS_PAST);
  const maxDate = addDays(today, MAX_DAYS_FUTURE);

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
  const { date: dateParam } = await searchParams;

  // Validate league
  if (!Object.keys(LEAGUES).includes(leagueId)) {
    notFound();
  }

  const league = LEAGUES[leagueId as League];

  // Parse and validate date parameter
  const selectedDate = validateDate(dateParam);

  // For ESPN leagues, determine if we should show date navigation
  // F1 and PGA don't use the standard date-based scoreboard navigation
  const isESPNLeague = leagueId !== "f1" && leagueId !== "pga";

  return (
    <>
      <LeagueJsonLd
        leagueName={`${league.name} Scores`}
        leagueUrl={`${SITE_URL}/${leagueId}`}
      />
      <Header activeLeague={leagueId} />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-mono text-2xl text-terminal-fg">
                <span className="text-terminal-border">[</span>
                {league.name}
                <span className="text-terminal-border">]</span>
                {" "}
                <span className="text-terminal-muted">Scores</span>
              </h1>
              <p className="text-terminal-muted font-mono text-sm mt-1">
                {league.fullName}
              </p>
            </div>
            <RefreshButton />
          </div>

          {/* Date navigation for ESPN leagues */}
          {isESPNLeague && (
            <div className="mb-8">
              <Suspense fallback={<DateNavigationSkeleton />}>
                <DateNavigationWrapper league={leagueId as Exclude<League, "f1" | "pga">} />
              </Suspense>
            </div>
          )}

          {/* Scoreboard content */}
          {leagueId === "f1" ? (
            <F1Content />
          ) : leagueId === "pga" ? (
            <PGAContent />
          ) : (
            <ESPNContent
              league={leagueId as Exclude<League, "f1" | "pga">}
              date={selectedDate ?? undefined}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

/**
 * Server component wrapper that fetches dates with games
 */
async function DateNavigationWrapper({
  league,
}: {
  league: Exclude<League, "f1" | "pga">;
}) {
  const datesWithGames = await getDatesWithGames(league, MAX_DAYS_PAST, MAX_DAYS_FUTURE);
  return <DateNavigation league={league} datesWithGames={datesWithGames} />;
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
    const scoreboard = await getESPNScoreboard(league, date);
    return <LeagueScoreboard scoreboard={scoreboard} />;
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
 */
async function F1Content() {
  try {
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
async function PGAContent() {
  try {
    const leaderboard = await getPGALeaderboard();

    return <GolfLeaderboardClient leaderboard={leaderboard} />;
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
