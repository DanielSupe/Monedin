import type { ReactNode } from "react";
import { cx } from "./cx.js";

export interface DataColumn {
  key: string;
  header: ReactNode;

  align?: "start" | "end";
}

export interface DataRow {
  key: string;

  cells: Record<string, ReactNode>;
}

export interface DataTableProps {
  caption: string;
  columns: DataColumn[];
  rows: DataRow[];
  className?: string;
}

export function DataTable({
  caption,
  columns,
  rows,
  className,
}: DataTableProps): React.ReactElement | null {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className={cx("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left">

        <caption className="sr-only">{caption}</caption>

        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx(
                  "text-small px-2 py-2 font-semibold text-ink-muted",
                  column.align === "end" && "text-right",
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border last:border-b-0">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cx(
                    "text-body px-2 py-3 align-middle",
                    column.align === "end" && "text-right",
                  )}
                >
                  {row.cells[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
