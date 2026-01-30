"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEAGUES, type League } from "@/lib/types";

const LEAGUE_ORDER: League[] = ["nhl", "nfl", "nba", "mlb", "mls", "f1"];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="League navigation">
      <ul className="flex gap-1 font-mono text-sm">
        {LEAGUE_ORDER.map((leagueId) => {
          const league = LEAGUES[leagueId];
          const isActive = pathname === `/${leagueId}`;

          return (
            <li key={leagueId}>
              <Link
                href={`/${leagueId}`}
                className={`
                  px-3 py-1 transition-colors
                  ${
                    isActive
                      ? "bg-terminal-fg text-terminal-bg"
                      : "text-terminal-muted hover:text-terminal-fg"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
              >
                [{league.name}]
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
