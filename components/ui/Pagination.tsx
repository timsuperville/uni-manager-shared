import React, { useCallback } from "react";

type PaginationSize = "sm" | "md";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  size?: PaginationSize;
  showEdges?: boolean;
  siblingCount?: number;
}

/** Pagination — Liquid Glass page-number navigation with smart ellipsis. */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  size = "md",
  showEdges = false,
  siblingCount = 1,
}: PaginationProps) {
  const btnSize = size === "sm" ? 28 : 34;
  const fontSize = size === "sm" ? 12 : 14;

  const baseBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: btnSize,
    height: btnSize,
    borderRadius: 6,
    fontSize,
    border: "1px solid var(--glass-outline, rgba(128,128,128,0.2))",
    background: "var(--glass-surface, transparent)",
    color: "var(--text-primary, inherit)",
    cursor: "pointer",
    userSelect: "none",
    transition: "background 0.15s, color 0.15s",
    fontWeight: 500,
  };
  const activeBtn: React.CSSProperties = {
    ...baseBtn,
    background: "var(--primary-resonance, #6366f1)",
    color: "#fff",
    border: "1px solid var(--primary-resonance, #6366f1)",
    cursor: "default",
  };
  const disabledBtn: React.CSSProperties = {
    ...baseBtn,
    opacity: 0.4,
    cursor: "not-allowed",
  };

  const getPageRange = useCallback((): (number | "…")[] => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const left = Math.max(currentPage - siblingCount, 1);
    const right = Math.min(currentPage + siblingCount, totalPages);
    const pages: (number | "…")[] = [1];
    if (left > 2) pages.push("…");
    else if (left === 2) pages.push(2);
    for (let i = left; i <= right; i++) {
      if (i !== 1 && i !== totalPages) pages.push(i);
    }
    if (right < totalPages - 1) pages.push("…");
    else if (right === totalPages - 1) pages.push(totalPages - 1);
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages, siblingCount]);

  if (totalPages <= 1) return null;
  const pages = getPageRange();

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        style={currentPage <= 1 ? disabledBtn : baseBtn}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        aria-label="Previous page"
        disabled={currentPage <= 1}
      >
        ‹
      </button>
      {showEdges && currentPage > 3 && (
        <button
          type="button"
          style={baseBtn}
          onClick={() => onPageChange(1)}
          aria-label="First page"
        >
          «
        </button>
      )}
      {pages.map((page, idx) =>
        page === "…" ? (
          <span
            key={`ellipsis-${idx}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: btnSize,
              fontSize,
              color: "var(--text-secondary, #888)",
              userSelect: "none",
            }}
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            style={page === currentPage ? activeBtn : baseBtn}
            onClick={() => page !== currentPage && onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        ),
      )}
      {showEdges && currentPage < totalPages - 2 && (
        <button
          type="button"
          style={baseBtn}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
        >
          »
        </button>
      )}
      <button
        type="button"
        style={currentPage >= totalPages ? disabledBtn : baseBtn}
        onClick={() =>
          currentPage < totalPages && onPageChange(currentPage + 1)
        }
        aria-label="Next page"
        disabled={currentPage >= totalPages}
      >
        ›
      </button>
    </nav>
  );
}

export default Pagination;
