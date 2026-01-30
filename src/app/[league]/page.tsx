import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LeagueScoreboard } from "@/components/scoreboards/LeagueScoreboard";
import { F1StandingsDisplay } from "@/components/scoreboards/F1Standings";
import { RefreshButton } from "@/components/scoreboards/RefreshButton";
import { getESPNScoreboard } from "@/lib/api/espn";
import { getF1Standings } from "@/lib/api/openf1";
import { LEAGUES, type League } from "@/lib/types";

interface LeaguePageProps {
  params: Promise<{ league: string }>;
}

// Generate static params for all leagues
export function generateStaticParams() {
  return Object.keys(LEAGUES).map((league) => ({ league }));
}

// Generate metadata for each league page
export async function generateMetadata({ params }: LeaguePageProps) {
  const { league: leagueId } = await params;
  const league = LEAGUES[leagueId as League];

  if (!league) {
    return { title: "League Not Found - ASCII Scores" };
  }

  return {
    title: `${league.name} Scores - ASCII Scores`,
    description: `Live ${league.fullName} scores rendered in ASCII art style`,
  };
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const { league: leagueId } = await params;

  // Validate league
  if (!Object.keys(LEAGUES).includes(leagueId)) {
    notFound();
  }

  const league = LEAGUES[leagueId as League];

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
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

          {/* Scoreboard content */}
          {leagueId === "f1" ? (
            <F1Content />
          ) : (
            <ESPNContent league={leagueId as Exclude<League, "f1">} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

/**
 * ESPN-based scoreboard content
 */
async function ESPNContent({ league }: { league: Exclude<League, "f1"> }) {
  try {
    const scoreboard = await getESPNScoreboard(league);
    return <LeagueScoreboard scoreboard={scoreboard} />;
  } catch (error) {
    console.error(`Failed to fetch ${league} scoreboard:`, error);
    return (
      <div className="font-mono text-center py-8 text-terminal-red">
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
        <div className="font-mono text-center py-8">
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
      );
    }

    return <F1StandingsDisplay standings={standings} />;
  } catch (error) {
    console.error("Failed to fetch F1 standings:", error);
    return (
      <div className="font-mono text-center py-8 text-terminal-red">
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
    );
  }
}
