import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import {
  getESPNScoreboard,
  hasLiveGames,
  LEAGUES,
  type League,
  type Scoreboard,
} from "@ascii-scores/core";

// League order for the dashboard
const DASHBOARD_LEAGUES: Exclude<League, "f1" | "pga">[] = [
  "nhl",
  "nfl",
  "nba",
  "mlb",
  "mls",
  "epl",
  "ncaam",
  "ncaaw",
];

interface LeagueStatus {
  league: League;
  scoreboard: Scoreboard | null;
  loading: boolean;
  error: string | null;
  liveCount: number;
  scheduledCount: number;
  finalCount: number;
}

function getStatusIndicator(status: LeagueStatus): string {
  if (status.loading) return "◐"; // Loading spinner
  if (status.error) return "✖"; // Error
  if (status.liveCount > 0) return "●"; // Live games
  if (status.scheduledCount > 0) return "◈"; // Scheduled games
  return "○"; // No games
}

function getStatusColor(status: LeagueStatus): string {
  if (status.loading) return "cyan";
  if (status.error) return "red";
  if (status.liveCount > 0) return "green";
  if (status.scheduledCount > 0) return "yellow";
  return "gray";
}

function getStatusText(status: LeagueStatus): string {
  if (status.loading) return "Loading...";
  if (status.error) return "Error";
  if (status.liveCount > 0 || status.finalCount > 0) {
    const parts: string[] = [];
    if (status.liveCount > 0) parts.push(`${status.liveCount} Live`);
    if (status.finalCount > 0) parts.push(`${status.finalCount} Final`);
    return parts.join(" │ ");
  }
  if (status.scheduledCount > 0) return `${status.scheduledCount} Scheduled`;
  return "No games";
}

function Dashboard() {
  const { exit } = useApp();
  const [statuses, setStatuses] = useState<Map<League, LeagueStatus>>(
    new Map(
      DASHBOARD_LEAGUES.map((league) => [
        league,
        {
          league,
          scoreboard: null,
          loading: true,
          error: null,
          liveCount: 0,
          scheduledCount: 0,
          finalCount: 0,
        },
      ])
    )
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);

  // Fetch all scoreboards on mount
  useEffect(() => {
    async function fetchAll() {
      for (const league of DASHBOARD_LEAGUES) {
        try {
          const scoreboard = await getESPNScoreboard(league);
          const liveCount = scoreboard.games.filter(
            (g) => g.status === "live"
          ).length;
          const scheduledCount = scoreboard.games.filter(
            (g) => g.status === "scheduled"
          ).length;
          const finalCount = scoreboard.games.filter(
            (g) => g.status === "final"
          ).length;

          setStatuses((prev) => {
            const next = new Map(prev);
            next.set(league, {
              league,
              scoreboard,
              loading: false,
              error: null,
              liveCount,
              scheduledCount,
              finalCount,
            });
            return next;
          });
        } catch (error) {
          setStatuses((prev) => {
            const next = new Map(prev);
            next.set(league, {
              league,
              scoreboard: null,
              loading: false,
              error: error instanceof Error ? error.message : "Unknown error",
              liveCount: 0,
              scheduledCount: 0,
              finalCount: 0,
            });
            return next;
          });
        }
      }
    }

    fetchAll();
  }, []);

  // Keyboard navigation
  useInput((input, key) => {
    if (input === "q") {
      exit();
      return;
    }

    // Number keys 1-8 for quick league selection
    const num = parseInt(input, 10);
    if (num >= 1 && num <= DASHBOARD_LEAGUES.length) {
      setSelectedLeague(DASHBOARD_LEAGUES[num - 1]);
      return;
    }

    // Arrow keys
    if (key.upArrow || input === "k") {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow || input === "j") {
      setSelectedIndex((prev) =>
        Math.min(DASHBOARD_LEAGUES.length - 1, prev + 1)
      );
    } else if (key.return) {
      setSelectedLeague(DASHBOARD_LEAGUES[selectedIndex]);
    } else if (input === "b" && selectedLeague) {
      setSelectedLeague(null);
    }
  });

  // If a league is selected, show its scoreboard
  if (selectedLeague) {
    const status = statuses.get(selectedLeague);
    return (
      <LeagueView
        league={selectedLeague}
        scoreboard={status?.scoreboard ?? null}
        onBack={() => setSelectedLeague(null)}
      />
    );
  }

  // Dashboard view
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="double" paddingX={2}>
        <Text bold color="green">
          ASCII SCORES CLI
        </Text>
        <Text> </Text>
        <Text color="gray">v0.1.0</Text>
        <Text> │ </Text>
        <Text color="cyan">{dateStr}</Text>
      </Box>

      {/* League list */}
      <Box flexDirection="column" marginTop={1}>
        {DASHBOARD_LEAGUES.map((league, index) => {
          const status = statuses.get(league)!;
          const isSelected = index === selectedIndex;
          const config = LEAGUES[league];

          return (
            <Box key={league}>
              <Text color={isSelected ? "white" : "gray"}>
                {isSelected ? "▸ " : "  "}
              </Text>
              <Text color="gray">[{index + 1}] </Text>
              <Text bold color={isSelected ? "white" : "gray"}>
                {config.name.padEnd(6)}
              </Text>
              <Text> </Text>
              <Text color={getStatusColor(status)}>
                {getStatusIndicator(status)}
              </Text>
              <Text> </Text>
              <Text color={getStatusColor(status)}>
                {getStatusText(status)}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderStyle="single" paddingX={1}>
        <Text color="gray">
          [1-8] Select │ [↑↓/jk] Navigate │ [Enter] Open │ [q] Quit
        </Text>
      </Box>
    </Box>
  );
}

interface LeagueViewProps {
  league: League;
  scoreboard: Scoreboard | null;
  onBack: () => void;
}

function LeagueView({ league, scoreboard, onBack }: LeagueViewProps) {
  const config = LEAGUES[league];
  const { exit } = useApp();

  useInput((input) => {
    if (input === "q") {
      exit();
    } else if (input === "b") {
      onBack();
    }
  });

  if (!scoreboard) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">No data available for {config.name}</Text>
        <Text color="gray">[b] Back │ [q] Quit</Text>
      </Box>
    );
  }

  const liveGames = scoreboard.games.filter((g) => g.status === "live");
  const scheduledGames = scoreboard.games.filter(
    (g) => g.status === "scheduled"
  );
  const finalGames = scoreboard.games.filter((g) => g.status === "final");

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="double" paddingX={2}>
        <Text bold color="green">
          {config.fullName}
        </Text>
      </Box>

      {/* Live Games */}
      {liveGames.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="green">
            ═══ ● LIVE ({liveGames.length}) ═══
          </Text>
          {liveGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </Box>
      )}

      {/* Scheduled Games */}
      {scheduledGames.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="yellow">
            ═══ ◈ SCHEDULED ({scheduledGames.length}) ═══
          </Text>
          {scheduledGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </Box>
      )}

      {/* Final Games */}
      {finalGames.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="gray">
            ═══ ◇ FINAL ({finalGames.length}) ═══
          </Text>
          {finalGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </Box>
      )}

      {/* No games */}
      {scoreboard.games.length === 0 && (
        <Box marginTop={1}>
          <Text color="gray">No games scheduled for today</Text>
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1} borderStyle="single" paddingX={1}>
        <Text color="gray">[b] Back │ [q] Quit</Text>
      </Box>
    </Box>
  );
}

interface GameCardProps {
  game: import("@ascii-scores/core").Game;
}

function GameCard({ game }: GameCardProps) {
  const isLive = game.status === "live";
  const isFinal = game.status === "final";
  const homeWinning = game.homeScore > game.awayScore;
  const awayWinning = game.awayScore > game.homeScore;

  // Border style based on status
  const borderStyle = isLive ? "bold" : isFinal ? "single" : "single";

  // Status text
  let statusText = "";
  if (isLive && game.detail) {
    statusText = game.detail;
  } else if (isFinal) {
    statusText = game.detail || "FINAL";
  } else {
    statusText = game.startTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <Box
      flexDirection="column"
      borderStyle={borderStyle}
      borderColor={isLive ? "green" : isFinal ? "gray" : "yellow"}
      paddingX={1}
      marginY={0}
      width={30}
    >
      {/* Status line */}
      <Box>
        <Text color={isLive ? "green" : isFinal ? "gray" : "yellow"}>
          {isLive ? "● " : ""}
          {statusText}
        </Text>
      </Box>

      {/* Away team */}
      <Box>
        <Text color={awayWinning && isFinal ? "green" : undefined}>
          {game.awayTeam.abbreviation.padEnd(4)}
        </Text>
        <Text> </Text>
        <Text bold color={awayWinning && isFinal ? "green" : undefined}>
          {game.awayScore}
        </Text>
        {awayWinning && isFinal && <Text color="green"> ◄</Text>}
      </Box>

      {/* Home team */}
      <Box>
        <Text color={homeWinning && isFinal ? "green" : undefined}>
          {game.homeTeam.abbreviation.padEnd(4)}
        </Text>
        <Text> </Text>
        <Text bold color={homeWinning && isFinal ? "green" : undefined}>
          {game.homeScore}
        </Text>
        {homeWinning && isFinal && <Text color="green"> ◄</Text>}
      </Box>
    </Box>
  );
}

export function App() {
  return <Dashboard />;
}
