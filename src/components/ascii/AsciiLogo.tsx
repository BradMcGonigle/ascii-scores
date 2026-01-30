/**
 * ASCII art logo for the application
 * Shows stacked version on mobile, full version on larger screens
 */
export function AsciiLogo({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      {/* Mobile: stacked logo */}
      <pre
        className="text-terminal-green md:hidden"
        aria-label="ASCII Scores"
      >
        {`
 █████╗ ███████╗ ██████╗██╗██╗
██╔══██╗██╔════╝██╔════╝██║██║
███████║███████╗██║     ██║██║
██╔══██║╚════██║██║     ██║██║
██║  ██║███████║╚██████╗██║██║
╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝╚═╝

███████╗ ██████╗ ██████╗ ██████╗ ███████╗███████╗
██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝
███████╗██║     ██║   ██║██████╔╝█████╗  ███████╗
╚════██║██║     ██║   ██║██╔══██╗██╔══╝  ╚════██║
███████║╚██████╗╚██████╔╝██║  ██║███████╗███████║
╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝
`.trim()}
      </pre>

      {/* Desktop: full horizontal logo */}
      <pre
        className="text-terminal-green hidden md:block"
        aria-label="ASCII Scores"
      >
        {`
 █████╗ ███████╗ ██████╗██╗██╗    ███████╗ ██████╗ ██████╗ ██████╗ ███████╗███████╗
██╔══██╗██╔════╝██╔════╝██║██║    ██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝
███████║███████╗██║     ██║██║    ███████╗██║     ██║   ██║██████╔╝█████╗  ███████╗
██╔══██║╚════██║██║     ██║██║    ╚════██║██║     ██║   ██║██╔══██╗██╔══╝  ╚════██║
██║  ██║███████║╚██████╗██║██║    ███████║╚██████╗╚██████╔╝██║  ██║███████╗███████║
╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝╚═╝    ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝
`.trim()}
      </pre>
    </div>
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
