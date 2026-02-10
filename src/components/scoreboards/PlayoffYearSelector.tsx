"use client";

import Link from "next/link";

interface PlayoffYearSelectorProps {
  league: string;
  currentYear: number;
}

/**
 * Minimum year for NFL expanded playoffs (14 teams, 7 per conference)
 */
const MIN_YEAR = 2020;

/**
 * Year navigation for viewing past playoff brackets.
 * NFL expanded to 14 teams in the 2020 season.
 */
export function PlayoffYearSelector({
  league,
  currentYear,
}: PlayoffYearSelectorProps) {
  const now = new Date();
  const maxYear =
    now.getMonth() + 1 <= 7 ? now.getFullYear() - 1 : now.getFullYear();

  const years: number[] = [];
  for (let y = maxYear; y >= MIN_YEAR; y--) {
    years.push(y);
  }

  return (
    <nav
      className="font-mono text-xs flex flex-wrap items-center gap-1 mb-6"
      aria-label="Playoff season selector"
    >
      <span className="text-terminal-muted mr-1">SEASON:</span>
      {years.map((year) => {
        const isActive = year === currentYear;
        const label = `${year}-${String(year + 1).slice(2)}`;

        if (isActive) {
          return (
            <span
              key={year}
              className="px-2 py-0.5 text-terminal-green font-bold border border-terminal-green/50"
              aria-current="true"
            >
              [{label}]
            </span>
          );
        }

        return (
          <Link
            key={year}
            href={`/${league}/playoffs?year=${year}`}
            className="px-2 py-0.5 text-terminal-muted hover:text-terminal-green transition-colors"
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
