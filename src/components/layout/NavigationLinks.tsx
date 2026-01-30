import Link from "next/link";
import { LEAGUES, type League } from "@/lib/types";

const LEAGUE_ORDER: League[] = ["nhl", "nfl", "nba", "mlb", "mls", "f1", "pga"];

interface NavigationLinksProps {
  activeLeague?: string;
  variant?: "desktop" | "mobile";
  onLinkClick?: () => void;
}

/**
 * Server component that renders navigation links for leagues.
 * Active state is determined by the activeLeague prop passed from the server,
 * eliminating the need for usePathname() on the client.
 */
export function NavigationLinks({
  activeLeague,
  variant = "desktop",
  onLinkClick,
}: NavigationLinksProps) {
  const isDesktop = variant === "desktop";

  return (
    <ul
      className={
        isDesktop
          ? "hidden md:flex gap-1 font-mono text-sm"
          : "md:hidden absolute right-4 top-16 z-50 bg-terminal-bg border border-terminal-border font-mono text-sm"
      }
      id={isDesktop ? undefined : "mobile-menu"}
    >
      {LEAGUE_ORDER.map((leagueId) => {
        const league = LEAGUES[leagueId];
        const isActive = activeLeague === leagueId;

        return (
          <li key={leagueId}>
            <Link
              href={`/${leagueId}`}
              className={
                isDesktop
                  ? `px-3 py-1 transition-colors ${
                      isActive
                        ? "bg-terminal-fg text-terminal-bg"
                        : "text-terminal-muted hover:text-terminal-fg"
                    }`
                  : `block px-4 py-2 transition-colors ${
                      isActive
                        ? "bg-terminal-fg text-terminal-bg"
                        : "text-terminal-muted hover:text-terminal-fg hover:bg-terminal-border/20"
                    }`
              }
              aria-current={isActive ? "page" : undefined}
              onClick={onLinkClick}
            >
              [{league.name}]
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
