import type { LeagueStandings, League, StandingsEntry, StandingsGroup } from "@/lib/types";
import { AsciiTable } from "@/components/ascii/AsciiTable";

/**
 * Column configuration for each league's standings table
 */
interface StandingsColumn {
  key: string;
  header: string;
  width: number;
  align: "left" | "right" | "center";
}

const STANDINGS_COLUMNS: Record<Exclude<League, "f1" | "pga">, StandingsColumn[]> = {
  nhl: [
    { key: "team", header: "TEAM", width: 20, align: "left" },
    { key: "gamesPlayed", header: "GP", width: 4, align: "right" },
    { key: "wins", header: "W", width: 4, align: "right" },
    { key: "losses", header: "L", width: 4, align: "right" },
    { key: "otLosses", header: "OT", width: 4, align: "right" },
    { key: "points", header: "PTS", width: 5, align: "right" },
    { key: "goalDifferential", header: "DIFF", width: 6, align: "right" },
  ],
  nfl: [
    { key: "team", header: "TEAM", width: 20, align: "left" },
    { key: "wins", header: "W", width: 4, align: "right" },
    { key: "losses", header: "L", width: 4, align: "right" },
    { key: "ties", header: "T", width: 4, align: "right" },
    { key: "winPercent", header: "PCT", width: 6, align: "right" },
    { key: "pointDifferential", header: "DIFF", width: 6, align: "right" },
  ],
  nba: [
    { key: "team", header: "TEAM", width: 20, align: "left" },
    { key: "wins", header: "W", width: 4, align: "right" },
    { key: "losses", header: "L", width: 4, align: "right" },
    { key: "winPercent", header: "PCT", width: 6, align: "right" },
    { key: "gamesBehind", header: "GB", width: 6, align: "right" },
    { key: "streak", header: "STRK", width: 6, align: "right" },
  ],
  mlb: [
    { key: "team", header: "TEAM", width: 20, align: "left" },
    { key: "wins", header: "W", width: 4, align: "right" },
    { key: "losses", header: "L", width: 4, align: "right" },
    { key: "winPercent", header: "PCT", width: 6, align: "right" },
    { key: "gamesBehind", header: "GB", width: 6, align: "right" },
    { key: "runDifferential", header: "DIFF", width: 6, align: "right" },
  ],
  mls: [
    { key: "team", header: "TEAM", width: 20, align: "left" },
    { key: "gamesPlayed", header: "GP", width: 4, align: "right" },
    { key: "wins", header: "W", width: 4, align: "right" },
    { key: "losses", header: "L", width: 4, align: "right" },
    { key: "ties", header: "D", width: 4, align: "right" },
    { key: "goalDifferential", header: "GD", width: 5, align: "right" },
    { key: "points", header: "PTS", width: 5, align: "right" },
  ],
  epl: [
    { key: "team", header: "TEAM", width: 20, align: "left" },
    { key: "gamesPlayed", header: "GP", width: 4, align: "right" },
    { key: "wins", header: "W", width: 4, align: "right" },
    { key: "losses", header: "L", width: 4, align: "right" },
    { key: "ties", header: "D", width: 4, align: "right" },
    { key: "goalDifferential", header: "GD", width: 5, align: "right" },
    { key: "points", header: "PTS", width: 5, align: "right" },
  ],
  ncaam: [
    { key: "team", header: "TEAM", width: 22, align: "left" },
    { key: "wins", header: "W", width: 4, align: "right" },
    { key: "losses", header: "L", width: 4, align: "right" },
    { key: "winPercent", header: "PCT", width: 6, align: "right" },
    { key: "conferenceWins", header: "CW", width: 4, align: "right" },
    { key: "conferenceLosses", header: "CL", width: 4, align: "right" },
  ],
  ncaaw: [
    { key: "team", header: "TEAM", width: 22, align: "left" },
    { key: "wins", header: "W", width: 4, align: "right" },
    { key: "losses", header: "L", width: 4, align: "right" },
    { key: "winPercent", header: "PCT", width: 6, align: "right" },
    { key: "conferenceWins", header: "CW", width: 4, align: "right" },
    { key: "conferenceLosses", header: "CL", width: 4, align: "right" },
  ],
};

interface StandingsGroupDisplayProps {
  group: StandingsGroup;
  league: Exclude<League, "f1" | "pga">;
}

function StandingsGroupDisplay({ group, league }: StandingsGroupDisplayProps) {
  const columns = STANDINGS_COLUMNS[league];

  const getCellValue = (entry: StandingsEntry, columnKey: string): string => {
    if (columnKey === "team") {
      return entry.team.abbreviation;
    }
    const value = entry.stats[columnKey];
    return value !== undefined ? String(value) : "-";
  };

  return (
    <div className="mb-8">
      {/* Group header */}
      <h3 className="font-mono text-terminal-cyan text-sm mb-2">
        <span className="text-terminal-border">[</span>
        {group.name}
        <span className="text-terminal-border">]</span>
      </h3>

      {/* Standings table */}
      <div className="overflow-x-auto">
        <AsciiTable
          columns={columns}
          data={group.entries}
          getCellValue={getCellValue}
          getRowKey={(entry) => entry.team.id}
          className="text-sm"
        />
      </div>
    </div>
  );
}

interface LeagueStandingsDisplayProps {
  standings: LeagueStandings;
}

export function LeagueStandingsDisplay({ standings }: LeagueStandingsDisplayProps) {
  const league = standings.league as Exclude<League, "f1" | "pga">;

  if (standings.groups.length === 0) {
    return (
      <div className="overflow-x-auto">
        <div className="font-mono text-center py-8 inline-block min-w-full">
          <div className="text-terminal-border" aria-hidden="true">
            ╔═══════════════════════════════════════════════╗
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">║</span>
            <span className="text-terminal-muted px-4">
              {"  "}No standings data available{"  "}
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

  return (
    <div className="space-y-4">
      {standings.groups.map((group) => (
        <StandingsGroupDisplay
          key={group.name}
          group={group}
          league={league}
        />
      ))}
    </div>
  );
}
