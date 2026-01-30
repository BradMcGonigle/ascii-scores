import type { ReactNode } from "react";

/**
 * Box style variants using Unicode box-drawing characters
 */
const BOX_STYLES = {
  single: {
    topLeft: "┌",
    topRight: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
    horizontal: "─",
    vertical: "│",
  },
  double: {
    topLeft: "╔",
    topRight: "╗",
    bottomLeft: "╚",
    bottomRight: "╝",
    horizontal: "═",
    vertical: "║",
  },
  rounded: {
    topLeft: "╭",
    topRight: "╮",
    bottomLeft: "╰",
    bottomRight: "╯",
    horizontal: "─",
    vertical: "│",
  },
  heavy: {
    topLeft: "┏",
    topRight: "┓",
    bottomLeft: "┗",
    bottomRight: "┛",
    horizontal: "━",
    vertical: "┃",
  },
} as const;

type BoxStyle = keyof typeof BOX_STYLES;

interface AsciiBoxProps {
  /** Content to display inside the box */
  children: ReactNode;
  /** Optional title for the box header */
  title?: string;
  /** Box border style */
  variant?: BoxStyle;
  /** Width in characters (auto if not specified) */
  width?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Renders content inside an ASCII box with optional title
 */
export function AsciiBox({
  children,
  title,
  variant = "single",
  width,
  className = "",
}: AsciiBoxProps) {
  const chars = BOX_STYLES[variant];

  return (
    <div
      className={`ascii-box font-mono ${className}`}
      role="region"
      aria-label={title}
    >
      {/* Top border with optional title */}
      <div className="text-terminal-border" aria-hidden="true">
        {chars.topLeft}
        {title ? (
          <>
            {chars.horizontal}
            <span className="text-terminal-fg">{` ${title} `}</span>
            {chars.horizontal.repeat(
              Math.max(0, (width ?? 40) - title.length - 4)
            )}
          </>
        ) : (
          chars.horizontal.repeat((width ?? 40) - 2)
        )}
        {chars.topRight}
      </div>

      {/* Content with side borders */}
      <div className="relative">
        <span
          className="absolute left-0 text-terminal-border"
          aria-hidden="true"
        >
          {chars.vertical}
        </span>
        <div className="px-4">{children}</div>
        <span
          className="absolute right-0 top-0 text-terminal-border"
          aria-hidden="true"
        >
          {chars.vertical}
        </span>
      </div>

      {/* Bottom border */}
      <div className="text-terminal-border" aria-hidden="true">
        {chars.bottomLeft}
        {chars.horizontal.repeat((width ?? 40) - 2)}
        {chars.bottomRight}
      </div>
    </div>
  );
}

export { BOX_STYLES, type BoxStyle };
