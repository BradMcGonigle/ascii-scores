import type { LeagueStandings, League, StandingsEntry, StandingsGroup } from "@/lib/types";

/**
 * Column configuration for each league's standings table
 */
interface StandingsColumn {
  key: string;
  header: string;
  hideOnMobile?: boolean;
}

const STANDINGS_COLUMNS: Record<Exclude<League, "f1" | "pga">, StandingsColumn[]> = {
  nhl: [
    { key: "team", header: "TEAM" },
    { key: "gamesPlayed", header: "GP", hideOnMobile: true },
    { key: "wins", header: "W" },
    { key: "losses", header: "L" },
    { key: "otLosses", header: "OT" },
    { key: "points", header: "PTS" },
    { key: "goalDifferential", header: "DIFF", hideOnMobile: true },
  ],
  nfl: [
    { key: "team", header: "TEAM" },
    { key: "wins", header: "W" },
    { key: "losses", header: "L" },
    { key: "ties", header: "T" },
    { key: "winPercent", header: "PCT" },
    { key: "pointDifferential", header: "DIFF", hideOnMobile: true },
  ],
  nba: [
    { key: "team", header: "TEAM" },
    { key: "wins", header: "W" },
    { key: "losses", header: "L" },
    { key: "winPercent", header: "PCT" },
    { key: "gamesBehind", header: "GB" },
    { key: "streak", header: "STRK", hideOnMobile: true },
  ],
  mlb: [
    { key: "team", header: "TEAM" },
    { key: "wins", header: "W" },
    { key: "losses", header: "L" },
    { key: "winPercent", header: "PCT" },
    { key: "gamesBehind", header: "GB" },
    { key: "runDifferential", header: "DIFF", hideOnMobile: true },
  ],
  mls: [
    { key: "team", header: "TEAM" },
    { key: "gamesPlayed", header: "GP", hideOnMobile: true },
    { key: "wins", header: "W" },
    { key: "losses", header: "L" },
    { key: "ties", header: "D" },
    { key: "goalDifferential", header: "GD" },
    { key: "points", header: "PTS" },
  ],
  epl: [
    { key: "team", header: "TEAM" },
    { key: "gamesPlayed", header: "GP", hideOnMobile: true },
    { key: "wins", header: "W" },
    { key: "losses", header: "L" },
    { key: "ties", header: "D" },
    { key: "goalDifferential", header: "GD" },
    { key: "points", header: "PTS" },
  ],
  ncaam: [
    { key: "team", header: "TEAM" },
    { key: "wins", header: "W" },
    { key: "losses", header: "L" },
    { key: "winPercent", header: "PCT" },
    { key: "conferenceWins", header: "CW" },
    { key: "conferenceLosses", header: "CL" },
  ],
  ncaaw: [
    { key: "team", header: "TEAM" },
    { key: "wins", header: "W" },
    { key: "losses", header: "L" },
    { key: "winPercent", header: "PCT" },
    { key: "conferenceWins", header: "CW" },
    { key: "conferenceLosses", header: "CL" },
  ],
};

/**
 * Generate a URL-safe slug from conference name
 */
function getConferenceSlug(name: string): string {
  // Common conference abbreviations
  const abbreviations: Record<string, string> = {
    "Atlantic Coast Conference": "ACC",
    "Big 12 Conference": "BIG12",
    "Big East Conference": "BIGEAST",
    "Big Ten Conference": "B1G",
    "Pac-12 Conference": "PAC12",
    "Southeastern Conference": "SEC",
    "American Athletic Conference": "AAC",
    "Conference USA": "CUSA",
    "Mid-American Conference": "MAC",
    "Mountain West Conference": "MWC",
    "Sun Belt Conference": "SUNBELT",
    "Western Athletic Conference": "WAC",
    "Atlantic Sun Conference": "ASUN",
    "Big Sky Conference": "BIGSKY",
    "Big South Conference": "BIGSOUTH",
    "Colonial Athletic Association": "CAA",
    "Horizon League": "HORIZON",
    "Ivy League": "IVY",
    "Metro Atlantic Athletic Conference": "MAAC",
    "Missouri Valley Conference": "MVC",
    "Ohio Valley Conference": "OVC",
    "Patriot League": "PATRIOT",
    "Southern Conference": "SOCON",
    "Southland Conference": "SOUTHLAND",
    "Summit League": "SUMMIT",
    "West Coast Conference": "WCC",
  };

  // Check for known abbreviation
  for (const [fullName, abbrev] of Object.entries(abbreviations)) {
    if (name.toLowerCase().includes(fullName.toLowerCase())) {
      return abbrev;
    }
  }

  // Fallback: create a slug from the name
  return name
    .replace(/Conference|League/gi, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .slice(0, 6);
}

interface StandingsGroupDisplayProps {
  group: StandingsGroup;
  league: Exclude<League, "f1" | "pga">;
}

function StandingsGroupDisplay({ group, league }: StandingsGroupDisplayProps) {
  const columns = STANDINGS_COLUMNS[league];
  const isNCAA = league === "ncaam" || league === "ncaaw";
  const slug = isNCAA ? getConferenceSlug(group.name) : "";

  const getCellValue = (entry: StandingsEntry, columnKey: string): string => {
    if (columnKey === "team") {
      return entry.team.abbreviation;
    }
    const value = entry.stats[columnKey];
    return value !== undefined ? String(value) : "-";
  };

  // Calculate grid columns - team gets more space, stats are equal
  const statColumns = columns.filter(c => c.key !== "team");
  const visibleStatColumns = statColumns.filter(c => !c.hideOnMobile);

  return (
    <div className="mb-6" id={slug || undefined}>
      {/* Group header */}
      <h3 className="font-mono text-terminal-cyan text-sm mb-2">
        <span className="text-terminal-border">[</span>
        {isNCAA ? slug : group.name}
        <span className="text-terminal-border">]</span>
        {isNCAA && (
          <span className="text-terminal-muted text-xs ml-2 hidden sm:inline">
            {group.name}
          </span>
        )}
      </h3>

      {/* Responsive standings table */}
      <div className="font-mono text-sm border border-terminal-border rounded">
        {/* Header row */}
        <div
          className="grid border-b border-terminal-border bg-terminal-bg/50 text-terminal-cyan"
          style={{
            gridTemplateColumns: `minmax(60px, 1fr) repeat(${visibleStatColumns.length}, minmax(32px, 48px))`
          }}
        >
          {columns.filter(c => !c.hideOnMobile).map((col) => (
            <div
              key={col.key}
              className={`px-2 py-1 ${col.key === "team" ? "text-left" : "text-right"}`}
            >
              {col.header}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {group.entries.map((entry, index) => (
          <div
            key={entry.team.id}
            className={`grid ${index % 2 === 0 ? "bg-terminal-bg/30" : ""}`}
            style={{
              gridTemplateColumns: `minmax(60px, 1fr) repeat(${visibleStatColumns.length}, minmax(32px, 48px))`
            }}
          >
            {columns.filter(c => !c.hideOnMobile).map((col) => (
              <div
                key={col.key}
                className={`px-2 py-1 ${col.key === "team" ? "text-left text-terminal-fg" : "text-right text-terminal-muted"}`}
              >
                {getCellValue(entry, col.key)}
              </div>
            ))}
          </div>
        ))}

        {/* Empty state */}
        {group.entries.length === 0 && (
          <div className="px-2 py-4 text-center text-terminal-muted">
            No standings data
          </div>
        )}
      </div>
    </div>
  );
}

interface ConferenceNavProps {
  groups: StandingsGroup[];
}

function ConferenceNav({ groups }: ConferenceNavProps) {
  return (
    <div className="mb-6 font-mono text-xs">
      <div className="text-terminal-muted mb-2">Jump to conference:</div>
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => {
          const slug = getConferenceSlug(group.name);
          return (
            <a
              key={group.name}
              href={`#${slug}`}
              className="px-2 py-1 border border-terminal-border text-terminal-cyan hover:bg-terminal-green/10 hover:text-terminal-green transition-colors rounded"
            >
              {slug}
            </a>
          );
        })}
      </div>
    </div>
  );
}

interface LeagueStandingsDisplayProps {
  standings: LeagueStandings;
}

export function LeagueStandingsDisplay({ standings }: LeagueStandingsDisplayProps) {
  const league = standings.league as Exclude<League, "f1" | "pga">;
  const isNCAA = league === "ncaam" || league === "ncaaw";

  if (standings.groups.length === 0) {
    return (
      <div className="font-mono text-center py-8">
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
    );
  }

  return (
    <div>
      {/* Conference navigation for NCAA */}
      {isNCAA && standings.groups.length > 5 && (
        <ConferenceNav groups={standings.groups} />
      )}

      {/* Standings groups */}
      <div className="space-y-4">
        {standings.groups.map((group) => (
          <StandingsGroupDisplay
            key={group.name}
            group={group}
            league={league}
          />
        ))}
      </div>
    </div>
  );
}
