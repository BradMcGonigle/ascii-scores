"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LEAGUES, type League } from "@/lib/types";

const LEAGUE_ORDER: League[] = ["nhl", "nfl", "nba", "mlb", "mls", "f1"];

export function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav aria-label="League navigation">
      {/* Mobile hamburger button */}
      <button
        type="button"
        className="md:hidden font-mono text-terminal-fg px-2 py-1 border border-terminal-border"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? "[X]" : "[=]"}
      </button>

      {/* Desktop navigation */}
      <ul className="hidden md:flex gap-1 font-mono text-sm">
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

      {/* Mobile menu */}
      {isOpen && (
        <ul
          id="mobile-menu"
          className="md:hidden absolute right-4 top-16 z-50 bg-terminal-bg border border-terminal-border font-mono text-sm"
        >
          {LEAGUE_ORDER.map((leagueId) => {
            const league = LEAGUES[leagueId];
            const isActive = pathname === `/${leagueId}`;

            return (
              <li key={leagueId}>
                <Link
                  href={`/${leagueId}`}
                  className={`
                    block px-4 py-2 transition-colors
                    ${
                      isActive
                        ? "bg-terminal-fg text-terminal-bg"
                        : "text-terminal-muted hover:text-terminal-fg hover:bg-terminal-border/20"
                    }
                  `}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                >
                  [{league.name}]
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
