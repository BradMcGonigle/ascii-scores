import type { F1Standings } from "@/lib/types";
import { getStatusClass, getStatusText, padString } from "@/lib/utils/format";

interface F1StandingsProps {
  standings: F1Standings;
}

/**
 * Displays F1 session standings in ASCII table format
 */
export function F1StandingsDisplay({ standings }: F1StandingsProps) {
  const { session } = standings;
  const statusClass = getStatusClass(session.status);

  return (
    <div className="font-mono">
      {/* Session header */}
      <div className="mb-4">
        <div className="text-terminal-border" aria-hidden="true">
          ╔══════════════════════════════════════════════════════════╗
        </div>
        <div>
          <span className="text-terminal-border" aria-hidden="true">║</span>
          <span className="text-terminal-fg px-2">
            {padString(`${session.name} - ${session.circuitName}`, 56)}
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
      <div role="table" aria-label="F1 standings">
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
          session.drivers.map((driver) => (
            <div key={driver.driverNumber} role="row">
              <span className="text-terminal-border" aria-hidden="true">║</span>
              <span role="cell" className={driver.position <= 3 ? "text-terminal-green" : ""}>
                {padString(driver.position.toString(), 4, "right")}
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
                {padString(driver.status.toUpperCase(), 6)}
              </span>
              <span className="text-terminal-border" aria-hidden="true">║</span>
            </div>
          ))
        ) : (
          <div role="row" className="text-terminal-muted">
            <span className="text-terminal-border" aria-hidden="true">║</span>
            <span role="cell">{padString("No position data available", 56, "center")}</span>
            <span className="text-terminal-border" aria-hidden="true">║</span>
          </div>
        )}

        {/* Bottom border */}
        <div className="text-terminal-border" aria-hidden="true">
          ╚══════════════════════════════════════════════════════════╝
        </div>
      </div>

      {/* Last updated */}
      <div className="text-terminal-muted text-sm text-center pt-4">
        Last updated: {standings.lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
}
