/**
 * positionUtils.ts — Dropdown position calculation for UserMenu.
 *
 * computeDropdownCoords() takes the trigger's DOMRect and a preferred position
 * hint, then returns the fixed-position {top, left} coordinates for the panel,
 * auto-flipping each axis when the preferred side would overflow the viewport.
 */

export const DROPDOWN_W = 264; // px — panel width
export const DROPDOWN_EST_H = 400; // px — estimated panel height (used for flip check)
export const EDGE_MARGIN = 8; // px — minimum distance from any viewport edge

export type PreferredPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

export interface DropdownCoords {
  top: number;
  left: number;
  opensUpward: boolean;
}

export function computeDropdownCoords(
  rect: DOMRect,
  preferredPosition: PreferredPosition,
  width: number = DROPDOWN_W,
  height: number = DROPDOWN_EST_H,
): DropdownCoords {
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;

  const preferTop = preferredPosition.startsWith("top");
  const preferLeft = preferredPosition.endsWith("left");

  // ── Vertical ─────────────────────────────────────────────────────────────
  const spaceBelow = vpH - rect.bottom - EDGE_MARGIN;
  const spaceAbove = rect.top - EDGE_MARGIN;

  let top: number;
  let opensUpward = false;

  if (preferTop) {
    if (spaceAbove >= height || spaceAbove >= spaceBelow) {
      top = rect.top - height - 8;
      opensUpward = true;
    } else {
      top = rect.bottom + 8;
    }
  } else {
    if (spaceBelow >= height || spaceBelow >= spaceAbove) {
      top = rect.bottom + 8;
    } else {
      top = rect.top - height - 8;
      opensUpward = true;
    }
  }

  top = Math.max(EDGE_MARGIN, Math.min(top, vpH - height - EDGE_MARGIN));

  // ── Horizontal ────────────────────────────────────────────────────────────
  let left = preferLeft ? rect.left : rect.right - width;
  left = Math.max(EDGE_MARGIN, Math.min(left, vpW - width - EDGE_MARGIN));

  return { top, left, opensUpward };
}
