import { padString } from "@/lib/utils/format";

interface Column {
  key: string;
  header: string;
  width: number;
  align?: "left" | "right" | "center";
}

interface AsciiTableProps<T> {
  /** Column definitions */
  columns: Column[];
  /** Data rows */
  data: T[];
  /** Function to get cell value */
  getCellValue: (row: T, columnKey: string) => string;
  /** Optional row key function */
  getRowKey?: (row: T, index: number) => string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Renders data in an ASCII table format
 */
export function AsciiTable<T>({
  columns,
  data,
  getCellValue,
  getRowKey = (_, index) => String(index),
  className = "",
}: AsciiTableProps<T>) {
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0) + columns.length + 1;

  const horizontalLine = "─".repeat(totalWidth - 2);
  const headerSeparator = columns
    .map((col) => "─".repeat(col.width))
    .join("┼");

  return (
    <div className={`ascii-box font-mono ${className}`} role="table">
      {/* Top border */}
      <div className="text-terminal-border" aria-hidden="true">
        ┌{horizontalLine}┐
      </div>

      {/* Header row */}
      <div role="row" className="text-terminal-cyan">
        <span className="text-terminal-border" aria-hidden="true">│</span>
        {columns.map((col, i) => (
          <span key={col.key} role="columnheader">
            {padString(col.header, col.width, col.align ?? "left")}
            {i < columns.length - 1 && (
              <span className="text-terminal-border" aria-hidden="true">│</span>
            )}
          </span>
        ))}
        <span className="text-terminal-border" aria-hidden="true">│</span>
      </div>

      {/* Header separator */}
      <div className="text-terminal-border" aria-hidden="true">
        ├{headerSeparator}┤
      </div>

      {/* Data rows */}
      {data.map((row, rowIndex) => (
        <div key={getRowKey(row, rowIndex)} role="row">
          <span className="text-terminal-border" aria-hidden="true">│</span>
          {columns.map((col, i) => (
            <span key={col.key} role="cell">
              {padString(getCellValue(row, col.key), col.width, col.align ?? "left")}
              {i < columns.length - 1 && (
                <span className="text-terminal-border" aria-hidden="true">│</span>
              )}
            </span>
          ))}
          <span className="text-terminal-border" aria-hidden="true">│</span>
        </div>
      ))}

      {/* Empty state */}
      {data.length === 0 && (
        <div role="row" className="text-terminal-muted">
          <span className="text-terminal-border" aria-hidden="true">│</span>
          {padString("No data available", totalWidth - 2, "center")}
          <span className="text-terminal-border" aria-hidden="true">│</span>
        </div>
      )}

      {/* Bottom border */}
      <div className="text-terminal-border" aria-hidden="true">
        └{horizontalLine}┘
      </div>
    </div>
  );
}
