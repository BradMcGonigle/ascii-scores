export default function LeagueLoading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="font-mono text-center">
        <div className="text-terminal-border" aria-hidden="true">
          ╔════════════════════════════════╗
        </div>
        <div>
          <span className="text-terminal-border" aria-hidden="true">║</span>
          <span className="text-terminal-cyan px-4 animate-pulse">
            {"     "}Loading scores...{"     "}
          </span>
          <span className="text-terminal-border" aria-hidden="true">║</span>
        </div>
        <div className="text-terminal-border" aria-hidden="true">
          ╚════════════════════════════════╝
        </div>
      </div>
    </div>
  );
}
