import React from "react";
import PropTypes from "prop-types";

const Table = ({ children, className = "", ...props }) => {
  return (
    <div className="overflow-x-auto">
      <table
        className={`min-w-full divide-y divide-(--glass-outline,rgba(255,255,255,0.12)) ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

const TableHeader = ({ children, className = "", ...props }) => {
  return (
    <thead
      className={`[background:var(--bg-surface-1,rgba(255,255,255,0.03))] ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
};

const TableBody = ({ children, className = "", ...props }) => {
  return (
    <tbody
      className={`[background:transparent] divide-y divide-(--glass-outline,rgba(255,255,255,0.08)) ${className}`}
      {...props}
    >
      {children}
    </tbody>
  );
};

const TableRow = ({ children, className = "", ...props }) => {
  return (
    <tr
      className={`hover:[background:var(--glass-surface-hover,rgba(255,255,255,0.04))] ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

const TableHead = ({ children, className = "", ...props }) => {
  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-(--text-muted,rgba(255,255,255,0.45)) uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

const TableCell = ({ children, className = "", ...props }) => {
  return (
    <td
      className={`px-6 py-4 whitespace-nowrap text-sm text-(--text-primary,inherit) ${className}`}
      {...props}
    >
      {children}
    </td>
  );
};

Table.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TableHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TableBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TableRow.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TableHead.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TableCell.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
