import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { parseChangelog, type ChangelogEntry } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Changelog",
  description: "View the complete history of changes and updates to ASCII Scores.",
};

const TYPE_LABELS: Record<ChangelogEntry["changes"][0]["type"], { label: string; color: string }> = {
  feat: { label: "NEW", color: "text-terminal-green" },
  fix: { label: "FIX", color: "text-terminal-yellow" },
  refactor: { label: "REFACTOR", color: "text-terminal-cyan" },
  chore: { label: "CHORE", color: "text-terminal-muted" },
  docs: { label: "DOCS", color: "text-terminal-blue" },
  style: { label: "STYLE", color: "text-terminal-magenta" },
  perf: { label: "PERF", color: "text-terminal-blue" },
  revert: { label: "REVERT", color: "text-terminal-red" },
};

export default function ChangelogPage() {
  const changelog = parseChangelog();

  return (
    <>
      <Header />
      <main className="flex-1 matrix-bg">
        <div className="mx-auto max-w-4xl px-4 py-8">
          {/* Page header */}
          <div className="text-center mb-12">
            <div className="inline-block font-mono">
              <div className="text-terminal-border text-xs hidden sm:block" aria-hidden="true">
                ╔════════════════════════════════════════════════════════╗
              </div>
              <h1 className="text-terminal-fg text-2xl py-3 px-6">
                <span className="text-terminal-border">[</span>
                {" CHANGELOG "}
                <span className="text-terminal-border">]</span>
              </h1>
              <div className="text-terminal-border text-xs hidden sm:block" aria-hidden="true">
                ╚════════════════════════════════════════════════════════╝
              </div>
            </div>
            <p className="text-terminal-muted font-mono text-sm mt-4">
              <span className="text-terminal-green">{">"}</span>
              {" A complete history of updates and improvements"}
            </p>
          </div>

          {/* Legend */}
          <div className="mb-8 font-mono text-xs">
            <div className="retro-card p-4">
              <div className="text-terminal-muted mb-2">LEGEND:</div>
              <div className="flex flex-wrap gap-4">
                {Object.entries(TYPE_LABELS).map(([type, { label, color }]) => (
                  <span key={type} className="flex items-center gap-1">
                    <span className={`${color} font-bold`}>[{label}]</span>
                    <span className="text-terminal-muted">{type}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Changelog entries */}
          <div className="space-y-8">
            {changelog.map((entry) => (
              <article key={entry.version} className="font-mono">
                <div className="retro-card p-6">
                  {/* Version header */}
                  <h2 className="text-lg mb-4">
                    <span className="text-terminal-green">v{entry.version}</span>
                  </h2>

                  {/* Divider */}
                  <div className="text-terminal-border text-xs mb-4" aria-hidden="true">
                    ────────────────────────────────────────────────────
                  </div>

                  {/* Changes list */}
                  <ul className="space-y-2 text-sm">
                    {entry.changes.map((change) => {
                      const typeInfo = TYPE_LABELS[change.type];
                      return (
                        <li key={`${change.type}-${change.description}`} className="flex items-start gap-2">
                          <span className={`${typeInfo.color} font-bold shrink-0`}>
                            [{typeInfo.label}]
                          </span>
                          <span className="text-terminal-fg">{change.description}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          {/* Back to home link */}
          <div className="mt-12 text-center font-mono">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-terminal-muted hover:text-terminal-green transition-colors"
            >
              <span className="text-terminal-green">{"<"}</span>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
