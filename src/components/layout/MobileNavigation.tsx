"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { LEAGUES, getSortedLeagues } from "@/lib/types";

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
  const menuRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sortedLeagues = useMemo(() => getSortedLeagues(), []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Handle keyboard events for accessibility
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      // Focus trap within menu
      if (event.key === "Tab" && menuRef.current) {
        const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }

    // Close menu when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    // Focus first menu item when opening
    const firstLink = menuRef.current?.querySelector<HTMLElement>('a');
    firstLink?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        ref={buttonRef}
        type="button"
        className="md:hidden font-mono text-terminal-fg px-2 py-1 border border-terminal-border"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        <span aria-hidden="true">{isOpen ? "[X]" : "[=]"}</span>
      </button>

      {/* Mobile menu */}
      {isOpen && (
        <ul
          ref={menuRef}
          id="mobile-menu"
          role="menu"
          aria-label="League navigation"
          className="md:hidden absolute right-4 top-16 z-50 bg-terminal-bg border border-terminal-border font-mono text-sm"
        >
          {sortedLeagues.map((leagueId) => {
            const league = LEAGUES[leagueId];
            const isActive = activeLeague === leagueId;

            return (
              <li key={leagueId} role="none">
                <Link
                  href={`/${leagueId}`}
                  role="menuitem"
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
