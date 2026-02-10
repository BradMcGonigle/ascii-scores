import { notFound } from "next/navigation";
import Link from "next/link";
import { RefreshButton } from "@/components/scoreboards/RefreshButton";
import { PlayoffBracketDisplay } from "@/components/scoreboards/PlayoffBracket";
import { PlayoffYearSelector } from "@/components/scoreboards/PlayoffYearSelector";
import { getNFLPlayoffBracket } from "@/lib/api/espn-playoffs";
import { LEAGUES, type League } from "@/lib/types";

interface PlayoffsPageProps {
  params: Promise<{ league: string }>;
  searchParams: Promise<{ year?: string }>;
}

// Leagues that support playoff bracket pages
const PLAYOFF_LEAGUES = ["nfl"];

// Generate static params for leagues with playoffs
export function generateStaticParams() {
  return PLAYOFF_LEAGUES.map((league) => ({ league }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ascii-scores.vercel.app";

// Generate metadata for each playoffs page
export async function generateMetadata({ params }: PlayoffsPageProps) {
  const { league: leagueId } = await params;
  const league = LEAGUES[leagueId as League];

  if (!league || !PLAYOFF_LEAGUES.includes(leagueId)) {
    return { title: "Playoffs Not Found" };
  }

  const title = `${league.name} Playoffs`;
  const description = `${league.fullName} playoff bracket rendered in ASCII art style. View tournament results with a retro terminal aesthetic.`;
  const url = `${SITE_URL}/${leagueId}/playoffs`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${league.name} Playoffs | ASCII Scores`,
      description,
      url,
      siteName: "ASCII Scores",
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${league.fullName} Playoff Bracket - ASCII Scores`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${league.name} Playoffs | ASCII Scores`,
      description,
      images: ["/og-image.png"],
    },
  };
}

/**
 * Determine the default season year for display.
 * NFL playoffs for the 2025 season happen in Jan/Feb 2026.
 */
function getDefaultSeasonYear(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month <= 7 ? now.getFullYear() - 1 : now.getFullYear();
}

export default async function PlayoffsPage({
  params,
  searchParams,
}: PlayoffsPageProps) {
  const { league: leagueId } = await params;
  const { year: yearParam } = await searchParams;

  // Validate league supports playoffs
  if (
    !Object.keys(LEAGUES).includes(leagueId) ||
    !PLAYOFF_LEAGUES.includes(leagueId)
  ) {
    notFound();
  }

  const league = LEAGUES[leagueId as League];

  // Parse and validate year parameter
  const defaultYear = getDefaultSeasonYear();
  let seasonYear = defaultYear;

  if (yearParam) {
    const parsed = parseInt(yearParam, 10);
    // NFL expanded to 14 teams in 2020; limit to reasonable range
    if (!isNaN(parsed) && parsed >= 2020 && parsed <= defaultYear) {
      seasonYear = parsed;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-mono text-2xl text-terminal-fg">
            <span className="text-terminal-border">[</span>
            {league.name}
            <span className="text-terminal-border">]</span>
            {" "}
            <span className="text-terminal-muted">Playoffs</span>
          </h1>
          <p className="text-terminal-muted font-mono text-sm mt-1">
            {league.fullName} Playoff Bracket
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

      {/* Year selector */}
      <PlayoffYearSelector league={leagueId} currentYear={seasonYear} />

      {/* Bracket content */}
      <PlayoffBracketContent year={seasonYear} />
    </div>
  );
}

/**
 * Server component for fetching and displaying bracket data
 */
async function PlayoffBracketContent({ year }: { year: number }) {
  try {
    const bracket = await getNFLPlayoffBracket(year);
    return <PlayoffBracketDisplay bracket={bracket} />;
  } catch (error) {
    console.error(`Failed to fetch NFL playoff bracket:`, error);
    return (
      <div className="overflow-x-auto">
        <div className="font-mono text-center py-8 text-terminal-red inline-block min-w-full">
          <div className="text-terminal-border" aria-hidden="true">
            ╔══════════════════════════════════════════╗
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">║</span>
            <span className="px-4">
              {"  "}Error loading playoff data. Try again.{"  "}
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
