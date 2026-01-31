import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  NHL_OPTIONS,
  NFL_OPTIONS,
  NBA_OPTIONS,
  MLB_OPTIONS,
  MLS_OPTIONS,
  F1_OPTIONS,
  PGA_OPTIONS,
} from "@/components/ascii/LeagueIconOptions";

function IconGrid({
  title,
  options,
  color,
}: {
  title: string;
  options: Record<string, string>;
  color: string;
}) {
  return (
    <section className="mb-12">
      <h2 className={`text-${color} text-2xl font-mono mb-6 text-center`}>
        {"═══ "}{title}{" ═══"}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Object.entries(options).map(([name, icon]) => (
          <div
            key={name}
            className="retro-card p-6 text-center font-mono"
          >
            {/* Card border top */}
            <div className="text-terminal-border text-xs mb-2">
              ╔═══════════╗
            </div>

            {/* Icon display */}
            <pre className="text-terminal-fg text-sm leading-tight inline-block min-h-[4rem] flex items-center justify-center">
              {icon.trim()}
            </pre>

            {/* Card border bottom */}
            <div className="text-terminal-border text-xs mt-2 mb-3">
              ╚═══════════╝
            </div>

            {/* Option name */}
            <p className={`text-${color} text-sm font-bold`}>
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PreviewIconsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 matrix-bg">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-terminal-cyan text-3xl font-mono mb-4">
              ╔══════════════════════════════╗
              <br />
              ║ LEAGUE ICON OPTIONS PREVIEW ║
              <br />
              ╚══════════════════════════════╝
            </h1>
            <p className="text-terminal-muted font-mono text-sm">
              Select your preferred ASCII icon for each league
            </p>
          </div>

          <IconGrid title="NHL - Hockey" options={NHL_OPTIONS} color="terminal-blue" />
          <IconGrid title="NFL - Football" options={NFL_OPTIONS} color="terminal-green" />
          <IconGrid title="NBA - Basketball" options={NBA_OPTIONS} color="terminal-red" />
          <IconGrid title="MLB - Baseball" options={MLB_OPTIONS} color="terminal-blue" />
          <IconGrid title="MLS - Soccer" options={MLS_OPTIONS} color="terminal-green" />
          <IconGrid title="F1 - Formula 1" options={F1_OPTIONS} color="terminal-red" />
          <IconGrid title="PGA - Golf" options={PGA_OPTIONS} color="terminal-green" />
        </div>
      </main>
      <Footer />
    </>
  );
}
