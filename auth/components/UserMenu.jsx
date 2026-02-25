/**
 * UserMenu Component — Liquid Glass Edition
 *
 * Unified user menu used across ALL Uni-Manager apps.
 * Styling is driven entirely by CSS custom properties (var(--token)) so the
 * component automatically inherits each app's Liquid Glass theme without
 * any per-app overrides.
 *
 * Props:
 *   onProfileClick        – called when "View Profile" is clicked
 *   onPreferencesClick    – called when "Preferences" is clicked
 *   showProfileLink       – whether to show the Profile item (default true)
 *   showPreferencesLink   – whether to show the Preferences item (default true)
 *   customHeader          – optional ReactNode injected below the identity header
 *                           (used by church for the ChurchSelector)
 *   children              – optional extra menu items rendered before the standard ones
 *   position              – dropdown anchor: "bottom-right" | "bottom-left" |
 *                           "top-right" | "top-left"  (default "bottom-right")
 *   className             – extra class on the root wrapper
 */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
} from "react";
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

// ─── UserMenuItem ─────────────────────────────────────────────────────────────
// Accessible menu button — uses CSS vars so it respects each app's accent colour.
// Hover state managed via React (Tailwind hover: utilities can't reference CSS vars).

const UserMenuItem = React.forwardRef(
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
        {/* Active left accent bar */}
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
);

UserMenuItem.displayName = "UserMenuItem";

// ─── ThemeRow ─────────────────────────────────────────────────────────────────
// Inline row that shows "Appearance" label + ThemeToggle side-by-side.

function ThemeRow() {
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
}

// ─── Divider ──────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const DROPDOWN_POSITION = {
  "bottom-right": { top: "calc(100% + 8px)", right: 0 },
  "bottom-left": { top: "calc(100% + 8px)", left: 0 },
  "top-right": { bottom: "calc(100% + 8px)", right: 0 },
  "top-left": { bottom: "calc(100% + 8px)", left: 0 },
};

// Animation variants flip direction based on whether panel opens upward or downward
const dropdownVariants = {
  down: {
    initial: { opacity: 0, y: 8, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 8, scale: 0.96 },
  },
  up: {
    initial: { opacity: 0, y: -8, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.96 },
  },
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

  // Safe presence consumption — works even if PresenceProvider is absent
  const presence = useContext(PresenceContext);
  const isConnected = presence?.isConnected ?? true;
  const status = presence?.status || "available";
  const setStatus = presence?.setStatus || (() => {});

  const appConfig = getCurrentAppConfig();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [triggerHover, setTriggerHover] = useState(false);

  // We derive focusable items from the DOM rather than hardcoding indices, so
  // keyboard nav works correctly regardless of which items are shown or injected.
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  // ── Close on click outside ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // ── Keyboard navigation — DOM-based, index-independent ───────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen || !panelRef.current) return;

      // Gather all currently rendered [role="menuitem"] buttons in the panel
      const items = Array.from(
        panelRef.current.querySelectorAll('[role="menuitem"]'),
      );
      const focused = document.activeElement;
      const currentIdx = items.indexOf(focused);

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = currentIdx < items.length - 1 ? currentIdx + 1 : 0;
          items[next]?.focus();
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = currentIdx > 0 ? currentIdx - 1 : items.length - 1;
          items[prev]?.focus();
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
          // Let Tab close the menu and move focus naturally
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
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // Focus the first menu item on open
      requestAnimationFrame(() => {
        if (panelRef.current) {
          const first = panelRef.current.querySelector('[role="menuitem"]');
          first?.focus();
        }
      });
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const toggleStatus = (e) => {
    e.stopPropagation();
    setStatus(status === "available" ? "unavailable" : "available");
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const statusDotColor =
    status === "available"
      ? "var(--color-success, hsl(142,71%,45%))"
      : "var(--text-ghost, hsla(0,0%,100%,0.2))";

  const positionStyle =
    DROPDOWN_POSITION[position] ?? DROPDOWN_POSITION["bottom-right"];
  const isUpward = position === "top-right" || position === "top-left";
  const animVariant = isUpward ? dropdownVariants.up : dropdownVariants.down;

  // Respect app config but default to showing profile if flag is absent
  const showProfile =
    showProfileLink && (appConfig.features?.profileManagement ?? true);

  // Preferences active on /preferences OR /settings (apps use both)
  const prefsActive =
    location.pathname === "/preferences" || location.pathname === "/settings";

  // Role subtitle: prefer domain-specific role fields, fall back to formatRole
  const roleLabel =
    user?.churchRole ||
    user?.title ||
    user?.position ||
    (user?.role ? formatRole(user.role) : null);

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

  return (
    <div className={`relative user-menu ${className}`} ref={menuRef}>
      {/* ── Trigger pill ─────────────────────────────────────────────────── */}
      <button
        ref={buttonRef}
        id="user-menu-trigger"
        onClick={() => setIsOpen((v) => !v)}
        onMouseEnter={() => setTriggerHover(true)}
        onMouseLeave={() => setTriggerHover(false)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
        aria-controls={isOpen ? "user-menu-panel" : undefined}
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
          <span
            style={{
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: statusDotColor,
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
            aria-label={status === "available" ? "Available" : "Unavailable"}
          />
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

        {/* Offline indicator badge */}
        {!isConnected && (
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

      {/* ── Dropdown panel ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            id="user-menu-panel"
            initial={animVariant.initial}
            animate={animVariant.animate}
            exit={animVariant.exit}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="menu"
            aria-label="User menu options"
            style={{
              position: "absolute",
              ...positionStyle,
              zIndex: 9000,
              width: "264px",
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
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
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

                  {/* Presence status toggle */}
                  <button
                    onClick={toggleStatus}
                    style={{
                      marginTop: "7px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "2px 8px",
                      borderRadius: "100px",
                      background: "var(--bg-surface-1, hsla(0,0%,100%,0.04))",
                      border: "1px solid var(--glass-outline)",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "var(--text-secondary)",
                      transition: "all 150ms ease",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: statusDotColor,
                        flexShrink: 0,
                      }}
                    />
                    {!isConnected
                      ? "Offline"
                      : status === "available"
                        ? "Available"
                        : "Unavailable"}
                  </button>
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
              {/* Injected children appear first */}
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

              {/* Appearance / Theme row */}
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
    </div>
  );
};

export default UserMenu;
