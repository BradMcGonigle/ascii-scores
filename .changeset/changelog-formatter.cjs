/**
 * Custom changelog formatter for changesets.
 *
 * Produces clean entries without commit SHAs:
 *   - feat: Add dark mode toggle
 *
 * Instead of the default format:
 *   - abc1234: feat: Add dark mode toggle
 */

async function getReleaseLine(changeset, _type) {
  const [firstLine, ...futureLines] = changeset.summary
    .split("\n")
    .map((l) => l.trimEnd());

  let returnVal = `- ${firstLine}`;

  if (futureLines.length > 0) {
    returnVal += `\n${futureLines.map((l) => `  ${l}`).join("\n")}`;
  }

  return returnVal;
}

async function getDependencyReleaseLine(_changesets, dependenciesUpdated) {
  if (dependenciesUpdated.length === 0) return "";

  const updatedDependenciesList = dependenciesUpdated.map(
    (dependency) => `  - ${dependency.name}@${dependency.newVersion}`
  );

  return ["- Updated dependencies", ...updatedDependenciesList].join("\n");
}

module.exports = {
  default: {
    getReleaseLine,
    getDependencyReleaseLine,
  },
};
