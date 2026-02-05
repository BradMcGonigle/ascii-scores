import type { F1Standings } from "@/lib/types";
import { getStatusClass, getStatusText } from "@/lib/utils/format";

interface F1StandingsProps {
  standings: F1Standings;
}

/**
 * Displays F1 session standings in a responsive table format
 * Shows different columns based on session type (matching ESPN layout)
 */
export function F1StandingsDisplay({ standings }: F1StandingsProps) {
  const { session } = standings;
  const statusClass = getStatusClass(session.status);

  // Determine session type for column layout
  const sessionName = session.name?.toLowerCase() ?? "";
  const isRace = sessionName.includes("race") && !sessionName.includes("sprint");
  const isSprint = sessionName.includes("sprint") && !sessionName.includes("shootout");
  const isPractice = sessionName.includes("practice") || sessionName.includes("fp");

  const getColumnCount = () => {
    if (isRace) return 7;
    if (isSprint) return 6;
    return 5;
  };

  return (
    <div className="font-mono">
      {/* Session header */}
      <div className="mb-3 border-b border-terminal-border pb-2">
        <div className="text-terminal-fg font-bold">
          {session.name} - {session.circuitName}
        </div>
        <div className={`${statusClass} text-sm`}>{getStatusText(session.status)}</div>
      </div>

      {/* Standings table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm" aria-label="F1 standings">
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

                const timeDisplay =
                  driver.position === 1 ? driver.fastestLap ?? "-" : driver.gap ?? "-";

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

      {/* Last updated */}
      <div className="text-terminal-muted text-sm text-center pt-4">
        Last updated: {standings.lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
}
