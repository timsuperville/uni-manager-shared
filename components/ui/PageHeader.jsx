import React from "react";
import PropTypes from "prop-types";

/**
 * PageHeader — Liquid Glass Design System
 *
 * A compact, responsive page title bar. Stacks on mobile, single row on sm+.
 * Description is hidden on xs to preserve action area width.
 *
 * Props:
 *   title        {string}   Required. Page title (renders as <h1>)
 *   description  {string}   Optional. Subtitle shown below title on sm+
 *   actions      {ReactNode} Optional. Buttons/controls rendered right-aligned
 *   breadcrumb   {ReactNode} Optional. Breadcrumb or back-link above the title
 *   compact      {boolean}  Reduces vertical padding for nested/hub pages
 *   className    {string}   Extra classes applied to the root element
 *
 * Usage:
 *   <PageHeader
 *     title="Planning"
 *     description="Church services & liturgical scheduling"
 *     actions={<Button onClick={handleCreate}>New Service</Button>}
 *   />
 */
export function PageHeader({
    title,
    description,
    actions,
    breadcrumb,
    compact = false,
    className = "",
}) {
    return (
        <div
            className={[
                "flex flex-col gap-1",
                compact ? "py-0" : "py-0.5",
                className,
            ].join(" ")}
        >
            {/* Breadcrumb slot */}
            {breadcrumb && (
                <div
                    className="flex items-center gap-1.5 mb-1 text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                >
                    {breadcrumb}
                </div>
            )}

            {/* Title row */}
            <div className="flex items-start sm:items-center justify-between gap-3 min-w-0">
                {/* Left: title + description */}
                <div className="min-w-0 flex-1">
                    <h1
                        className={[
                            "font-bold leading-tight truncate",
                            compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl",
                        ].join(" ")}
                        style={{
                            color: "var(--text-primary)",
                            fontFamily: "var(--font-display)",
                        }}
                    >
                        {title}
                    </h1>
                    {description && (
                        <p
                            className="hidden sm:block text-sm mt-0.5 truncate"
                            style={{ color: "var(--text-muted)" }}
                        >
                            {description}
                        </p>
                    )}
                </div>

                {/* Right: actions slot */}
                {actions && (
                    <div className="flex items-center gap-2 shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

PageHeader.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    actions: PropTypes.node,
    breadcrumb: PropTypes.node,
    compact: PropTypes.bool,
    className: PropTypes.string,
};

export default PageHeader;
