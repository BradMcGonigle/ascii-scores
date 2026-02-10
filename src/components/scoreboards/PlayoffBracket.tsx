import type { PlayoffBracket, PlayoffMatchup } from "@/lib/types/playoffs";
import { BracketMatchupCard } from "./BracketMatchupCard";
import { AsciiSectionHeader } from "@/components/ascii/AsciiDecorations";

interface PlayoffBracketDisplayProps {
  bracket: PlayoffBracket;
}

/**
 * Get matchups for a specific round and conference
 */
function getMatchups(
  bracket: PlayoffBracket,
  roundId: string,
  conference?: string
): PlayoffMatchup[] {
  return bracket.matchups
    .filter(
      (m) =>
        m.round === roundId &&
        (conference === undefined
          ? m.conference === undefined
          : m.conference === conference)
    )
    .sort((a, b) => a.position - b.position);
}

/**
 * CSS connector that merges two matchups into one (for bracket lines).
 * Used between rounds on desktop layout.
 */
function BracketConnector({
  direction,
}: {
  direction: "right" | "left";
  matchupCount: number;
}) {
  return (
    <div
      className="hidden lg:flex flex-col justify-around h-full py-4"
      aria-hidden="true"
    >
      <div className="flex items-center h-full">
        <div
          className={`
            w-3 h-full relative
            ${direction === "right" ? "border-r" : "border-l"}
            border-terminal-border/50
          `}
        >
          <div className="absolute top-1/4 w-full border-t border-terminal-border/50" />
          <div className="absolute top-3/4 w-full border-t border-terminal-border/50" />
          <div
            className={`absolute top-1/2 w-3 border-t border-terminal-border/50 ${
              direction === "right" ? "right-0 translate-x-full" : "left-0 -translate-x-full"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Column of matchup cards for a bracket round
 */
function RoundColumn({
  matchups,
  roundName,
  className = "",
}: {
  matchups: PlayoffMatchup[];
  roundName: string;
  className?: string;
}) {
  if (matchups.length === 0) return <div className={className} />;

  return (
    <div className={`flex flex-col justify-around gap-2 ${className}`}>
      <div className="text-center mb-1 hidden lg:block">
        <span className="font-mono text-xs text-terminal-muted">
          {roundName}
        </span>
      </div>
      {matchups.map((matchup) => (
        <BracketMatchupCard key={matchup.id} matchup={matchup} />
      ))}
    </div>
  );
}

/**
 * Desktop horizontal bracket layout using CSS grid.
 * Layout: AFC-WC | AFC-DIV | AFC-CONF | SUPER BOWL | NFC-CONF | NFC-DIV | NFC-WC
 */
function DesktopBracket({ bracket }: PlayoffBracketDisplayProps) {
  const afcWC = getMatchups(bracket, "wild-card", "AFC");
  const afcDiv = getMatchups(bracket, "divisional", "AFC");
  const afcConf = getMatchups(bracket, "conference", "AFC");
  const superBowl = getMatchups(bracket, "super-bowl");
  const nfcConf = getMatchups(bracket, "conference", "NFC");
  const nfcDiv = getMatchups(bracket, "divisional", "NFC");
  const nfcWC = getMatchups(bracket, "wild-card", "NFC");

  return (
    <div className="hidden lg:block overflow-x-auto">
      {/* Conference labels */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-4">
        <div className="text-center">
          <span className="font-mono text-lg text-terminal-cyan font-bold">
            AFC
          </span>
        </div>
        <div />
        <div className="text-center">
          <span className="font-mono text-lg text-terminal-cyan font-bold">
            NFC
          </span>
        </div>
      </div>

      {/* Bracket grid */}
      <div className="grid grid-cols-[minmax(120px,1fr)_16px_minmax(120px,1fr)_16px_minmax(120px,1fr)_16px_minmax(140px,1.2fr)_16px_minmax(120px,1fr)_16px_minmax(120px,1fr)_16px_minmax(120px,1fr)] items-center gap-y-2">
        {/* AFC Wild Card */}
        <RoundColumn matchups={afcWC} roundName="Wild Card" />

        {/* Connector: WC → DIV */}
        <BracketConnector direction="right" matchupCount={afcWC.length} />

        {/* AFC Divisional */}
        <RoundColumn matchups={afcDiv} roundName="Divisional" />

        {/* Connector: DIV → CONF */}
        <BracketConnector direction="right" matchupCount={afcDiv.length} />

        {/* AFC Conference */}
        <RoundColumn matchups={afcConf} roundName="Conference" />

        {/* Connector: CONF → SB */}
        <BracketConnector direction="right" matchupCount={afcConf.length} />

        {/* Super Bowl */}
        <RoundColumn matchups={superBowl} roundName="Super Bowl" className="min-w-[140px]" />

        {/* Connector: SB ← CONF */}
        <BracketConnector direction="left" matchupCount={nfcConf.length} />

        {/* NFC Conference */}
        <RoundColumn matchups={nfcConf} roundName="Conference" />

        {/* Connector: CONF ← DIV */}
        <BracketConnector direction="left" matchupCount={nfcDiv.length} />

        {/* NFC Divisional */}
        <RoundColumn matchups={nfcDiv} roundName="Divisional" />

        {/* Connector: DIV ← WC */}
        <BracketConnector direction="left" matchupCount={nfcWC.length} />

        {/* NFC Wild Card */}
        <RoundColumn matchups={nfcWC} roundName="Wild Card" />
      </div>
    </div>
  );
}

/**
 * Mobile stacked layout — organized by round (championship first)
 */
function MobileBracket({ bracket }: PlayoffBracketDisplayProps) {
  // Reverse round order so the championship is at the top
  const roundsReversed = [...bracket.rounds].reverse();

  return (
    <div className="lg:hidden space-y-8">
      {roundsReversed.map((round) => {
        const roundMatchups = bracket.matchups
          .filter((m) => m.round === round.id)
          .sort((a, b) => {
            // Group by conference, then by position
            const confOrder = (a.conference ?? "ZZZ").localeCompare(
              b.conference ?? "ZZZ"
            );
            if (confOrder !== 0) return confOrder;
            return a.position - b.position;
          });

        if (roundMatchups.length === 0) return null;

        // Group by conference for display
        const afcMatchups = roundMatchups.filter(
          (m) => m.conference === "AFC"
        );
        const nfcMatchups = roundMatchups.filter(
          (m) => m.conference === "NFC"
        );
        const neutralMatchups = roundMatchups.filter(
          (m) => m.conference === undefined
        );

        return (
          <section key={round.id}>
            <AsciiSectionHeader title={round.name} variant="boxed" className="mb-4" />

            {afcMatchups.length > 0 && (
              <div className="mb-4">
                <h3 className="font-mono text-xs text-terminal-cyan mb-2">
                  <span className="text-terminal-border">─── </span>
                  AFC
                  <span className="text-terminal-border"> ───</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {afcMatchups.map((matchup) => (
                    <BracketMatchupCard key={matchup.id} matchup={matchup} />
                  ))}
                </div>
              </div>
            )}

            {nfcMatchups.length > 0 && (
              <div className="mb-4">
                <h3 className="font-mono text-xs text-terminal-cyan mb-2">
                  <span className="text-terminal-border">─── </span>
                  NFC
                  <span className="text-terminal-border"> ───</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {nfcMatchups.map((matchup) => (
                    <BracketMatchupCard key={matchup.id} matchup={matchup} />
                  ))}
                </div>
              </div>
            )}

            {neutralMatchups.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {neutralMatchups.map((matchup) => (
                  <BracketMatchupCard key={matchup.id} matchup={matchup} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/**
 * Find the Super Bowl champion from the bracket data
 */
function getChampion(
  bracket: PlayoffBracket
): { name: string; abbreviation: string; score: number; opponentScore: number; gameNote: string } | null {
  const sb = bracket.matchups.find((m) => m.round === "super-bowl");
  if (!sb?.game || sb.game.status !== "final") return null;

  const winner =
    sb.topTeam?.isWinner === true
      ? sb.topTeam
      : sb.bottomTeam?.isWinner === true
        ? sb.bottomTeam
        : null;
  const loser =
    sb.topTeam?.isWinner === true ? sb.bottomTeam : sb.topTeam;

  if (!winner) return null;

  return {
    name: winner.displayName,
    abbreviation: winner.abbreviation,
    score: winner.score ?? 0,
    opponentScore: loser?.score ?? 0,
    gameNote: sb.game.detail ?? "Final",
  };
}

/**
 * ASCII champion banner displayed when the Super Bowl has been decided
 */
function ChampionBanner({
  champion,
  seasonLabel,
}: {
  champion: { name: string; abbreviation: string; score: number; opponentScore: number };
  seasonLabel: string;
}) {
  const fill = (char: string) => (
    <span className="flex-1 overflow-hidden whitespace-nowrap tracking-[0]">
      {char.repeat(100)}
    </span>
  );

  return (
    <div
      className="font-mono text-center mb-8 max-w-md mx-auto text-xs sm:text-sm"
      role="banner"
      aria-label={`${champion.name}, Super Bowl Champion`}
    >
      {/* Stars top */}
      <div className="flex text-terminal-yellow" aria-hidden="true">
        <span>★</span>
        <span className="flex-1" />
        <span>★</span>
      </div>

      {/* Top border */}
      <div className="flex text-terminal-border" aria-hidden="true">
        <span>╔</span>{fill("═")}<span>╗</span>
      </div>

      {/* Title */}
      <div className="flex">
        <span className="text-terminal-border" aria-hidden="true">║</span>
        <div className="flex-1 text-center py-1 text-terminal-yellow">
          SUPER BOWL CHAMPION
        </div>
        <span className="text-terminal-border" aria-hidden="true">║</span>
      </div>

      {/* Divider */}
      <div className="flex text-terminal-border" aria-hidden="true">
        <span>╠</span>{fill("═")}<span>╣</span>
      </div>

      {/* Champion name */}
      <div className="flex">
        <span className="text-terminal-border" aria-hidden="true">║</span>
        <div className="flex-1 text-center py-1 text-terminal-green text-glow font-bold">
          {champion.name.toUpperCase()}
        </div>
        <span className="text-terminal-border" aria-hidden="true">║</span>
      </div>

      {/* Score */}
      <div className="flex">
        <span className="text-terminal-border" aria-hidden="true">║</span>
        <div className="flex-1 text-center text-terminal-fg">
          {champion.score} - {champion.opponentScore}
        </div>
        <span className="text-terminal-border" aria-hidden="true">║</span>
      </div>

      {/* Divider */}
      <div className="flex text-terminal-border" aria-hidden="true">
        <span>╠</span>{fill("═")}<span>╣</span>
      </div>

      {/* Season label */}
      <div className="flex">
        <span className="text-terminal-border" aria-hidden="true">║</span>
        <div className="flex-1 text-center py-1 text-terminal-muted">
          {seasonLabel}
        </div>
        <span className="text-terminal-border" aria-hidden="true">║</span>
      </div>

      {/* Bottom border */}
      <div className="flex text-terminal-border" aria-hidden="true">
        <span>╚</span>{fill("═")}<span>╝</span>
      </div>

      {/* Stars bottom */}
      <div className="flex text-terminal-yellow" aria-hidden="true">
        <span>★</span>
        <span className="flex-1" />
        <span>★</span>
      </div>
    </div>
  );
}

/**
 * Main playoff bracket display component.
 * Renders a horizontal bracket on desktop and stacked rounds on mobile.
 */
export function PlayoffBracketDisplay({
  bracket,
}: PlayoffBracketDisplayProps) {
  if (bracket.matchups.length === 0) {
    return (
      <div className="overflow-x-auto">
        <div className="font-mono text-center py-8 inline-block min-w-full">
          <div className="text-terminal-border" aria-hidden="true">
            ╔═══════════════════════════════════════════════╗
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">║</span>
            <span className="text-terminal-muted px-4">
              {"  "}No playoff data available for this season{"  "}
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

  const champion = getChampion(bracket);

  return (
    <div>
      {/* Champion banner */}
      {champion && (
        <ChampionBanner
          champion={champion}
          seasonLabel={bracket.displayLabel}
        />
      )}

      {/* Title (only when no champion banner) */}
      {!champion && (
        <div className="text-center mb-6">
          <h2 className="font-mono text-lg text-terminal-fg">
            <span className="text-terminal-border">[</span>
            {bracket.displayLabel}
            <span className="text-terminal-border">]</span>
          </h2>
        </div>
      )}

      {/* Desktop bracket */}
      <DesktopBracket bracket={bracket} />

      {/* Mobile layout */}
      <MobileBracket bracket={bracket} />
    </div>
  );
}
