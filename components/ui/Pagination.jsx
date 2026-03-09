import React, { useCallback } from "react";
import PropTypes from "prop-types";

/**
 * Pagination — Liquid Glass Design System
 *
 * Standard page-number navigation component using CSS custom properties.
 * Renders Previous / page buttons / Next with smart ellipsis for large page counts.
 *
 * @param {number}   currentPage  - 1-indexed current page
 * @param {number}   totalPages   - Total number of pages
 * @param {Function} onPageChange - Called with (pageNumber)
 * @param {"sm"|"md"} size
 * @param {boolean}  showEdges    - Show first/last page buttons
 * @param {number}   siblingCount - How many page buttons on each side of current
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  size = "md",
  showEdges = false,
  siblingCount = 1,
}) {
  const btnSize = size === "sm" ? 28 : 34;
  const fontSize = size === "sm" ? 12 : 14;

  const baseBtn = {
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

  const activeBtn = {
    ...baseBtn,
    background: "var(--primary-resonance, #6366f1)",
    color: "#fff",
    border: "1px solid var(--primary-resonance, #6366f1)",
    cursor: "default",
  };

  const disabledBtn = {
    ...baseBtn,
    opacity: 0.4,
    cursor: "not-allowed",
  };

  // Build page range with ellipsis
  const getPageRange = useCallback(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const left = Math.max(currentPage - siblingCount, 1);
    const right = Math.min(currentPage + siblingCount, totalPages);

    const showLeftEllipsis = left > 2;
    const showRightEllipsis = right < totalPages - 1;

    const pages = [];

    // Always show first page
    pages.push(1);

    if (showLeftEllipsis) pages.push("…");
    else if (left === 2) pages.push(2);

    for (let i = left; i <= right; i++) {
      if (i !== 1 && i !== totalPages) pages.push(i);
    }

    if (showRightEllipsis) pages.push("…");
    else if (right === totalPages - 1) pages.push(totalPages - 1);

    // Always show last page
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
      {/* Previous */}
      <button
        type="button"
        style={currentPage <= 1 ? disabledBtn : baseBtn}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        aria-label="Previous page"
        disabled={currentPage <= 1}
      >
        ‹
      </button>

      {/* First page shortcut */}
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

      {/* Page buttons */}
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

      {/* Last page shortcut */}
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

      {/* Next */}
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

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  size: PropTypes.oneOf(["sm", "md"]),
  showEdges: PropTypes.bool,
  siblingCount: PropTypes.number,
};

export default Pagination;
