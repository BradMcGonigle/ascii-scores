import type { NCAAPolls, RankedTeam } from "@/lib/types";

interface Top25RankingsProps {
  polls: NCAAPolls;
}

function TrendIndicator({ trend, previousRank }: { trend?: "up" | "down" | "same"; previousRank?: number }) {
  if (!trend || trend === "same") {
    return <span className="text-terminal-muted">-</span>;
  }

  if (trend === "up") {
    return (
      <span className="text-terminal-green" title={previousRank ? `Was #${previousRank}` : undefined}>
        ▲
      </span>
    );
  }

  return (
    <span className="text-terminal-red" title={previousRank ? `Was #${previousRank}` : undefined}>
      ▼
    </span>
  );
}

function RankingsTable({ teams }: { teams: RankedTeam[] }) {
  return (
    <div className="font-mono text-sm border border-terminal-border rounded">
      {/* Header */}
      <div
        className="grid border-b border-terminal-border bg-terminal-bg/50 text-terminal-cyan"
        style={{ gridTemplateColumns: "40px 1fr 60px 40px" }}
      >
        <div className="px-2 py-1 text-center">#</div>
        <div className="px-2 py-1 text-left">TEAM</div>
        <div className="px-2 py-1 text-right">REC</div>
        <div className="px-2 py-1 text-center">+/-</div>
      </div>

      {/* Rows */}
      {teams.map((team, index) => (
        <div
          key={team.team.id}
          className={`grid ${index % 2 === 0 ? "bg-terminal-bg/30" : ""}`}
          style={{ gridTemplateColumns: "40px 1fr 60px 40px" }}
        >
          <div className="px-2 py-1 text-center text-terminal-yellow">
            {team.rank}
          </div>
          <div className="px-2 py-1 text-left text-terminal-fg truncate">
            {team.team.abbreviation}
          </div>
          <div className="px-2 py-1 text-right text-terminal-muted">
            {team.record}
          </div>
          <div className="px-2 py-1 text-center">
            <TrendIndicator trend={team.trend} previousRank={team.previousRank} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Top25Rankings({ polls }: Top25RankingsProps) {
  if (polls.polls.length === 0) {
    return null;
  }

  // Use AP Poll as primary, or first available poll
  const primaryPoll = polls.polls.find(p => p.name.toLowerCase().includes("ap")) || polls.polls[0];

  return (
    <div className="mb-8">
      <h2 className="font-mono text-terminal-cyan text-lg mb-4">
        <span className="text-terminal-border">[</span>
        Top 25
        <span className="text-terminal-border">]</span>
        <span className="text-terminal-muted text-sm ml-2">
          {primaryPoll.name}
        </span>
      </h2>

      <RankingsTable teams={primaryPoll.teams} />
    </div>
  );
}
