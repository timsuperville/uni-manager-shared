/**
 * UserMenu Component
 * Unified user menu with app-specific branding, accessibility, and animations
 */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { PresenceContext } from "../../context/PresenceContext"; // Use relative path to ensure context identity match
import { getCurrentAppConfig } from "../config/appConfigs.js";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useLocation } from "react-router-dom";

import { UserAvatar } from "../../components/ui";
import UserMenuSkeleton from "../../components/skeletons/UserMenuSkeleton";
import { formatRole, getUserDisplayName } from "../../utils";

/**
 * UserMenuItem Component
 * accessible menu item with support for icons and variants
 */
const UserMenuItem = React.forwardRef(
  (
    {
      icon: Icon,
      label,
      onClick,
      className = "",
      variant = "default",
      active = false,
    },
    ref,
  ) => {
    const baseClasses =
      "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg focus:outline-none transition-colors group relative";
    const variants = {
      default: active
        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800",
      danger:
        "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20",
    };

    const iconClasses =
      variant === "danger"
        ? "w-4 h-4 group-hover:scale-110 transition-transform"
        : `w-4 h-4 transition-colors ${active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-indigo-400"}`;

    return (
      <button
        ref={ref}
        onClick={onClick}
        className={`${baseClasses} ${variants[variant]} ${className}`}
        role="menuitem"
        aria-current={active ? "page" : undefined}
      >
        {active && (
          <motion.div
            layoutId="active-menu-item"
            className="absolute left-0 w-1 h-6 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
        <Icon className={iconClasses} />
        {label}
      </button>
    );
  },
);

UserMenuItem.displayName = "UserMenuItem";

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
  // Safe usePresence (optional consumption)

  // Safe presence consumption
  // We use useContext directly instead of the hook because the hook throws if provider is missing
  // This allows UserMenu to work in apps without PresenceProvider while still being reactive
  const presence = useContext(PresenceContext);

  const isConnected = presence?.isConnected ?? true;
  const status = presence?.status || "available";
  const setStatus = presence?.setStatus || (() => {});

  const appConfig = getCurrentAppConfig();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const menuItemsRef = useRef([]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Keyboard Navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;

      const items = menuItemsRef.current.filter(Boolean);
      const lastIndex = items.length - 1;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev < lastIndex ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : lastIndex));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && items[focusedIndex]) {
            items[focusedIndex].click();
          }
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
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    } else {
      setFocusedIndex(-1);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Focus effect
  useEffect(() => {
    if (focusedIndex >= 0 && menuItemsRef.current[focusedIndex]) {
      menuItemsRef.current[focusedIndex].focus();
    }
  }, [focusedIndex]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const toggleStatus = (e) => {
    e.stopPropagation(); // Prevent menu from closing if we want to keep it open, or let it close
    const newStatus = status === "available" ? "unavailable" : "available";
    setStatus(newStatus);
  };

  const getPositionClasses = () => {
    switch (position) {
      case "bottom-left":
        return "top-full left-0 mt-2";
      case "top-right":
        return "bottom-full right-0 mb-2";
      case "top-left":
        return "bottom-full left-0 mb-2";
      case "bottom-right":
      default:
        return "top-full right-0 mt-2";
    }
  };

  const getStatusColor = () => {
    // Show status color even if offline/disconnected to ensure UI feedback
    return status === "available" ? "bg-green-500" : "bg-gray-400";
  };

  if (isLoading) return <UserMenuSkeleton />;
  if (!user) return null;

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User Menu"
        className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        <div className="relative">
          <UserAvatar user={user} appConfig={appConfig} size="md" />
          {/* Availability Indicator */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white dark:border-gray-900 rounded-full ${getStatusColor()} ring-1 ring-white/20 dark:ring-gray-900/20`}
            title={
              !isConnected
                ? `Offline (${status === "available" ? "Available" : "Unavailable"})`
                : status === "available"
                  ? "Available"
                  : "Unavailable"
            }
            aria-label={status === "available" ? "Available" : "Unavailable"}
          />
        </div>

        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
            {getUserDisplayName(user)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {user.churchRole ||
              user.title ||
              user.position ||
              formatRole(user.role)}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute ${getPositionClasses()} w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden ring-1 ring-black/5`}
          >
            {/* Header / Brand Area */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <UserAvatar user={user} appConfig={appConfig} size="lg" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {getUserDisplayName(user)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                  {/* Status Toggle in Header */}
                  <button
                    onClick={toggleStatus}
                    className="mt-1 text-xs flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${status === "available" ? "bg-green-500" : "bg-gray-400"}`}
                    />
                    <span className="text-gray-600 dark:text-gray-300">
                      {status === "available" ? "Available" : "Unavailable"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Slot (e.g. Church Selector) */}
            {customHeader && (
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                {customHeader}
              </div>
            )}

            {/* Menu Items */}
            <div className="p-2 space-y-0.5" role="menu">
              {children}

              {showProfileLink && appConfig.features.profileManagement && (
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
                  active={location.pathname === "/preferences"}
                  onClick={() => {
                    setIsOpen(false);
                    onPreferencesClick?.();
                  }}
                />
              )}

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />

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
