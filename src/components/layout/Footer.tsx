export function Footer() {
  return (
    <footer className="mt-auto border-t border-terminal-border bg-terminal-bg">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex flex-col items-center gap-2 text-sm text-terminal-muted font-mono">
          <p>
            Data provided by ESPN &amp; OpenF1 | Not affiliated with any sports league
          </p>
          <p className="text-terminal-border">
            ═══════════════════════════════════════════════════════════════
          </p>
          <p>
            <span className="text-terminal-green">[</span>
            ASCII Scores
            <span className="text-terminal-green">]</span>
            {" "}
            &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
