import type { F1Session } from "@/lib/types";
import { getStatusClass, getStatusText, padString, formatTime } from "@/lib/utils/format";

interface F1SessionsListProps {
  sessions: F1Session[];
  lastUpdated: Date;
}

/**
 * Displays multiple F1 sessions for a single day in ASCII table format
 * Used for race weekends where there may be Practice, Qualifying, and Race sessions
 */
export function F1SessionsList({ sessions, lastUpdated }: F1SessionsListProps) {
  if (sessions.length === 0) {
    return (
      <div className="overflow-x-auto">
        <div className="font-mono text-center py-8 inline-block min-w-full">
          <div className="text-terminal-border" aria-hidden="true">
            ╔═══════════════════════════════════════════════════════╗
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">║</span>
            <span className="text-terminal-muted px-4">
              {"  "}No F1 sessions on this date{"  "}
            </span>
            <span className="text-terminal-border" aria-hidden="true">║</span>
          </div>
          <div className="text-terminal-border" aria-hidden="true">
            ╚═══════════════════════════════════════════════════════╝
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sessions.map((session) => (
        <F1SessionCard key={session.id} session={session} />
      ))}

      <div className="font-mono text-terminal-muted text-sm text-center">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
}

interface F1SessionCardProps {
  session: F1Session;
}

/**
 * Individual F1 session display card
 */
function F1SessionCard({ session }: F1SessionCardProps) {
  const statusClass = getStatusClass(session.status);
  const sessionTypeLabel = getSessionTypeLabel(session.type);

  return (
    <div className="font-mono overflow-x-auto">
      <div className="w-full">
        {/* Session header */}
        <div className="mb-2">
          <div className="text-terminal-border" aria-hidden="true">
            ╔══════════════════════════════════════════════════════════╗
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">║</span>
            <span className="text-terminal-fg px-2">
              {padString(`${session.circuitName} - ${session.country}`, 56)}
            </span>
            <span className="text-terminal-border" aria-hidden="true">║</span>
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">║</span>
            <span className="text-terminal-cyan px-2">
              {padString(`${sessionTypeLabel} • ${formatTime(session.startTime)}`, 56)}
            </span>
            <span className="text-terminal-border" aria-hidden="true">║</span>
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">║</span>
            <span className={`${statusClass} px-2`}>
              {padString(getStatusText(session.status), 56)}
            </span>
            <span className="text-terminal-border" aria-hidden="true">║</span>
          </div>
          <div className="text-terminal-border" aria-hidden="true">
            ╠══════════════════════════════════════════════════════════╣
          </div>
        </div>

        {/* Standings table */}
        <div role="table" aria-label={`${sessionTypeLabel} standings`}>
          {/* Header */}
          <div className="text-terminal-cyan" role="row">
            <span className="text-terminal-border" aria-hidden="true">║</span>
            <span role="columnheader">{padString("POS", 4)}</span>
            <span className="text-terminal-border" aria-hidden="true">│</span>
            <span role="columnheader">{padString("DRIVER", 6)}</span>
            <span className="text-terminal-border" aria-hidden="true">│</span>
            <span role="columnheader">{padString("TEAM", 25)}</span>
            <span className="text-terminal-border" aria-hidden="true">│</span>
            <span role="columnheader">{padString("GAP", 10)}</span>
            <span className="text-terminal-border" aria-hidden="true">│</span>
            <span role="columnheader">{padString("STATUS", 6)}</span>
            <span className="text-terminal-border" aria-hidden="true">║</span>
          </div>
          <div className="text-terminal-border" aria-hidden="true">
            ╠════╪══════╪═════════════════════════╪══════════╪══════╣
          </div>

          {/* Driver rows */}
          {session.drivers.length > 0 ? (
            session.drivers.map((driver) => {
              const positionLabel = driver.position <= 3 ? ` (podium position)` : "";
              const statusLabel =
                driver.status === "pit"
                  ? " - In pit lane"
                  : driver.status === "out"
                  ? " - Out of session"
                  : " - On track";

              return (
                <div key={driver.driverNumber} role="row">
                  <span className="text-terminal-border" aria-hidden="true">║</span>
                  <span
                    role="cell"
                    className={driver.position <= 3 ? "text-terminal-green" : ""}
                  >
                    <span className="sr-only">
                      Position {driver.position}
                      {positionLabel}
                    </span>
                    <span aria-hidden="true">
                      {padString(driver.position.toString(), 4, "right")}
                    </span>
                  </span>
                  <span className="text-terminal-border" aria-hidden="true">│</span>
                  <span role="cell">{padString(driver.driverCode, 6)}</span>
                  <span className="text-terminal-border" aria-hidden="true">│</span>
                  <span role="cell" className="text-terminal-muted">
                    {padString(driver.teamName, 25)}
                  </span>
                  <span className="text-terminal-border" aria-hidden="true">│</span>
                  <span role="cell">{padString(driver.gap ?? "-", 10)}</span>
                  <span className="text-terminal-border" aria-hidden="true">│</span>
                  <span
                    role="cell"
                    className={
                      driver.status === "pit"
                        ? "text-terminal-yellow"
                        : driver.status === "out"
                        ? "text-terminal-red"
                        : ""
                    }
                  >
                    <span className="sr-only">{statusLabel}</span>
                    <span aria-hidden="true">
                      {padString(driver.status.toUpperCase(), 6)}
                    </span>
                  </span>
                  <span className="text-terminal-border" aria-hidden="true">║</span>
                </div>
              );
            })
          ) : (
            <div role="row" className="text-terminal-muted">
              <span className="text-terminal-border" aria-hidden="true">║</span>
              <span role="cell">
                {padString("No position data available", 56, "center")}
              </span>
              <span className="text-terminal-border" aria-hidden="true">║</span>
            </div>
          )}

          {/* Bottom border */}
          <div className="text-terminal-border" aria-hidden="true">
            ╚══════════════════════════════════════════════════════════╝
          </div>
        </div>
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
