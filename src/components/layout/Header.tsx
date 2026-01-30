import Link from "next/link";
import { AsciiLogoCompact, AsciiCursor } from "@/components/ascii";
import { Navigation } from "./Navigation";
import { ThemeSelector } from "./ThemeSelector";

interface HeaderProps {
  activeLeague?: string;
}

export function Header({ activeLeague }: HeaderProps) {
  return (
    <header className="border-b border-terminal-border bg-terminal-bg relative">
      {/* Terminal-style top bar */}
      <div className="bg-terminal-border/30 border-b border-terminal-border px-4 py-1 hidden sm:block">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-terminal-red">●</span>
            <span className="text-terminal-yellow">●</span>
            <span className="text-terminal-green">●</span>
            <span className="text-terminal-muted ml-2">ascii-scores — bash</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-terminal-muted">
            <ThemeSelector />
            <div>
              <span className="text-terminal-green">user@scores</span>
              <span className="text-terminal-muted">:</span>
              <span className="text-terminal-blue">~</span>
              <span className="text-terminal-muted">$</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main header content */}
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="group hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2">
              <span className="text-terminal-green font-mono hidden sm:inline">{">"}</span>
              <AsciiLogoCompact className="text-glow group-hover:glow-green transition-all" />
              <AsciiCursor variant="block" className="hidden sm:inline opacity-70" />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {/* Theme selector for mobile (hidden on sm+ where it shows in top bar) */}
            <div className="sm:hidden">
              <ThemeSelector />
            </div>
            <Navigation activeLeague={activeLeague} />
          </div>
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-terminal-green/50 to-transparent" />
    </header>
  );
}
