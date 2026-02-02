import Link from "next/link";
import { AsciiLogoCompact, AsciiCursor } from "@/components/ascii";
import { Navigation } from "./Navigation";

interface HeaderProps {
  activeLeague?: string;
}

export function Header({ activeLeague }: HeaderProps) {
  return (
    <header className="border-b border-terminal-border bg-terminal-bg relative">
      {/* Main header content */}
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="group hover:opacity-80 transition-opacity"
            aria-label="ASCII Scores - Go to homepage"
          >
            <div className="flex items-center gap-2">
              <span className="text-terminal-green font-mono hidden sm:inline" aria-hidden="true">{">"}</span>
              <AsciiLogoCompact className="text-glow group-hover:glow-green transition-all" />
              <AsciiCursor variant="block" className="hidden sm:inline opacity-70" />
            </div>
          </Link>
          <Navigation activeLeague={activeLeague} />
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-terminal-green/50 to-transparent" />
    </header>
  );
}
