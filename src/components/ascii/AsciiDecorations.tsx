/**
 * Decorative ASCII art patterns and dividers
 */

interface AsciiDividerProps {
  variant?: "simple" | "double" | "fancy" | "circuit" | "wave" | "dots" | "arrows" | "stars";
  width?: number;
  className?: string;
}

const DIVIDER_PATTERNS = {
  simple: "─",
  double: "═",
  fancy: "═╪═",
  circuit: "─┬─",
  wave: "~∿~",
  dots: "·•·",
  arrows: "◄─►",
  stars: "★·★",
};

/**
 * Renders a decorative ASCII divider line
 */
export function AsciiDivider({
  variant = "simple",
  width = 60,
  className = "",
}: AsciiDividerProps) {
  const pattern = DIVIDER_PATTERNS[variant];
  const repeatCount = Math.ceil(width / pattern.length);
  const line = pattern.repeat(repeatCount).slice(0, width);

  return (
    <div
      className={`font-mono text-terminal-border ${className}`}
      aria-hidden="true"
    >
      {line}
    </div>
  );
}

interface AsciiSectionHeaderProps {
  title: string;
  variant?: "default" | "boxed" | "banner" | "terminal" | "glitch";
  className?: string;
}

/**
 * Renders a decorative section header
 */
export function AsciiSectionHeader({
  title,
  variant = "default",
  className = "",
}: AsciiSectionHeaderProps) {
  const upperTitle = title.toUpperCase();

  switch (variant) {
    case "boxed": {
      const boxWidth = upperTitle.length + 6;
      const horizontalLine = "═".repeat(boxWidth);
      const padding = " ".repeat(2);
      return (
        <div className={`font-mono ${className}`} aria-label={title}>
          <div className="text-terminal-border">╔{horizontalLine}╗</div>
          <div>
            <span className="text-terminal-border">║</span>
            <span className="text-terminal-cyan">{padding}{upperTitle}{padding}</span>
            <span className="text-terminal-border">║</span>
          </div>
          <div className="text-terminal-border">╚{horizontalLine}╝</div>
        </div>
      );
    }

    case "banner":
      return (
        <div className={`font-mono ${className}`} aria-label={title}>
          <div className="text-terminal-border">
            ╔{"═".repeat(upperTitle.length + 10)}╗
          </div>
          <div className="flex">
            <span className="text-terminal-border">║░░░░</span>
            <span className="text-terminal-cyan glow-blue"> {upperTitle} </span>
            <span className="text-terminal-border">░░░░║</span>
          </div>
          <div className="text-terminal-border">
            ╚{"═".repeat(upperTitle.length + 10)}╝
          </div>
        </div>
      );

    case "terminal":
      return (
        <div className={`font-mono ${className}`} aria-label={title}>
          <span className="text-terminal-green">{"> "}</span>
          <span className="text-terminal-cyan">{upperTitle}</span>
          <span className="text-terminal-green cursor-blink-underscore" />
        </div>
      );

    case "glitch":
      return (
        <div className={`font-mono glitch-hover ${className}`} aria-label={title}>
          <span className="text-terminal-muted">[</span>
          <span className="text-terminal-cyan rgb-shift">{upperTitle}</span>
          <span className="text-terminal-muted">]</span>
        </div>
      );

    default:
      return (
        <div className={`font-mono ${className}`} aria-label={title}>
          <span className="text-terminal-border">═══ </span>
          <span className="text-terminal-cyan">{upperTitle}</span>
          <span className="text-terminal-border"> ═══</span>
        </div>
      );
  }
}

/**
 * Decorative corner pieces for framing content
 */
export function AsciiCorner({
  position,
  variant = "single",
  className = "",
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  variant?: "single" | "double" | "rounded" | "heavy" | "decorative";
  className?: string;
}) {
  const corners = {
    single: {
      "top-left": "┌",
      "top-right": "┐",
      "bottom-left": "└",
      "bottom-right": "┘",
    },
    double: {
      "top-left": "╔",
      "top-right": "╗",
      "bottom-left": "╚",
      "bottom-right": "╝",
    },
    rounded: {
      "top-left": "╭",
      "top-right": "╮",
      "bottom-left": "╰",
      "bottom-right": "╯",
    },
    heavy: {
      "top-left": "┏",
      "top-right": "┓",
      "bottom-left": "┗",
      "bottom-right": "┛",
    },
    decorative: {
      "top-left": "╔══╦",
      "top-right": "╦══╗",
      "bottom-left": "╚══╩",
      "bottom-right": "╩══╝",
    },
  };

  return (
    <span className={`font-mono text-terminal-border ${className}`} aria-hidden="true">
      {corners[variant][position]}
    </span>
  );
}

/**
 * ASCII loading/status indicators
 */
export function AsciiStatusIndicator({
  status,
  animated = true,
  className = "",
}: {
  status: "live" | "loading" | "error" | "success" | "warning" | "idle";
  animated?: boolean;
  className?: string;
}) {
  const indicators = {
    live: {
      symbol: "●",
      color: "text-terminal-green",
      animation: animated ? "glow-pulse" : "",
    },
    loading: {
      symbol: "◐",
      color: "text-terminal-cyan",
      animation: animated ? "animate-spin" : "",
    },
    error: {
      symbol: "✖",
      color: "text-terminal-red",
      animation: "",
    },
    success: {
      symbol: "✔",
      color: "text-terminal-green",
      animation: "",
    },
    warning: {
      symbol: "⚠",
      color: "text-terminal-yellow",
      animation: animated ? "glow-amber" : "",
    },
    idle: {
      symbol: "○",
      color: "text-terminal-muted",
      animation: "",
    },
  };

  const { symbol, color, animation } = indicators[status];

  return (
    <span
      className={`font-mono ${color} ${animation} ${className}`}
      aria-label={`Status: ${status}`}
    >
      {symbol}
    </span>
  );
}

/**
 * ASCII progress bar
 */
export function AsciiProgressBar({
  progress,
  width = 20,
  variant = "blocks",
  className = "",
}: {
  progress: number; // 0-100
  width?: number;
  variant?: "blocks" | "bars" | "dots" | "arrows";
  className?: string;
}) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const filledWidth = Math.round((clampedProgress / 100) * width);
  const emptyWidth = width - filledWidth;

  const chars = {
    blocks: { filled: "█", empty: "░" },
    bars: { filled: "▓", empty: "░" },
    dots: { filled: "●", empty: "○" },
    arrows: { filled: "►", empty: "·" },
  };

  const { filled, empty } = chars[variant];

  return (
    <div className={`font-mono ${className}`} aria-label={`Progress: ${clampedProgress}%`}>
      <span className="text-terminal-border">[</span>
      <span className="text-terminal-green">{filled.repeat(filledWidth)}</span>
      <span className="text-terminal-muted">{empty.repeat(emptyWidth)}</span>
      <span className="text-terminal-border">]</span>
      <span className="text-terminal-muted ml-2">{clampedProgress}%</span>
    </div>
  );
}

/**
 * ASCII stat comparison bar for comparing two team values
 * Shows proportional bars for each team, with the away team bar on the left
 * and the home team bar on the right. Uses CSS-based widths to fill container.
 */
export function AsciiStatBar({
  awayValue,
  homeValue,
  className = "",
}: {
  awayValue: number;
  homeValue: number;
  className?: string;
}) {
  const total = awayValue + homeValue;

  // Handle edge cases - show equal split when both are zero
  const awayPercent = total === 0 ? 50 : (awayValue / total) * 100;
  const homePercent = 100 - awayPercent;

  // Determine which team has the lead for coloring
  const awayColor = awayValue >= homeValue ? "bg-terminal-green" : "bg-terminal-muted";
  const homeColor = homeValue >= awayValue ? "bg-terminal-cyan" : "bg-terminal-muted";

  return (
    <div
      className={`flex h-3 w-full ${className}`}
      aria-label={`Away: ${awayValue}, Home: ${homeValue}`}
    >
      {/* Away team bar (left side) */}
      <div
        className={`${awayColor} h-full`}
        style={{ width: `${awayPercent}%` }}
      />
      {/* Home team bar (right side) */}
      <div
        className={`${homeColor} h-full`}
        style={{ width: `${homePercent}%` }}
      />
    </div>
  );
}

/**
 * Decorative ASCII frame around content
 */
export function AsciiFrame({
  children,
  variant = "single",
  title,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "single" | "double" | "heavy" | "decorative";
  title?: string;
  className?: string;
}) {
  const borders = {
    single: { h: "─", v: "│", tl: "┌", tr: "┐", bl: "└", br: "┘", lt: "├", rt: "┤" },
    double: { h: "═", v: "║", tl: "╔", tr: "╗", bl: "╚", br: "╝", lt: "╠", rt: "╣" },
    heavy: { h: "━", v: "┃", tl: "┏", tr: "┓", bl: "┗", br: "┛", lt: "┣", rt: "┫" },
    decorative: { h: "═", v: "║", tl: "╔", tr: "╗", bl: "╚", br: "╝", lt: "╠", rt: "╣" },
  };

  const b = borders[variant];

  return (
    <div className={`font-mono ${className}`}>
      {/* Top border with optional title */}
      <div className="text-terminal-border" aria-hidden="true">
        {b.tl}
        {title ? (
          <>
            {b.h.repeat(2)}
            <span className="text-terminal-cyan">{` ${title} `}</span>
            {b.h.repeat(Math.max(0, 30 - title.length))}
          </>
        ) : (
          b.h.repeat(34)
        )}
        {b.tr}
      </div>

      {/* Content with side borders */}
      <div className="relative">
        <span className="absolute left-0 text-terminal-border" aria-hidden="true">
          {b.v}
        </span>
        <div className="px-4 py-2">{children}</div>
        <span className="absolute right-0 top-0 text-terminal-border" aria-hidden="true">
          {b.v}
        </span>
      </div>

      {/* Bottom border */}
      <div className="text-terminal-border" aria-hidden="true">
        {b.bl}
        {b.h.repeat(34)}
        {b.br}
      </div>
    </div>
  );
}

/**
 * ASCII art circuit board pattern background
 */
export function AsciiCircuitPattern({ className = "" }: { className?: string }) {
  const pattern = `
┌─┬─┬─┬─┬─┬─┬─┬─┐
├─┼─┴─┼─┴─┼─┴─┼─┤
│ └───┼───┘ ┌─┤ │
├─────┴─────┤ └─┤
│ ┌─────────┴───┤
└─┴─────────────┘`.trim();

  return (
    <pre
      className={`font-mono text-terminal-border opacity-20 ${className}`}
      aria-hidden="true"
    >
      {pattern}
    </pre>
  );
}

/**
 * Blinking cursor component
 */
export function AsciiCursor({
  variant = "block",
  className = "",
}: {
  variant?: "block" | "underscore" | "line";
  className?: string;
}) {
  const cursors = {
    block: "█",
    underscore: "_",
    line: "│",
  };

  return (
    <span
      className={`font-mono text-terminal-green ${className}`}
      style={{ animation: "cursor-blink 1s step-end infinite" }}
      aria-hidden="true"
    >
      {cursors[variant]}
    </span>
  );
}
