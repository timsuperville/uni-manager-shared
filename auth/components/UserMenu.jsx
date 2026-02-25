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
 *   children              – optional extra menu items added before the standard ones
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
import { User, LogOut, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useLocation } from "react-router-dom";

import { UserAvatar } from "../../components/ui";
import UserMenuSkeleton from "../../components/skeletons/UserMenuSkeleton";
import { formatRole, getUserDisplayName } from "../../utils";

// ─── UserMenuItem ─────────────────────────────────────────────────────────────
// Accessible menu button — uses CSS vars so it respects each app's accent colour.

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

// ─── UserMenu ─────────────────────────────────────────────────────────────────

const DROPDOWN_POSITION = {
  "bottom-right": { top: "calc(100% + 8px)", right: 0 },
  "bottom-left": { top: "calc(100% + 8px)", left: 0 },
  "top-right": { bottom: "calc(100% + 8px)", right: 0 },
  "top-left": { bottom: "calc(100% + 8px)", left: 0 },
};

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
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [triggerHover, setTriggerHover] = useState(false);

  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const menuItemsRef = useRef([]);

  // ── Close on click outside ──────────────────────────────────────────────────
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

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;
      const items = menuItemsRef.current.filter(Boolean);
      const lastIndex = items.length - 1;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((p) => (p < lastIndex ? p + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((p) => (p > 0 ? p - 1 : lastIndex));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && items[focusedIndex])
            items[focusedIndex].click();
          break;
        case "Escape":
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        default:
          break;
      }
    },
    [isOpen, focusedIndex],
  );

  useEffect(() => {
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    else setFocusedIndex(-1);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (focusedIndex >= 0 && menuItemsRef.current[focusedIndex]) {
      menuItemsRef.current[focusedIndex].focus();
    }
  }, [focusedIndex]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const toggleStatus = (e) => {
    e.stopPropagation();
    setStatus(status === "available" ? "unavailable" : "available");
  };

  // ── Derived values ───────────────────────────────────────────────────────────
  const statusDotColor =
    status === "available"
      ? "var(--color-success, hsl(142,71%,45%))"
      : "var(--text-ghost,  hsla(0,0%,100%,0.2))";

  const positionStyle =
    DROPDOWN_POSITION[position] ?? DROPDOWN_POSITION["bottom-right"];

  // Respect app config but default to showing profile if flag is absent
  const showProfile =
    showProfileLink && (appConfig.features?.profileManagement ?? true);

  // Preferences active on /preferences OR /settings (apps vary)
  const prefsActive =
    location.pathname === "/preferences" || location.pathname === "/settings";

  // ── Early returns ────────────────────────────────────────────────────────────
  if (isLoading) return <UserMenuSkeleton />;
  if (!user) return null;

  // ── Trigger style helpers ────────────────────────────────────────────────────
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
      {/* ── Trigger pill ───────────────────────────────────────────────────── */}
      <button
        ref={buttonRef}
        id="user-menu-trigger"
        onClick={() => setIsOpen((v) => !v)}
        onMouseEnter={() => setTriggerHover(true)}
        onMouseLeave={() => setTriggerHover(false)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
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

        {/* Display name — hidden on mobile */}
        <span
          className="hidden md:block"
          style={{
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--text-secondary)",
            maxWidth: "120px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1,
          }}
        >
          {getUserDisplayName(user)}
        </span>

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

      {/* ── Dropdown panel ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="menu"
            aria-label="User menu options"
            style={{
              position: "absolute",
              ...positionStyle,
              zIndex: 9000,
              width: "260px",
              borderRadius: "var(--radius-lg, 14px)",
              border: "1px solid var(--glass-outline)",
              background: "var(--bg-sidebar)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              boxShadow:
                "0 16px 48px hsla(222,47%,4%,0.5), 0 0 0 1px var(--glass-outline)",
              overflow: "hidden",
            }}
          >
            {/* Identity header */}
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
                      marginTop: "6px",
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
                    {status === "available" ? "Available" : "Unavailable"}
                  </button>
                </div>
              </div>
            </div>

            {/* Custom header slot (e.g. ChurchSelector) */}
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

            {/* Menu items */}
            <div style={{ padding: "6px" }} role="menu">
              {children}

              {showProfile && (
                <UserMenuItem
                  ref={(el) => (menuItemsRef.current[0] = el)}
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
                  ref={(el) => (menuItemsRef.current[1] = el)}
                  icon={SlidersHorizontal}
                  label="Preferences"
                  active={prefsActive}
                  onClick={() => {
                    setIsOpen(false);
                    onPreferencesClick?.();
                  }}
                />
              )}

              <MenuDivider />

              <UserMenuItem
                ref={(el) => (menuItemsRef.current[2] = el)}
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
