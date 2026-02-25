import React from "react";
import PropTypes from "prop-types";
import { AnimatePresence, motion } from "framer-motion";
import { User, LogOut, SlidersHorizontal } from "lucide-react";
import { useLocation } from "react-router-dom";

import { UserAvatar } from "../../../components/ui";
import UserMenuItem from "./UserMenuItem";
import PresenceToggle from "./PresenceToggle";

import MenuDivider from "./MenuDivider";
import { DROPDOWN_W } from "./positionUtils";
import { getUserDisplayName } from "../../../utils";

/**
 * UserMenuPanel — the portal-rendered Glass dropdown.
 * All data is passed in from UserMenu; this component is purely presentational.
 */
function UserMenuPanel({
  panelRef,
  panelId,
  isOpen,
  dropdownCoords,
  user,
  appConfig,
  roleLabel,
  hasPresence,
  status,
  isConnected,
  statusDotColor,
  onToggleStatus,
  customHeader,
  children,
  showProfile,
  showPreferencesLink,
  prefsActive,
  onProfileClick,
  onPreferencesClick,
  onClose,
  onLogout,
}) {
  const location = useLocation();
  const { opensUpward } = dropdownCoords;

  const animVariant = {
    initial: { opacity: 0, y: opensUpward ? -8 : 8, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: opensUpward ? -8 : 8, scale: 0.96 },
  };

  return (
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

                {hasPresence && (
                  <PresenceToggle
                    status={status}
                    isConnected={isConnected}
                    onToggle={onToggleStatus}
                    dotColor={statusDotColor}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Custom header slot ── */}
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
                  onClose();
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
                  onClose();
                  onPreferencesClick?.();
                }}
              />
            )}

            <MenuDivider />

            <UserMenuItem
              icon={LogOut}
              label="Sign out"
              onClick={onLogout}
              variant="danger"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

UserMenuPanel.propTypes = {
  panelRef: PropTypes.object.isRequired,
  panelId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  dropdownCoords: PropTypes.shape({
    top: PropTypes.number,
    left: PropTypes.number,
    opensUpward: PropTypes.bool,
  }).isRequired,
  user: PropTypes.object.isRequired,
  appConfig: PropTypes.object.isRequired,
  roleLabel: PropTypes.string,
  hasPresence: PropTypes.bool.isRequired,
  status: PropTypes.string.isRequired,
  isConnected: PropTypes.bool.isRequired,
  statusDotColor: PropTypes.string.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  customHeader: PropTypes.node,
  children: PropTypes.node,
  showProfile: PropTypes.bool.isRequired,
  showPreferencesLink: PropTypes.bool.isRequired,
  prefsActive: PropTypes.bool.isRequired,
  onProfileClick: PropTypes.func,
  onPreferencesClick: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default UserMenuPanel;
