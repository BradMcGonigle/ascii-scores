export default function LeagueLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-center min-h-[50vh]">
        <pre className="font-mono">
          <span className="text-terminal-border">{"╔═════════════════════════════════╗\n║"}</span>
          <span className="text-terminal-cyan animate-pulse">{"        Loading scores...        "}</span>
          <span className="text-terminal-border">{"║\n╚═════════════════════════════════╝"}</span>
        </pre>
      </div>
    </div>
  );
}
