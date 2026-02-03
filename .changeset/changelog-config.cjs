/**
 * Custom changelog generator that omits commit SHAs.
 * Users don't need to see git commit references in the changelog.
 */

/** @type {import('@changesets/types').ChangelogFunctions} */
const changelogFunctions = {
  getDependencyReleaseLine: async () => {
    return "";
  },
  getReleaseLine: async (changeset) => {
    const summary = changeset.summary
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n");

    return `- ${summary}`;
  },
};

module.exports = changelogFunctions;
