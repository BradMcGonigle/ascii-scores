"use client";

import { useState } from "react";
import type { F1Session } from "@/lib/types";
import { getStatusClass, getStatusText, formatTime } from "@/lib/utils/format";

interface F1SessionsListProps {
  sessions: F1Session[];
  lastUpdated: Date;
}

/** Session priority for default selection (higher = more important) */
function getSessionPriority(session: F1Session): number {
  // Check session.name first (from API), then fall back to session.type
  const name = session.name?.toLowerCase() ?? "";
  const type = session.type;

  if (name.includes("race") || type === "race") return 5;
  if (name.includes("sprint") || type === "sprint") return 4;
  if (name.includes("qualifying") || type === "qualifying") return 3;
  if (name.includes("practice 3") || type === "practice_3") return 2;
  if (name.includes("practice 2") || type === "practice_2") return 1;
  if (name.includes("practice 1") || type === "practice_1") return 0;
  return -1;
}

/**
 * Displays F1 sessions with a tabbed interface to switch between them
 */
export function F1SessionsList({ sessions, lastUpdated }: F1SessionsListProps) {
  // Sort sessions by priority and default to the most important one
  const sortedSessions = [...sessions].sort(
    (a, b) => getSessionPriority(b) - getSessionPriority(a)
  );
  const defaultSession = sortedSessions[0]?.id ?? "";

  const [selectedSessionId, setSelectedSessionId] = useState(defaultSession);

  if (sessions.length === 0) {
    return (
      <div className="font-mono text-center py-8">
        <div className="text-terminal-muted">No F1 sessions on this date</div>
      </div>
    );
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? sessions[0];

  return (
    <div className="font-mono">
      {/* Session tabs */}
      <div className="flex flex-wrap gap-1 mb-4 border-b border-terminal-border pb-2">
        {sessions.map((session) => {
          const isSelected = session.id === selectedSessionId;
          // Use session.name from the API which is the actual session name
          const label = session.name || getSessionTypeLabel(session.type);

          return (
            <button
              key={session.id}
              onClick={() => setSelectedSessionId(session.id)}
              className={`px-3 py-1 text-xs sm:text-sm transition-colors ${
                isSelected
                  ? "bg-terminal-cyan text-terminal-bg font-bold"
                  : "text-terminal-muted hover:text-terminal-fg hover:bg-terminal-border/20"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Selected session content */}
      <F1SessionTable session={selectedSession} />

      <div className="text-terminal-muted text-sm text-center pt-4">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
}

interface F1SessionTableProps {
  session: F1Session;
}

/**
 * F1 session standings table
 * Shows different columns based on session type (matching ESPN layout):
 * - Race: POS, DRIVER, TEAM, RACE TIME, LAPS, PITS, FASTEST LAPS
 * - Sprint: POS, DRIVER, TEAM, RACE TIME, LAPS, FASTEST LAPS (no PITS)
 * - Qualifying/Sprint Shootout: POS, DRIVER, TEAM, TIME, LAPS
 * - Practice: POS, DRIVER, TEAM, TIME, LAPS
 */
function F1SessionTable({ session }: F1SessionTableProps) {
  const statusClass = getStatusClass(session.status);
  const sessionLabel = session.name || getSessionTypeLabel(session.type);

  // Determine session type for column layout
  const sessionName = session.name?.toLowerCase() ?? "";
  const isRace = sessionName.includes("race") && !sessionName.includes("sprint");
  const isSprint = sessionName.includes("sprint") && !sessionName.includes("shootout");
  const isPractice = sessionName.includes("practice") || sessionName.includes("fp");

  // Column count for empty state colspan
  const getColumnCount = () => {
    if (isRace) return 7; // POS, DRIVER, TEAM, TIME, LAPS, PITS, FASTEST
    if (isSprint) return 6; // POS, DRIVER, TEAM, TIME, LAPS, FASTEST
    return 5; // POS, DRIVER, TEAM, TIME, LAPS
  };

  return (
    <div>
      {/* Session header */}
      <div className="mb-3">
        <div className="text-terminal-fg font-bold text-lg">
          {session.circuitName} - {session.country}
        </div>
        <div className="text-terminal-cyan text-sm">
          {sessionLabel} • {formatTime(session.startTime)}
        </div>
        <div className={`${statusClass} text-sm`}>{getStatusText(session.status)}</div>
      </div>

      {/* Standings table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm" aria-label={`${sessionLabel} standings`}>
          <thead>
            <tr className="text-terminal-cyan border-b border-terminal-border">
              <th className="text-center py-1 px-2 whitespace-nowrap w-10">POS</th>
              <th className="text-left py-1 px-2 whitespace-nowrap sticky left-0 bg-terminal-bg z-10">
                DRIVER
              </th>
              <th className="text-left py-1 px-2 whitespace-nowrap hidden sm:table-cell">TEAM</th>
              <th className="text-right py-1 px-2 whitespace-nowrap">
                {isRace || isSprint ? "RACE TIME" : isPractice ? "BEST TIME" : "TIME"}
              </th>
              <th className="text-center py-1 px-2 whitespace-nowrap">LAPS</th>
              {isRace && <th className="text-center py-1 px-2 whitespace-nowrap">PITS</th>}
              {(isRace || isSprint) && (
                <th className="text-right py-1 px-2 whitespace-nowrap">FASTEST LAP</th>
              )}
            </tr>
          </thead>
          <tbody>
            {session.drivers.length > 0 ? (
              session.drivers.map((driver, index) => {
                const isEvenRow = index % 2 === 0;
                const rowBg = isEvenRow ? "bg-terminal-bg" : "bg-terminal-zebra";
                const driverDisplay = driver.driverName || driver.driverCode;

                // Format time display - leader shows actual time, others show gap
                const timeDisplay = driver.position === 1
                  ? driver.fastestLap ?? "-"
                  : driver.gap ?? "-";

                return (
                  <tr
                    key={driver.driverNumber}
                    className={`border-b border-terminal-border/30 ${rowBg}`}
                  >
                    <td
                      className={`text-center py-1 px-2 ${
                        driver.position <= 3 ? "text-terminal-green font-bold" : "text-terminal-fg"
                      }`}
                    >
                      <span className="sr-only">Position </span>
                      {driver.position}
                      {driver.position <= 3 && <span className="sr-only"> (podium)</span>}
                    </td>
                    <td className={`py-1 px-2 whitespace-nowrap sticky left-0 ${rowBg} z-10`}>
                      <span className="text-terminal-fg font-medium">{driverDisplay}</span>
                    </td>
                    <td className="py-1 px-2 whitespace-nowrap text-terminal-muted hidden sm:table-cell">
                      {driver.teamName}
                    </td>
                    <td className="text-right py-1 px-2 whitespace-nowrap text-terminal-fg">
                      {timeDisplay}
                    </td>
                    <td className="text-center py-1 px-2 whitespace-nowrap text-terminal-fg">
                      {driver.lapsCompleted ?? "-"}
                    </td>
                    {isRace && (
                      <td className="text-center py-1 px-2 whitespace-nowrap text-terminal-fg">
                        {driver.pitStops ?? 0}
                      </td>
                    )}
                    {(isRace || isSprint) && (
                      <td className="text-right py-1 px-2 whitespace-nowrap text-terminal-muted">
                        {driver.fastestLap ?? "--"}
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={getColumnCount()} className="text-center py-4 text-terminal-muted">
                  No position data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Convert session type to human-readable label
 */
function getSessionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    practice_1: "Practice 1",
    practice_2: "Practice 2",
    practice_3: "Practice 3",
    qualifying: "Qualifying",
    sprint: "Sprint",
    race: "Race",
  };
  return labels[type] ?? type;
}
