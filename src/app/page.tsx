import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AsciiLogo } from "@/components/ascii";
import { LEAGUES, type League } from "@/lib/types";

const LEAGUE_ORDER: League[] = ["nhl", "nfl", "nba", "mlb", "mls", "f1"];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Hero section with logo */}
          <div className="text-center mb-12">
            <AsciiLogo className="mx-auto text-xs sm:text-sm md:text-base" />
            <p className="mt-4 text-terminal-muted font-mono">
              Real-time sports scores rendered in ASCII art
            </p>
          </div>

          {/* League selection grid */}
          <section aria-label="Select a league">
            <h2 className="font-mono text-terminal-cyan text-center mb-8">
              <span className="hidden sm:inline">═══════════════ </span>
              SELECT A LEAGUE
              <span className="hidden sm:inline"> ═══════════════</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {LEAGUE_ORDER.map((leagueId) => {
                const league = LEAGUES[leagueId];
                return (
                  <Link
                    key={leagueId}
                    href={`/${leagueId}`}
                    className="group font-mono text-center"
                  >
                    <div className="border border-terminal-border p-6 transition-colors group-hover:border-terminal-fg group-hover:bg-terminal-border/10">
                      <div className="text-terminal-border group-hover:text-terminal-fg" aria-hidden="true">
                        ┌─────────┐
                      </div>
                      <div>
                        <span className="text-terminal-border group-hover:text-terminal-fg" aria-hidden="true">│</span>
                        <span className="text-2xl font-bold text-terminal-fg px-2">
                          {league.name}
                        </span>
                        <span className="text-terminal-border group-hover:text-terminal-fg" aria-hidden="true">│</span>
                      </div>
                      <div className="text-terminal-border group-hover:text-terminal-fg" aria-hidden="true">
                        └─────────┘
                      </div>
                      <p className="mt-2 text-xs text-terminal-muted">
                        {league.fullName}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Features section */}
          <section className="mt-16" aria-label="Features">
            <h2 className="font-mono text-terminal-cyan text-center mb-8">
              <span className="hidden sm:inline">═══════════════════ </span>
              FEATURES
              <span className="hidden sm:inline"> ═══════════════════</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8 font-mono text-sm">
              <div className="text-center">
                <div className="text-terminal-green text-2xl mb-2">[LIVE]</div>
                <p className="text-terminal-muted">
                  Real-time scores updated every 30 seconds during live games
                </p>
              </div>
              <div className="text-center">
                <div className="text-terminal-yellow text-2xl mb-2">[ASCII]</div>
                <p className="text-terminal-muted">
                  Classic terminal aesthetic with Unicode box-drawing characters
                </p>
              </div>
              <div className="text-center">
                <div className="text-terminal-cyan text-2xl mb-2">[6 LEAGUES]</div>
                <p className="text-terminal-muted">
                  NHL, NFL, NBA, MLB, MLS, and Formula 1 all in one place
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
