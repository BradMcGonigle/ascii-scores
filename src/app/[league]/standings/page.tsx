import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RefreshButton } from "@/components/scoreboards/RefreshButton";
import { StandingsViewToggle } from "@/components/scoreboards/StandingsViewToggle";
import { Top25Rankings } from "@/components/scoreboards/Top25Rankings";
import { getESPNStandings, getNCAAPolls } from "@/lib/api/espn";
import { LEAGUES, type League } from "@/lib/types";

interface StandingsPageProps {
  params: Promise<{ league: string }>;
}

// Leagues that support standings (ESPN leagues only, no F1 or PGA)
const STANDINGS_LEAGUES = ["nhl", "nfl", "nba", "mlb", "mls", "epl", "ncaam", "ncaaw"];

// Generate static params for leagues with standings
export function generateStaticParams() {
  return STANDINGS_LEAGUES.map((league) => ({ league }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ascii-scores.vercel.app";

// Generate metadata for each standings page
export async function generateMetadata({ params }: StandingsPageProps) {
  const { league: leagueId } = await params;
  const league = LEAGUES[leagueId as League];

  if (!league || !STANDINGS_LEAGUES.includes(leagueId)) {
    return { title: "Standings Not Found" };
  }

  const title = `${league.name} Standings`;
  const description = `Current ${league.fullName} standings rendered in ASCII art style. Division and conference rankings with a retro terminal aesthetic.`;
  const url = `${SITE_URL}/${leagueId}/standings`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${league.name} Standings | ASCII Scores`,
      description,
      url,
      siteName: "ASCII Scores",
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${league.fullName} Standings - ASCII Scores`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${league.name} Standings | ASCII Scores`,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function StandingsPage({ params }: StandingsPageProps) {
  const { league: leagueId } = await params;

  // Validate league and check if it supports standings
  if (!Object.keys(LEAGUES).includes(leagueId) || !STANDINGS_LEAGUES.includes(leagueId)) {
    notFound();
  }

  const league = LEAGUES[leagueId as League];

  return (
    <>
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
                <span className="text-terminal-muted">Standings</span>
              </h1>
              <p className="text-terminal-muted font-mono text-sm mt-1">
                {league.fullName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/${leagueId}`}
                className="font-mono text-sm text-terminal-muted hover:text-terminal-green transition-colors"
              >
                <span className="text-terminal-green">{"<"}</span>
                {" "}Back to Scores
              </Link>
              <RefreshButton />
            </div>
          </div>

          {/* Standings content */}
          <StandingsContent league={leagueId as Exclude<League, "f1" | "pga">} />
        </div>
      </main>
      <Footer />
    </>
  );
}

/**
 * Standings content with data fetching
 */
async function StandingsContent({
  league,
}: {
  league: Exclude<League, "f1" | "pga">;
}) {
  const isNCAA = league === "ncaam" || league === "ncaaw";

  try {
    // Fetch standings and rankings in parallel for NCAA
    const [standings, polls] = await Promise.all([
      getESPNStandings(league),
      isNCAA ? getNCAAPolls(league) : Promise.resolve(null),
    ]);

    return (
      <>
        {polls && <Top25Rankings polls={polls} />}
        <StandingsViewToggle standings={standings} />
      </>
    );
  } catch (error) {
    console.error(`Failed to fetch ${league} standings:`, error);
    return (
      <div className="font-mono text-center py-8 text-terminal-red">
        <div className="text-terminal-border" aria-hidden="true">
          ╔══════════════════════════════════════════╗
        </div>
        <div>
          <span className="text-terminal-border" aria-hidden="true">║</span>
          <span className="px-4">
            {"  "}Error loading standings. Try again.{"  "}
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
