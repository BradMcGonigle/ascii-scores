import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AsciiLogo, AsciiSportIcon } from "@/components/ascii";
import { LEAGUES, getLeaguesByStatus, type League } from "@/lib/types";

const { active: ACTIVE_LEAGUES, inactive: INACTIVE_LEAGUES } = getLeaguesByStatus();

// League-specific accent colors for hover effects
const LEAGUE_COLORS: Record<League, string> = {
  nhl: "group-hover:text-terminal-blue group-hover:border-terminal-blue",
  nfl: "group-hover:text-terminal-green group-hover:border-terminal-green",
  nba: "group-hover:text-terminal-red group-hover:border-terminal-red",
  mlb: "group-hover:text-terminal-blue group-hover:border-terminal-blue",
  mls: "group-hover:text-terminal-green group-hover:border-terminal-green",
  epl: "group-hover:text-terminal-cyan group-hover:border-terminal-cyan",
  ncaam: "group-hover:text-terminal-yellow group-hover:border-terminal-yellow",
  ncaaw: "group-hover:text-terminal-cyan group-hover:border-terminal-cyan",
  f1: "group-hover:text-terminal-red group-hover:border-terminal-red",
  pga: "group-hover:text-terminal-green group-hover:border-terminal-green",
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1 matrix-bg">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Hero section with logo */}
          <div className="text-center mb-16 relative">
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 text-terminal-border font-mono text-xs hidden lg:block" aria-hidden="true">
              ╔══════════╗<br />
              ║░░░░░░░░░░║<br />
              ║░░░░░░░░░░║
            </div>
            <div className="absolute top-0 right-0 text-terminal-border font-mono text-xs hidden lg:block" aria-hidden="true">
              ╔══════════╗<br />
              ║░░░░░░░░░░║<br />
              ║░░░░░░░░░░║
            </div>

            <AsciiLogo className="mx-auto text-xs sm:text-sm md:text-base" />

            {/* Tagline with typing effect styling */}
            <div className="mt-6 inline-block">
              <p className="text-terminal-muted font-mono inline-flex items-center gap-2">
                <span className="text-terminal-green">{">"}</span>
                <span className="text-terminal-cyan">Real-time sports scores rendered in ASCII art</span>
                <span className="text-terminal-green animate-pulse">█</span>
              </p>
            </div>

            {/* System status bar */}
            <div className="mt-4 font-mono text-xs text-terminal-muted flex items-center justify-center gap-4 flex-wrap">
              <span>
                <span className="text-terminal-green">●</span> SYSTEM ONLINE
              </span>
              <span className="text-terminal-border hidden sm:inline">│</span>
              <span>
                <span className="text-terminal-green">◆</span> {ACTIVE_LEAGUES.length} IN SEASON
              </span>
              <span className="text-terminal-border hidden sm:inline">│</span>
              <span>
                <span className="text-terminal-yellow">○</span> {INACTIVE_LEAGUES.length} OFF-SEASON
              </span>
              <span className="text-terminal-border hidden sm:inline">│</span>
              <span>
                <span className="text-terminal-cyan">◈</span> LIVE DATA FEED
              </span>
            </div>
          </div>

          {/* Active leagues section */}
          <section aria-label="Active leagues">
            <div className="text-center mb-8">
              <div className="inline-block font-mono">
                <div className="text-terminal-border text-xs hidden sm:block" aria-hidden="true">
                  ╔════════════════════════════════════════════╗
                </div>
                <h2 className="text-terminal-cyan text-lg py-2 px-4">
                  <span className="text-terminal-green">●</span>
                  <span className="text-terminal-border">{" [ "}</span>
                  IN SEASON
                  <span className="text-terminal-border">{" ] "}</span>
                  <span className="text-terminal-green">●</span>
                </h2>
                <div className="text-terminal-border text-xs hidden sm:block" aria-hidden="true">
                  ╚════════════════════════════════════════════╝
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {ACTIVE_LEAGUES.map((leagueId) => {
                const league = LEAGUES[leagueId];
                return (
                  <Link
                    key={leagueId}
                    href={`/${leagueId}`}
                    className="group font-mono text-center"
                  >
                    <div className={`retro-card p-6 transition-all duration-300 ${LEAGUE_COLORS[leagueId]}`}>
                      {/* ASCII block letter league name */}
                      <div className="flex items-center justify-center py-4">
                        <AsciiSportIcon
                          league={leagueId}
                          variant="large"
                          className="text-[11px] leading-[1.1] group-hover:text-glow transition-all"
                        />
                      </div>

                      {/* Divider */}
                      <div className="text-terminal-border group-hover:text-current transition-colors text-xs my-3" aria-hidden="true">
                        ════════════════════
                      </div>

                      {/* Full name */}
                      <p className="text-sm text-terminal-muted group-hover:text-terminal-fg transition-colors">
                        {league.fullName}
                      </p>

                      {/* Enter indicator */}
                      <div className="mt-3 text-xs text-terminal-green opacity-0 group-hover:opacity-100 transition-opacity">
                        {">"} ENTER
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Off-season leagues section */}
          {INACTIVE_LEAGUES.length > 0 && (
            <section aria-label="Off-season leagues" className="mt-16">
              <div className="text-center mb-8">
                <div className="inline-block font-mono">
                  <div className="text-terminal-border text-xs hidden sm:block" aria-hidden="true">
                    ┌────────────────────────────────────────────┐
                  </div>
                  <h2 className="text-terminal-muted text-lg py-2 px-4">
                    <span className="text-terminal-yellow">○</span>
                    <span className="text-terminal-border">{" [ "}</span>
                    OFF-SEASON
                    <span className="text-terminal-border">{" ] "}</span>
                    <span className="text-terminal-yellow">○</span>
                  </h2>
                  <div className="text-terminal-border text-xs hidden sm:block" aria-hidden="true">
                    └────────────────────────────────────────────┘
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {INACTIVE_LEAGUES.map((leagueId) => {
                  const league = LEAGUES[leagueId];
                  return (
                    <Link
                      key={leagueId}
                      href={`/${leagueId}`}
                      className="group font-mono text-center"
                    >
                      <div className={`retro-card p-6 transition-all duration-300 opacity-70 hover:opacity-100 ${LEAGUE_COLORS[leagueId]}`}>
                        {/* ASCII block letter league name */}
                        <div className="flex items-center justify-center py-4">
                          <AsciiSportIcon
                            league={leagueId}
                            variant="large"
                            className="text-[11px] leading-[1.1] group-hover:text-glow transition-all"
                          />
                        </div>

                        {/* Divider */}
                        <div className="text-terminal-border group-hover:text-current transition-colors text-xs my-3" aria-hidden="true">
                          ════════════════════
                        </div>

                        {/* Full name */}
                        <p className="text-sm text-terminal-muted group-hover:text-terminal-fg transition-colors">
                          {league.fullName}
                        </p>

                        {/* Enter indicator */}
                        <div className="mt-3 text-xs text-terminal-yellow opacity-0 group-hover:opacity-100 transition-opacity">
                          {">"} VIEW HISTORY
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Features section */}
          <section className="mt-20" aria-label="Features">
            <div className="text-center mb-10">
              <div className="inline-block font-mono">
                <div className="text-terminal-border text-xs hidden sm:block" aria-hidden="true">
                  ┌────────────────────────────────────┐
                </div>
                <h2 className="text-terminal-cyan text-lg py-2 px-4">
                  <span className="text-terminal-yellow">◆</span>
                  {" SYSTEM FEATURES "}
                  <span className="text-terminal-yellow">◆</span>
                </h2>
                <div className="text-terminal-border text-xs hidden sm:block" aria-hidden="true">
                  └────────────────────────────────────┘
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 font-mono text-sm">
              {/* Live feature */}
              <div className="retro-card p-6 text-center">
                <div className="text-terminal-border text-xs mb-4" aria-hidden="true">
                  ┌─────────────────────────┐
                </div>
                <div className="text-terminal-green text-2xl mb-3">
                  {"<"} LIVE {">"}
                </div>
                <div className="text-terminal-green text-xs mb-4">
                  ● ● ● BROADCASTING ● ● ●
                </div>
                <p className="text-terminal-muted text-xs leading-relaxed">
                  Real-time scores updated every 30 seconds during live games with automatic refresh
                </p>
                <div className="text-terminal-border text-xs mt-4" aria-hidden="true">
                  └─────────────────────────┘
                </div>
              </div>

              {/* ASCII feature */}
              <div className="retro-card p-6 text-center">
                <div className="text-terminal-border text-xs mb-4" aria-hidden="true">
                  ╔═════════════════════════╗
                </div>
                <div className="text-terminal-yellow text-2xl mb-3">
                  █ ASCII █
                </div>
                <div className="text-terminal-yellow text-xs mb-4">
                  ░▒▓█ RETRO STYLE █▓▒░
                </div>
                <p className="text-terminal-muted text-xs leading-relaxed">
                  Classic terminal aesthetic with Unicode box-drawing and authentic CRT effects
                </p>
                <div className="text-terminal-border text-xs mt-4" aria-hidden="true">
                  ╚═════════════════════════╝
                </div>
              </div>

              {/* Leagues feature */}
              <div className="retro-card p-6 text-center">
                <div className="text-terminal-border text-xs mb-4" aria-hidden="true">
                  ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
                </div>
                <div className="text-terminal-cyan text-2xl mb-3">
                  [ {ACTIVE_LEAGUES.length + INACTIVE_LEAGUES.length} LEAGUES ]
                </div>
                <div className="text-terminal-cyan text-xs mb-4">
                  ◇ {[...ACTIVE_LEAGUES, ...INACTIVE_LEAGUES].map(l => LEAGUES[l].name).join(" ◇ ")} ◇
                </div>
                <p className="text-terminal-muted text-xs leading-relaxed">
                  Complete coverage of major sports with dedicated scoreboards and standings
                </p>
                <div className="text-terminal-border text-xs mt-4" aria-hidden="true">
                  ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛
                </div>
              </div>
            </div>
          </section>

          {/* Terminal command hint */}
          <div className="mt-16 text-center font-mono">
            <div className="inline-block text-terminal-muted text-xs">
              <span className="text-terminal-green">$</span>
              <span className="ml-2">./select-league.sh --league=</span>
              <span className="text-terminal-cyan">[{[...ACTIVE_LEAGUES, ...INACTIVE_LEAGUES].join("|")}]</span>
              <span className="text-terminal-green animate-pulse ml-1">█</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
