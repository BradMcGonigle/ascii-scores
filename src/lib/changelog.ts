import fs from "fs";
import path from "path";

export interface ChangelogChange {
  type: "feat" | "fix" | "refactor" | "chore" | "docs" | "style" | "perf" | "revert";
  description: string;
  details?: string[];
}

export interface ChangelogEntry {
  version: string;
  changes: ChangelogChange[];
}

const TYPE_PATTERN = /^(feat|fix|refactor|chore|docs|style|perf|revert):\s*/;

function parseChangeType(line: string): ChangelogChange {
  const match = line.match(TYPE_PATTERN);
  if (match) {
    return {
      type: match[1] as ChangelogChange["type"],
      description: line.replace(TYPE_PATTERN, ""),
    };
  }
  // Default to "feat" for entries without a type prefix
  return {
    type: "feat",
    description: line,
  };
}

export function parseChangelog(): ChangelogEntry[] {
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");

  if (!fs.existsSync(changelogPath)) {
    return [];
  }

  const content = fs.readFileSync(changelogPath, "utf-8");
  const lines = content.split("\n");

  const entries: ChangelogEntry[] = [];
  let currentVersion: string | null = null;
  let currentChanges: ChangelogChange[] = [];
  let currentChange: ChangelogChange | null = null;

  for (const line of lines) {
    // Match version headers like "## 0.21.0"
    const versionMatch = line.match(/^## (\d+\.\d+\.\d+)/);
    if (versionMatch) {
      // Save previous version if exists
      if (currentVersion) {
        entries.push({
          version: currentVersion,
          changes: currentChanges,
        });
      }
      currentVersion = versionMatch[1];
      currentChanges = [];
      currentChange = null;
      continue;
    }

    // Match change items like "- feat: description"
    const changeMatch = line.match(/^- (.+)$/);
    if (changeMatch && currentVersion) {
      currentChange = parseChangeType(changeMatch[1]);
      currentChanges.push(currentChange);
      continue;
    }

    // Collect indented detail lines under the current change
    if (currentChange && currentVersion && line.match(/^ {2,}/)) {
      const detailLine = line.replace(/^ {2,}/, "");
      if (!currentChange.details) {
        currentChange.details = [];
      }
      currentChange.details.push(detailLine);
    } else if (line.trim() !== "" && !line.match(/^###/)) {
      // Non-indented, non-empty, non-section-header line ends the current change
      currentChange = null;
    }
  }

  // Don't forget the last version
  if (currentVersion && currentChanges.length > 0) {
    entries.push({
      version: currentVersion,
      changes: currentChanges,
    });
  }

  return entries;
}
