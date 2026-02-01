import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Changelog",
  description: "View the complete history of changes and updates to ASCII Scores.",
};

interface ChangelogEntry {
  version: string;
  changes: {
    type: "feat" | "fix" | "refactor" | "chore" | "docs" | "style" | "perf" | "revert";
    description: string;
  }[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.18.0",
    changes: [
      { type: "feat", description: "Add league standings pages for all ESPN sports" },
      { type: "feat", description: "Display division/conference standings with ASCII tables" },
      { type: "feat", description: "Add standings link to league score pages" },
    ],
  },
  {
    version: "0.17.0",
    changes: [
      { type: "feat", description: "Sort leagues by season status and popularity" },
      { type: "feat", description: "Add separate 'In Season' and 'Off-Season' sections on homepage" },
      { type: "feat", description: "Add season dates and popularity rankings to league configuration" },
    ],
  },
  {
    version: "0.16.0",
    changes: [
      { type: "feat", description: "Add English Premier League (EPL) support" },
      { type: "refactor", description: "Sort leagues alphabetically in navigation and homepage" },
    ],
  },
  {
    version: "0.15.0",
    changes: [
      { type: "feat", description: "Add changelog page with full history of changes" },
    ],
  },
  {
    version: "0.14.0",
    changes: [
      { type: "feat", description: "Add countdown to next auto-refresh in sync status" },
      { type: "fix", description: "Display last synced time in user's local timezone" },
    ],
  },
  {
    version: "0.13.1",
    changes: [
      { type: "fix", description: "Pad ASCII art lines to equal length for consistent rendering" },
      { type: "revert", description: "Remove Fira Code web font - made rendering worse" },
    ],
  },
  {
    version: "0.13.0",
    changes: [
      { type: "feat", description: "Add NCAA men's and women's basketball support" },
      { type: "feat", description: "Add ASCII block letters for NCAAM and NCAAW leagues" },
      { type: "fix", description: "Add college basketball to mobile navigation" },
      { type: "fix", description: "Only show top 25 rankings for college basketball" },
      { type: "fix", description: "Use NBA stats format for college basketball game cards" },
    ],
  },
  {
    version: "0.12.1",
    changes: [
      { type: "feat", description: "Add accessible stat definitions with abbr elements" },
      { type: "fix", description: "Restore NHL, NFL, NBA block letters styling" },
    ],
  },
  {
    version: "0.12.0",
    changes: [
      { type: "feat", description: "Replace sport icons with ASCII block letter league names" },
      { type: "feat", description: "Implement large ASCII league icons on homepage" },
    ],
  },
  {
    version: "0.11.0",
    changes: [
      { type: "feat", description: "Add team records to game cards" },
      { type: "feat", description: "Update NHL game stats to show G, A, SV%" },
      { type: "feat", description: "Update NBA live stats and scheduled game venue display" },
      { type: "feat", description: "Update NBA final game stats to show shooting percentages" },
      { type: "fix", description: "Align period scores borders with other card rows" },
    ],
  },
  {
    version: "0.10.0",
    changes: [
      { type: "fix", description: "Display scheduled game times in user's local timezone" },
    ],
  },
  {
    version: "0.9.0",
    changes: [
      { type: "feat", description: "Add PGA to navigation and enable full-width layout for PGA/F1" },
    ],
  },
  {
    version: "0.8.0",
    changes: [
      { type: "feat", description: "Add race weekend navigation for F1" },
      { type: "feat", description: "Cache F1 historical races and add date navigation" },
      { type: "feat", description: "Cache historical scores indefinitely to reduce API calls" },
    ],
  },
  {
    version: "0.7.0",
    changes: [
      { type: "feat", description: "Implement comprehensive SEO best practices" },
      { type: "feat", description: "Improve golf leaderboard with round tabs and better formatting" },
      { type: "feat", description: "Add PGA Tour golf support" },
      { type: "fix", description: "Improve PGA API with multiple endpoint fallbacks" },
    ],
  },
  {
    version: "0.6.0",
    changes: [
      { type: "fix", description: "Comprehensive accessibility improvements for WCAG 2.1 AA compliance" },
    ],
  },
  {
    version: "0.5.0",
    changes: [
      { type: "refactor", description: "Convert Navigation to server component with minimal client boundary" },
    ],
  },
  {
    version: "0.4.0",
    changes: [
      { type: "feat", description: "Add period/quarter/inning score breakdowns to game cards" },
      { type: "feat", description: "Add game statistics and update README examples" },
      { type: "style", description: "Simplify CRT effects for cleaner ASCII aesthetic" },
    ],
  },
  {
    version: "0.3.0",
    changes: [
      { type: "feat", description: "Add light theme with system/dark/light selector" },
      { type: "fix", description: "Use theme-aware colors for cards, shadows, and patterns" },
      { type: "fix", description: "Show theme selector on mobile screens" },
    ],
  },
  {
    version: "0.2.0",
    changes: [
      { type: "feat", description: "Add smart date navigation that skips to days with games" },
      { type: "feat", description: "Add date navigation for viewing past and upcoming scores" },
      { type: "fix", description: "Make scoreboard cards responsive with flexible alignment" },
    ],
  },
  {
    version: "0.1.0",
    changes: [
      { type: "feat", description: "Enhance ASCII art styling with retro CRT terminal aesthetic" },
      { type: "feat", description: "Adopt Vercel React best practices" },
      { type: "fix", description: "Add mobile hamburger menu to navigation" },
      { type: "fix", description: "Improve mobile responsive layout to prevent horizontal scrolling" },
      { type: "feat", description: "Scaffold Next.js 16 application structure" },
    ],
  },
];

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
            {CHANGELOG.map((entry) => (
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
