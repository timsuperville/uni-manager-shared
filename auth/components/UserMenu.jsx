/**
 * UserMenu Component — Liquid Glass Edition (v3)
 *
 * Unified user menu used across ALL Uni-Manager apps.
 *
 * Rendering: Uses a React portal → rendered into document.body with
 * position:fixed coordinates so it is never clipped by overflow:hidden
 * ancestors (e.g., sidebars). Position is calculated from the trigger
 * button's getBoundingClientRect() and auto-flips when near viewport edges.
 *
 * Styling: CSS custom properties (var(--token)) only — inherits each app's
 * Liquid Glass theme automatically.
 *
 * Props:
 *   onProfileClick        – called when "View Profile" is clicked
 *   onPreferencesClick    – called when "Preferences" is clicked
 *   showProfileLink       – show the Profile item (default true)
 *   showPreferencesLink   – show the Preferences item (default true)
 *   customHeader          – ReactNode injected below the identity header
 *                           (used by church for ChurchSelector)
 *   children              – extra menu items rendered before the standard ones
 *   position              – preferred side hint: "bottom-right" | "bottom-left" |
 *                           "top-right" | "top-left" (auto-flipped if near edge)
 *   className             – extra class on the root wrapper
 */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
  useId,
  memo,
} from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { useAuth } from "../context/AuthContext.jsx";
import { PresenceContext } from "../../context/PresenceContext";
import { getCurrentAppConfig } from "../config/appConfigs.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  LogOut,
  ChevronDown,
  SlidersHorizontal,
  WifiOff,
  Palette,
} from "lucide-react";
import { useLocation } from "react-router-dom";

import { UserAvatar } from "../../components/ui";
import UserMenuSkeleton from "../../components/skeletons/UserMenuSkeleton";
import { ThemeToggle } from "../../components/ThemeToggle";
import { formatRole, getUserDisplayName } from "../../utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const DROPDOWN_W = 264; // px — panel width
const DROPDOWN_EST_H = 400; // px — estimated panel height for flip calculation
const EDGE_MARGIN = 8; // px — min distance from viewport edge

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Given the trigger element's bounding rect and the user's preferred position
 * hint, compute fixed-position {top, left} for the dropdown panel, auto-flipping
 * when the preferred position would overflow the viewport.
 */
function computeDropdownCoords(rect, preferredPosition) {
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;

  const preferTop = preferredPosition.startsWith("top");
  const preferLeft = preferredPosition.endsWith("left");

  // ── Vertical ──────────────────────────────────────────────────────────────
  const spaceBelow = vpH - rect.bottom - EDGE_MARGIN;
  const spaceAbove = rect.top - EDGE_MARGIN;

  let top;
  let opensUpward = false;

  if (preferTop) {
    if (spaceAbove >= DROPDOWN_EST_H || spaceAbove >= spaceBelow) {
      top = rect.top - DROPDOWN_EST_H - 8;
      opensUpward = true;
    } else {
      top = rect.bottom + 8;
    }
  } else {
    if (spaceBelow >= DROPDOWN_EST_H || spaceBelow >= spaceAbove) {
      top = rect.bottom + 8;
    } else {
      top = rect.top - DROPDOWN_EST_H - 8;
      opensUpward = true;
    }
  }

  // Clamp to viewport
  top = Math.max(
    EDGE_MARGIN,
    Math.min(top, vpH - DROPDOWN_EST_H - EDGE_MARGIN),
  );

  // ── Horizontal ────────────────────────────────────────────────────────────
  let left;

  if (preferLeft) {
    // Align panel's left edge with trigger's left edge
    left = rect.left;
  } else {
    // Align panel's right edge with trigger's right edge (default)
    left = rect.right - DROPDOWN_W;
  }

  // Clamp to viewport
  left = Math.max(EDGE_MARGIN, Math.min(left, vpW - DROPDOWN_W - EDGE_MARGIN));

  return { top, left, opensUpward };
}

// ─── UserMenuItem ─────────────────────────────────────────────────────────────

const UserMenuItem = memo(
  React.forwardRef(
    (
      { icon: Icon, label, onClick, variant = "default", active = false },
      ref,
    ) => {
      const [hovered, setHovered] = useState(false);
      const isDanger = variant === "danger";

      const bg = active
        ? "var(--primary-subtle, hsla(187,84%,44%,0.12))"
        : hovered && isDanger
          ? "var(--color-error-surface, hsla(0,75%,60%,0.1))"
          : hovered
            ? "var(--nav-hover, hsla(0,0%,100%,0.06))"
            : "transparent";

      const textColor = isDanger
        ? "var(--color-error, hsl(0,75%,60%))"
        : active
          ? "var(--text-accent, var(--primary-resonance))"
          : "var(--text-secondary)";

      const iconColor = isDanger
        ? "var(--color-error, hsl(0,75%,60%))"
        : active || hovered
          ? "var(--primary-resonance)"
          : "var(--text-muted)";

      return (
        <button
          ref={ref}
          onClick={onClick}
          role="menuitem"
          aria-current={active ? "page" : undefined}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 10px",
            borderRadius: "8px",
            background: bg,
            border: "none",
            color: textColor,
            fontSize: "13px",
            fontWeight: active ? "600" : "500",
            cursor: "pointer",
            transition: "all 150ms ease",
            textAlign: "left",
            position: "relative",
            outline: "none",
            fontFamily: "var(--font-body)",
          }}
        >
          {active && (
            <motion.span
              layoutId="active-user-menu-item"
              style={{
                position: "absolute",
                left: 0,
                top: "20%",
                height: "60%",
                width: "2px",
                borderRadius: "0 2px 2px 0",
                background: "var(--primary-resonance)",
                boxShadow:
                  "0 0 6px var(--primary-glow, var(--primary-resonance))",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
          <Icon
            size={15}
            style={{
              color: iconColor,
              flexShrink: 0,
              transition: "color 150ms ease",
            }}
          />
          {label}
        </button>
      );
    },
  ),
);

UserMenuItem.displayName = "UserMenuItem";

UserMenuItem.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(["default", "danger"]),
  active: PropTypes.bool,
};

// ─── ThemeRow ─────────────────────────────────────────────────────────────────

const ThemeRow = memo(function ThemeRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 10px",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "13px",
          fontWeight: "500",
          color: "var(--text-secondary)",
        }}
      >
        <Palette
          size={15}
          style={{ color: "var(--text-muted)", flexShrink: 0 }}
        />
        Appearance
      </div>
      <ThemeToggle showLabel />
    </div>
  );
});

// ─── MenuDivider ──────────────────────────────────────────────────────────────

function MenuDivider() {
  return (
    <div
      role="separator"
      style={{
        height: "1px",
        background: "var(--glass-outline)",
        margin: "4px 8px",
      }}
    />
  );
}

// ─── PresenceToggle ───────────────────────────────────────────────────────────
// Only rendered when a PresenceProvider actually exists in the tree.

const PresenceToggle = memo(function PresenceToggle({
  status,
  isConnected,
  onToggle,
  dotColor,
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        marginTop: "7px",
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "2px 8px",
        borderRadius: "100px",
        background: "var(--bg-surface-1, hsla(0,0%,100%,0.04))",
        border: "1px solid var(--glass-outline)",
        cursor: isConnected ? "pointer" : "default",
        fontSize: "11px",
        fontWeight: "500",
        color: "var(--text-secondary)",
        transition: "all 150ms ease",
      }}
    >
      {isConnected ? (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: dotColor,
            flexShrink: 0,
          }}
        />
      ) : (
        <WifiOff
          size={10}
          style={{ color: "var(--color-warning, hsl(38,95%,54%))" }}
        />
      )}
      {!isConnected
        ? "Offline"
        : status === "available"
          ? "Available"
          : "Unavailable"}
    </button>
  );
});

PresenceToggle.propTypes = {
  status: PropTypes.string.isRequired,
  isConnected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  dotColor: PropTypes.string.isRequired,
};

// ─── UserMenu ─────────────────────────────────────────────────────────────────

const UserMenu = ({
  className = "",
  onProfileClick,
  onPreferencesClick,
  showProfileLink = true,
  showPreferencesLink = true,
  children,
  customHeader = null,
  position = "bottom-right",
}) => {
  const { user, logout, isLoading } = useAuth();

  // Safe presence consumption — context is undefined (not null) when provider absent
  const presence = useContext(PresenceContext);
  const hasPresence = presence !== undefined && presence !== null;
  const isConnected = hasPresence ? (presence.isConnected ?? true) : true;
  const status = hasPresence ? presence.status || "available" : "available";
  const setStatus = hasPresence ? presence.setStatus : null;

  const appConfig = getCurrentAppConfig();
  const location = useLocation();
  const uid = useId(); // Unique per-instance IDs — safe if multiple menus exist

  const [isOpen, setIsOpen] = useState(false);
  const [triggerHover, setTriggerHover] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState({
    top: 0,
    left: 0,
    opensUpward: false,
  });

  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  // ── Close on route change ────────────────────────────────────────────────
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // ── Close on click outside (catches portal clicks too) ───────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      const clickedTrigger = buttonRef.current?.contains(e.target);
      const clickedPanel = panelRef.current?.contains(e.target);
      if (!clickedTrigger && !clickedPanel) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // ── Calculate portal coordinates before opening ──────────────────────────
  const openMenu = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownCoords(computeDropdownCoords(rect, position));
    setIsOpen(true);
  }, [position]);

  // Recalculate coords on scroll/resize while open (prevents drift)
  useEffect(() => {
    if (!isOpen) return;
    const recalc = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownCoords(computeDropdownCoords(rect, position));
    };
    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
    };
  }, [isOpen, position]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll('[role="menuitem"]'),
      );
      const currentIdx = items.indexOf(document.activeElement);

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          items[currentIdx < items.length - 1 ? currentIdx + 1 : 0]?.focus();
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          items[currentIdx > 0 ? currentIdx - 1 : items.length - 1]?.focus();
          break;
        }
        case "Home":
          e.preventDefault();
          items[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          items[items.length - 1]?.focus();
          break;
        case "Tab":
          setIsOpen(false);
          break;
        case "Escape":
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        default:
          break;
      }
    },
    [isOpen],
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    // Auto-focus first item after mount
    requestAnimationFrame(() => {
      panelRef.current?.querySelector('[role="menuitem"]')?.focus();
    });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggle = useCallback(() => {
    if (isOpen) setIsOpen(false);
    else openMenu();
  }, [isOpen, openMenu]);

  const handleLogout = useCallback(async () => {
    setIsOpen(false);
    await logout();
  }, [logout]);

  const handleToggleStatus = useCallback(
    (e) => {
      e.stopPropagation();
      setStatus?.(status === "available" ? "unavailable" : "available");
    },
    [status, setStatus],
  );

  // ── Derived ───────────────────────────────────────────────────────────────
  const statusDotColor =
    status === "available"
      ? "var(--color-success, hsl(142,71%,45%))"
      : "var(--text-ghost, hsla(0,0%,100%,0.2))";

  const showProfile =
    showProfileLink && (appConfig.features?.profileManagement ?? true);
  const prefsActive =
    location.pathname === "/preferences" || location.pathname === "/settings";

  const roleLabel =
    user?.churchRole ||
    user?.title ||
    user?.position ||
    (user?.role ? formatRole(user.role) : null);

  const { opensUpward } = dropdownCoords;
  const animVariant = {
    initial: { opacity: 0, y: opensUpward ? -8 : 8, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: opensUpward ? -8 : 8, scale: 0.96 },
  };

  // Unique IDs for this instance (safe for multiple menus on the same page)
  const triggerId = `user-menu-trigger-${uid}`;
  const panelId = `user-menu-panel-${uid}`;

  // ── Early returns ─────────────────────────────────────────────────────────
  if (isLoading) return <UserMenuSkeleton />;
  if (!user) return null;

  // ── Trigger styles ────────────────────────────────────────────────────────
  const triggerBorder =
    isOpen || triggerHover
      ? "var(--glass-outline-active, var(--primary-resonance))"
      : "var(--glass-outline)";

  const triggerBg = isOpen
    ? "var(--primary-subtle, hsla(187,84%,44%,0.1))"
    : triggerHover
      ? "var(--nav-hover, hsla(0,0%,100%,0.06))"
      : "var(--bg-surface-1, hsla(0,0%,100%,0.04))";

  // ── Dropdown panel (portal) ───────────────────────────────────────────────
  const panel = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          id={panelId}
          role="menu"
          aria-label="User menu options"
          initial={animVariant.initial}
          animate={animVariant.animate}
          exit={animVariant.exit}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: dropdownCoords.top,
            left: dropdownCoords.left,
            zIndex: 99000,
            width: `${DROPDOWN_W}px`,
            borderRadius: "var(--radius-lg, 14px)",
            border: "1px solid var(--glass-outline)",
            background: "var(--bg-sidebar)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            boxShadow:
              "0 16px 48px hsla(222,47%,4%,0.55), 0 0 0 1px var(--glass-outline)",
            overflow: "hidden",
          }}
        >
          {/* ── Identity header ── */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--glass-outline)",
              background: "hsla(0,0%,100%,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <UserAvatar user={user} appConfig={appConfig} size="md" />

              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {getUserDisplayName(user)}
                </p>

                {roleLabel && (
                  <p
                    style={{
                      margin: "1px 0 0",
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "var(--primary-resonance)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textTransform: "capitalize",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {roleLabel}
                  </p>
                )}

                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </p>

                {/* Only show status toggle when PresenceProvider is active */}
                {hasPresence && (
                  <PresenceToggle
                    status={status}
                    isConnected={isConnected}
                    onToggle={handleToggleStatus}
                    dotColor={statusDotColor}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Custom header slot (e.g. ChurchSelector) ── */}
          {customHeader && (
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid var(--glass-outline)",
              }}
            >
              {customHeader}
            </div>
          )}

          {/* ── Menu items ── */}
          <div style={{ padding: "6px" }}>
            {children}

            {showProfile && (
              <UserMenuItem
                icon={User}
                label="View Profile"
                active={location.pathname === "/profile"}
                onClick={() => {
                  setIsOpen(false);
                  onProfileClick?.();
                }}
              />
            )}

            {showPreferencesLink && (
              <UserMenuItem
                icon={SlidersHorizontal}
                label="Preferences"
                active={prefsActive}
                onClick={() => {
                  setIsOpen(false);
                  onPreferencesClick?.();
                }}
              />
            )}

            <ThemeRow />

            <MenuDivider />

            <UserMenuItem
              icon={LogOut}
              label="Sign out"
              onClick={handleLogout}
              variant="danger"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`relative ${className}`} style={{ display: "inline-flex" }}>
      {/* ── Trigger pill ──────────────────────────────────────────────────── */}
      <button
        ref={buttonRef}
        id={triggerId}
        onClick={handleToggle}
        onMouseEnter={() => setTriggerHover(true)}
        onMouseLeave={() => setTriggerHover(false)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
        aria-controls={isOpen ? panelId : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 10px 4px 4px",
          borderRadius: "100px",
          border: `1px solid ${triggerBorder}`,
          background: triggerBg,
          cursor: "pointer",
          transition: "all 200ms ease",
          outline: "none",
        }}
      >
        {/* Avatar + presence dot */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <UserAvatar user={user} appConfig={appConfig} size="xs" />
          {hasPresence && (
            <span
              style={{
                position: "absolute",
                bottom: "-2px",
                right: "-2px",
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: isConnected
                  ? statusDotColor
                  : "var(--color-warning, hsl(38,95%,54%))",
                border:
                  "2px solid var(--bg-sidebar, var(--bg-obsidian, #0a0e1a))",
                transition: "background 300ms ease",
              }}
              title={
                !isConnected
                  ? `Offline · ${status === "available" ? "Available" : "Unavailable"}`
                  : status === "available"
                    ? "Available"
                    : "Unavailable"
              }
              aria-hidden="true"
            />
          )}
        </div>

        {/* Name + role — hidden on mobile */}
        <div className="hidden md:block" style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              fontWeight: "500",
              color: "var(--text-secondary)",
              maxWidth: "110px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1.2,
            }}
          >
            {getUserDisplayName(user)}
          </p>
          {roleLabel && (
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                color: "var(--text-muted)",
                maxWidth: "110px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
                textTransform: "capitalize",
              }}
            >
              {roleLabel}
            </p>
          )}
        </div>

        {/* Offline badge (only when presence is active and disconnected) */}
        {hasPresence && !isConnected && (
          <WifiOff
            size={12}
            style={{
              color: "var(--color-warning, hsl(38,95%,54%))",
              flexShrink: 0,
            }}
            aria-label="Offline"
          />
        )}

        {/* Chevron */}
        <ChevronDown
          size={12}
          style={{
            color: "var(--text-ghost, var(--text-muted))",
            transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform 200ms ease",
            flexShrink: 0,
          }}
        />
      </button>

      {/* Portal renders into document.body — escapes overflow:hidden ancestors */}
      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </div>
  );
};

UserMenu.propTypes = {
  className: PropTypes.string,
  onProfileClick: PropTypes.func,
  onPreferencesClick: PropTypes.func,
  showProfileLink: PropTypes.bool,
  showPreferencesLink: PropTypes.bool,
  children: PropTypes.node,
  customHeader: PropTypes.node,
  position: PropTypes.oneOf([
    "bottom-right",
    "bottom-left",
    "top-right",
    "top-left",
  ]),
};

export { UserMenu };
export default UserMenu;
