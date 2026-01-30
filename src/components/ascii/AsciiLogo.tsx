/**
 * ASCII art logo for the application
 */
export function AsciiLogo({ className = "" }: { className?: string }) {
  return (
    <pre className={`text-terminal-green ${className}`} aria-label="ASCII Scores">
      {`
 █████╗ ███████╗ ██████╗██╗██╗    ███████╗ ██████╗ ██████╗ ██████╗ ███████╗███████╗
██╔══██╗██╔════╝██╔════╝██║██║    ██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝
███████║███████╗██║     ██║██║    ███████╗██║     ██║   ██║██████╔╝█████╗  ███████╗
██╔══██║╚════██║██║     ██║██║    ╚════██║██║     ██║   ██║██╔══██╗██╔══╝  ╚════██║
██║  ██║███████║╚██████╗██║██║    ███████║╚██████╗╚██████╔╝██║  ██║███████╗███████║
╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝╚═╝    ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝
`.trim()}
    </pre>
  );
}

/**
 * Compact version of the logo
 */
export function AsciiLogoCompact({ className = "" }: { className?: string }) {
  return (
    <span className={`font-mono text-terminal-green ${className}`} aria-label="ASCII Scores">
      [ASCII SCORES]
    </span>
  );
}
