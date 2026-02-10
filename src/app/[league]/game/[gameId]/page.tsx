import { notFound } from "next/navigation";
import Link from "next/link";
import { GameDetailDisplay } from "@/components/scoreboards/GameDetail";
import { RefreshButton } from "@/components/scoreboards/RefreshButton";
import { getGameSummary } from "@/lib/api/espn-summary";
import { LEAGUES, type League } from "@/lib/types";

interface GamePageProps {
  params: Promise<{ league: string; gameId: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ascii-scores.vercel.app";

// Only ESPN-based leagues support game details
const SUPPORTED_LEAGUES = ["nhl", "nfl", "nba", "mlb", "mls", "epl", "fa-cup", "ncaam", "ncaaw"];

// Dynamic revalidation: 30s for live games, effectively infinite for final games
// This will be used by Next.js for ISR caching
export const revalidate = 30;

export async function generateMetadata({ params }: GamePageProps) {
  const { league: leagueId, gameId } = await params;
  const league = LEAGUES[leagueId as League];

  if (!league || !SUPPORTED_LEAGUES.includes(leagueId)) {
    return { title: "Game Not Found" };
  }

  // Fetch game data for dynamic metadata
  const summary = await getGameSummary(leagueId as Exclude<League, "f1" | "pga">, gameId);

  if (!summary) {
    return { title: `${league.name} Game | ASCII Scores` };
  }

  const { game } = summary;
  const title = `${game.awayTeam.abbreviation} vs ${game.homeTeam.abbreviation} - ${league.name}`;
  const description = `${game.awayTeam.displayName} at ${game.homeTeam.displayName}. ${game.awayScore}-${game.homeScore}. Full boxscore and stats in ASCII art style.`;
  const url = `${SITE_URL}/${leagueId}/game/${gameId}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ASCII Scores`,
      description,
      url,
      siteName: "ASCII Scores",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ASCII Scores`,
      description,
    },
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { league: leagueId, gameId } = await params;

  // Validate league
  if (!SUPPORTED_LEAGUES.includes(leagueId)) {
    notFound();
  }

  const league = LEAGUES[leagueId as League];
  if (!league) {
    notFound();
  }

  // Fetch game summary
  const summary = await getGameSummary(leagueId as Exclude<League, "f1" | "pga">, gameId);

  if (!summary) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/${leagueId}`}
            className="font-mono text-sm text-terminal-muted hover:text-terminal-green transition-colors"
          >
            ◄ Back to {league.name} Scores
          </Link>
        </div>
        <div className="overflow-x-auto">
          <div className="font-mono text-center py-8 text-terminal-red inline-block min-w-full">
            <div className="text-terminal-border" aria-hidden="true">
              ╔══════════════════════════════════════════╗
            </div>
            <div>
              <span className="text-terminal-border" aria-hidden="true">║</span>
              <span className="px-4">
                {"  "}Game not found or unavailable.{"  "}
              </span>
              <span className="text-terminal-border" aria-hidden="true">║</span>
            </div>
            <div className="text-terminal-border" aria-hidden="true">
              ╚══════════════════════════════════════════╝
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { game } = summary;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Back link */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href={`/${leagueId}`}
          className="font-mono text-sm text-terminal-muted hover:text-terminal-green transition-colors"
        >
          ◄ Back to {league.name} Scores
        </Link>
        <RefreshButton />
      </div>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-mono text-2xl text-terminal-fg">
          <span className="text-terminal-border">[</span>
          {game.awayTeam.abbreviation}
          <span className="text-terminal-muted"> @ </span>
          {game.homeTeam.abbreviation}
          <span className="text-terminal-border">]</span>
        </h1>
        <p className="text-terminal-muted font-mono text-sm mt-1">
          {game.awayTeam.displayName} at {game.homeTeam.displayName}
        </p>
      </div>

      {/* Game detail content */}
      <GameDetailDisplay summary={summary} />
    </div>
  );
}
