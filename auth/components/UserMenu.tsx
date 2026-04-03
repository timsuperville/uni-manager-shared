/**
 * UserMenu — Liquid Glass Edition (v3)
 *
 * Unified user menu used across ALL Uni-Manager apps.
 * This file is the orchestrator: it owns all state, effects, and handlers,
 * then delegates rendering to the sub-components in ./_userMenu/.
 *
 * Sub-components (internal, not for direct import):
 *   _userMenu/UserMenuTrigger   — the pill button
 *   _userMenu/UserMenuPanel     — the portal dropdown
 *   _userMenu/UserMenuItem      — individual menu items
 *   _userMenu/PresenceToggle    — online/offline status pill
 *   _userMenu/MenuDivider       — separator
 *   _userMenu/positionUtils     — viewport-aware coordinate calculation
 *
 * Props:
 *   onProfileClick        – called when "View Profile" is clicked
 *   onPreferencesClick    – called when "Preferences" is clicked
 *   showProfileLink       – show Profile item (default true)
 *   showPreferencesLink   – show Preferences item (default true)
 *   customHeader          – ReactNode injected below the identity header
 *   children              – extra menu items rendered before the standards
 *   position              – preferred anchor hint: "bottom-right" (default) |
 *                           "bottom-left" | "top-right" | "top-left"
 *                           (auto-flipped when near viewport edges)
 *   className             – extra class on the root div
 */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
  useId,
} from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { PresenceContext } from "../../context/PresenceContext";
import { getCurrentAppConfig } from "../config/appConfigs";
import { formatRole } from "../../utils";
import UserMenuSkeleton from "../../components/skeletons/UserMenuSkeleton";

import { computeDropdownCoords } from "./_userMenu/positionUtils";
import UserMenuTrigger from "./_userMenu/UserMenuTrigger";
import UserMenuPanel from "./_userMenu/UserMenuPanel";

// ─── UserMenu ─────────────────────────────────────────────────────────────────

type MenuPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

interface UserMenuProps {
  className?: string;
  onProfileClick?: () => void;
  onPreferencesClick?: () => void;
  showProfileLink?: boolean;
  showPreferencesLink?: boolean;
  children?: React.ReactNode;
  customHeader?: React.ReactNode;
  /** Preferred anchor hint — auto-flipped near viewport edges */
  position?: MenuPosition;
  /** Optional override — bypasses role auto-detection */
  roleLabel?: string;
}

const UserMenu = ({
  className = "",
  onProfileClick,
  onPreferencesClick,
  showProfileLink = true,
  showPreferencesLink = true,
  children,
  customHeader = null,
  position = "bottom-right",
  roleLabel: roleLabelProp,
}: UserMenuProps) => {
  const { user, logout, isLoading } = useAuth();

  // Safe presence consumption — undefined (not null) when provider is absent
  const presence = useContext(PresenceContext);
  const hasPresence = presence !== undefined && presence !== null;
  const isConnected = hasPresence ? (presence.isConnected ?? true) : true;
  const status = hasPresence ? presence.status || "available" : "available";
  const setStatus = hasPresence ? presence.setStatus : null;

  const appConfig = getCurrentAppConfig();
  const location = useLocation();
  const uid = useId(); // Unique per-instance — safe if multiple menus coexist

  const [isOpen, setIsOpen] = useState(false);
  const [triggerHover, setTriggerHover] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState({
    top: 0,
    left: 0,
    opensUpward: false,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Close on route change ──────────────────────────────────────────────────
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // ── Body scroll lock on mobile while menu is open ─────────────────────────
  // Prevents page scrolling behind the portal which would drift the coordinates.
  useEffect(() => {
    if (!isOpen || window.innerWidth >= 768) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // ── Close on click outside (panel is in portal, so two-ref check) ─────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const inTrigger = buttonRef.current?.contains(e.target as Node);
      const inPanel = panelRef.current?.contains(e.target as Node);
      if (!inTrigger && !inPanel) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // ── Portal coordinates ─────────────────────────────────────────────────────
  const openMenu = useCallback(() => {
    if (!buttonRef.current) return;
    setDropdownCoords(
      computeDropdownCoords(
        buttonRef.current.getBoundingClientRect(),
        position,
      ),
    );
    setIsOpen(true);
  }, [position]);

  // Recalculate on scroll/resize so panel tracks its trigger
  useEffect(() => {
    if (!isOpen) return;
    const recalc = () => {
      if (!buttonRef.current) return;
      setDropdownCoords(
        computeDropdownCoords(
          buttonRef.current.getBoundingClientRect(),
          position,
        ),
      );
    };
    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
    };
  }, [isOpen, position]);

  // ── Keyboard navigation (DOM-based — works regardless of visible items) ────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll('[role="menuitem"]'),
      ) as HTMLElement[];
      const currentIdx = items.indexOf(document.activeElement as HTMLElement);
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          items[currentIdx < items.length - 1 ? currentIdx + 1 : 0]?.focus();
          break;
        case "ArrowUp":
          e.preventDefault();
          items[currentIdx > 0 ? currentIdx - 1 : items.length - 1]?.focus();
          break;
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
    requestAnimationFrame(() => {
      const firstItem = panelRef.current?.querySelector(
        '[role="menuitem"]',
      ) as HTMLElement | null;
      firstItem?.focus();
    });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggle = useCallback(() => {
    isOpen ? setIsOpen(false) : openMenu();
  }, [isOpen, openMenu]);

  // Keep menu open while logout is in-flight so the "Signing out…" state is
  // visible. Re-enable the button if the logout request fails.
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsOpen(false);
    } catch (_err) {
      setIsLoggingOut(false);
    }
  }, [logout]);
  const handleToggleStatus = useCallback(() => {
    setStatus?.(status === "available" ? "unavailable" : "available");
  }, [status, setStatus]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const statusDotColor =
    status === "available"
      ? "var(--color-success, hsl(142,71%,45%))"
      : "var(--text-ghost, hsla(0,0%,100%,0.2))";

  const showProfile =
    showProfileLink && (appConfig.features?.profileManagement ?? true);
  const prefsActive =
    location.pathname === "/preferences" || location.pathname === "/settings";
  const isProfileActive = location.pathname === "/profile";
  // Compute the role label shown in the trigger pill and identity header.
  // Priority:
  //   1. Explicit `roleLabel` prop (caller knows best)
  //   2. Domain-specific fields on the user object (churchRole, title, position)
  //   3. user.role — ONLY if it is a recognised role in THIS app's permissions
  //      config. This prevents the global system role (e.g. super_admin →
  //      "Super Admin") from leaking into unrelated app contexts.
  const appRoles = appConfig.permissions?.roles ?? [];
  const extUser = user as typeof user & {
    churchRole?: string;
    title?: string;
    position?: string;
  };
  const roleLabel: string | undefined =
    roleLabelProp ??
    extUser?.churchRole ??
    extUser?.title ??
    extUser?.position ??
    (user?.role && appRoles.includes(user.role)
      ? formatRole(user.role)
      : undefined);

  const triggerId = `user-menu-trigger-${uid}`;
  const panelId = `user-menu-panel-${uid}`;

  const triggerBorder =
    isOpen || triggerHover
      ? "var(--glass-outline-active, var(--primary-resonance))"
      : "var(--glass-outline)";
  const triggerBg = isOpen
    ? "var(--primary-subtle, hsla(187,84%,44%,0.1))"
    : triggerHover
      ? "var(--nav-hover, hsla(0,0%,100%,0.06))"
      : "var(--bg-surface-1, hsla(0,0%,100%,0.04))";

  // ── Early returns ─────────────────────────────────────────────────────────
  if (isLoading) return <UserMenuSkeleton />;
  if (!user) return null;

  return (
    <div className={`relative ${className}`} style={{ display: "inline-flex" }}>
      <UserMenuTrigger
        buttonRef={buttonRef}
        triggerId={triggerId}
        panelId={panelId}
        isOpen={isOpen}
        user={user}
        appConfig={appConfig}
        roleLabel={roleLabel}
        hasPresence={hasPresence}
        isConnected={isConnected}
        status={status}
        statusDotColor={statusDotColor}
        onToggle={handleToggle}
        onMouseEnter={() => setTriggerHover(true)}
        onMouseLeave={() => setTriggerHover(false)}
        triggerBorder={triggerBorder}
        triggerBg={triggerBg}
      />

      {/* Portal — renders into document.body, escaping overflow:hidden ancestors */}
      {typeof document !== "undefined" &&
        createPortal(
          <UserMenuPanel
            panelRef={panelRef}
            panelId={panelId}
            isOpen={isOpen}
            dropdownCoords={dropdownCoords}
            user={user}
            appConfig={appConfig}
            roleLabel={roleLabel}
            hasPresence={hasPresence}
            status={status}
            isConnected={isConnected}
            statusDotColor={statusDotColor}
            onToggleStatus={handleToggleStatus}
            customHeader={customHeader}
            showProfile={showProfile}
            showPreferencesLink={showPreferencesLink}
            isProfileActive={isProfileActive}
            prefsActive={prefsActive}
            onProfileClick={onProfileClick}
            onPreferencesClick={onPreferencesClick}
            onClose={() => setIsOpen(false)}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
          >
            {children}
          </UserMenuPanel>,
          document.body,
        )}
    </div>
  );
};

export { UserMenu };
export default UserMenu;
