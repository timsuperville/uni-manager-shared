/**
 * ReportingDashboard — Forwarding shim
 *
 * The canonical implementation lives in:
 *   frontend/apps/admin/src/features/reports/
 *
 * This shared entry was superseded by the native admin implementation
 * which uses design-system tokens and no MUI dependency.
 *
 * This file is intentionally kept as a shim so any stale imports in
 * shared code do not break builds. It renders null with a dev-mode
 * warning rather than crashing with a missing MUI dependency.
 */

import React from "react";

export default function ReportingDashboard() {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[ReportingDashboard] This shared shim should not be used directly. " +
        "Use the admin features/reports/components/ReportsManager instead.",
    );
  }
  return null;
}

export { ReportingDashboard };
