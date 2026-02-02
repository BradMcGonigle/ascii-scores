import Link from "next/link";
import { ThemeSelector } from "./ThemeSelector";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-terminal-border bg-terminal-bg relative overflow-visible">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-terminal-green/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* ASCII art decorative border */}
        <div className="text-terminal-border font-mono text-xs text-center mb-4 hidden sm:block" aria-hidden="true">
          ╔══════════════════════════════════════════════════════════════════════════════╗
        </div>

        <div className="flex flex-col items-center gap-3 text-sm text-terminal-muted font-mono">
          {/* Circuit pattern decoration */}
          <div className="text-terminal-border/50 text-xs hidden md:block" aria-hidden="true">
            ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-center">
            <span>
              <span className="text-terminal-cyan">DATA:</span> ESPN API + OpenF1
            </span>
            <span className="text-terminal-border">│</span>
            <span>
              <span className="text-terminal-yellow">STATUS:</span>
              <span className="text-terminal-green ml-1">● ONLINE</span>
            </span>
            <span className="text-terminal-border">│</span>
            <ThemeSelector />
          </div>

          {/* Main logo section */}
          <div className="flex items-center gap-2">
            <span className="text-terminal-border">╠</span>
            <span className="text-terminal-green glow-green">[</span>
            <span className="text-terminal-fg text-glow">ASCII SCORES</span>
            <span className="text-terminal-green glow-green">]</span>
            <span className="text-terminal-border">╣</span>
          </div>

          <p className="text-terminal-muted text-xs">
            <span className="text-terminal-border">{"// "}</span>
            Not affiliated with any sports league
            <span className="text-terminal-border">{" //"}</span>
          </p>

          <p className="text-xs flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <Link
              href="/changelog"
              className="text-terminal-fg hover:text-terminal-green transition-colors"
            >
              v0.20.0
            </Link>
            <span className="text-terminal-muted">•</span>
            <span className="text-terminal-muted">&copy; {new Date().getFullYear()}</span>
            <span className="text-terminal-muted">•</span>
            <span className="text-terminal-green">MADE WITH {"<"}3{">"}</span>
          </p>
        </div>

        {/* ASCII art decorative border */}
        <div className="text-terminal-border font-mono text-xs text-center mt-4 hidden sm:block" aria-hidden="true">
          ╚══════════════════════════════════════════════════════════════════════════════╝
        </div>
      </div>
    </footer>
  );
}
