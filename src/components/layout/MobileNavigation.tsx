"use client";

import { useState } from "react";
import Link from "next/link";
import { LEAGUES, type League } from "@/lib/types";

const LEAGUE_ORDER: League[] = ["nhl", "nfl", "nba", "mlb", "mls", "f1"];

interface MobileNavigationProps {
  activeLeague?: string;
}

/**
 * Client component for mobile navigation menu.
 * Only the mobile menu requires client-side interactivity for the toggle.
 * Active state is passed as a prop from the server, avoiding usePathname().
 */
export function MobileNavigation({ activeLeague }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
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

      {/* Mobile menu */}
      {isOpen && (
        <ul
          id="mobile-menu"
          className="md:hidden absolute right-4 top-16 z-50 bg-terminal-bg border border-terminal-border font-mono text-sm"
        >
          {LEAGUE_ORDER.map((leagueId) => {
            const league = LEAGUES[leagueId];
            const isActive = activeLeague === leagueId;

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
    </>
  );
}
