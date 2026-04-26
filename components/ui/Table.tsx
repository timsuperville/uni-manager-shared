import React from "react";

type TableHtmlProps = React.HTMLAttributes<HTMLTableElement>;

type TrHtmlProps = React.HTMLAttributes<HTMLTableRowElement>;
type ThHtmlProps = React.ThHTMLAttributes<HTMLTableCellElement>;
type TdHtmlProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export const Table: React.FC<TableHtmlProps> = ({
  children,
  className = "",
  ...props
}) => (
  <div className="overflow-x-auto">
    <table
      className={`min-w-full divide-y divide-(--glass-outline,rgba(255,255,255,0.12)) ${className}`}
      {...props}
    >
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<
  React.HTMLAttributes<HTMLTableSectionElement>
> = ({ children, className = "", ...props }) => (
  <thead
    className={`[background:var(--bg-surface-1,rgba(255,255,255,0.03))] ${className}`}
    {...props}
  >
    {children}
  </thead>
);

export const TableBody: React.FC<
  React.HTMLAttributes<HTMLTableSectionElement>
> = ({ children, className = "", ...props }) => (
  <tbody
    className={`[background:transparent] divide-y divide-(--glass-outline,rgba(255,255,255,0.08)) ${className}`}
    {...props}
  >
    {children}
  </tbody>
);

export const TableRow: React.FC<TrHtmlProps> = ({
  children,
  className = "",
  ...props
}) => (
  <tr
    className={`hover:[background:var(--glass-surface-hover,rgba(255,255,255,0.04))] ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<ThHtmlProps> = ({
  children,
  className = "",
  ...props
}) => (
  <th
    className={`px-6 py-3 text-left text-xs font-medium text-(--text-muted,rgba(255,255,255,0.45)) uppercase tracking-wider ${className}`}
    {...props}
  >
    {children}
  </th>
);

export const TableCell: React.FC<TdHtmlProps> = ({
  children,
  className = "",
  ...props
}) => (
  <td
    className={`px-6 py-4 whitespace-nowrap text-sm text-(--text-primary,inherit) ${className}`}
    {...props}
  >
    {children}
  </td>
);
