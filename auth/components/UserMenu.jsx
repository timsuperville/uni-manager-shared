/**
 * UserMenu Component
 * Unified user menu with app-specific branding, accessibility, and animations
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getCurrentAppConfig } from "../config/appConfigs.js";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useLocation } from "react-router-dom";

/**
 * Helper to format system roles into friendly display names
 */
const formatRole = (role) => {
  if (!role) return "User";
  return role
    .replace(/_/g, " ") // super_admin -> super admin
    .replace(/\b\w/g, (c) => c.toUpperCase()); // super admin -> Super Admin
};

/**
 * A generic, accessible generic user menu.
 * @param {React.ReactNode} customHeader - Optional content to render at the top of the menu (e.g. ChurchSelector)
 * @param {string} position - Dropdown position
 */
const MenuItem = React.forwardRef(
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

const UserMenuSkeleton = () => (
  <div className="flex items-center space-x-3 p-2 rounded-xl animate-pulse">
    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
    <div className="hidden md:block space-y-2">
      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  </div>
);

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
  const appConfig = getCurrentAppConfig();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const menuItemsRef = useRef([]);

  // Initialize Dark Mode state
  useEffect(() => {
    if (typeof document !== "undefined") {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    }
  }, []);

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

      const items = menuItemsRef.current.filter(Boolean); // Filter nulls
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

  if (isLoading) return <UserMenuSkeleton />;
  if (!user) return null;

  const initials =
    user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : (user.email?.[0] || "U").toUpperCase();

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
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.firstName}'s avatar`}
              className="w-9 h-9 rounded-full object-cover shadow-sm border border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div
              style={{ backgroundColor: appConfig.branding.primaryColor }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm"
            >
              {initials}
            </div>
          )}
          {/* Online Indicator */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
        </div>

        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.email}
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
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div
                    style={{ backgroundColor: appConfig.branding.primaryColor }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-sm"
                  >
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user.firstName
                      ? `${user.firstName} ${user.lastName}`
                      : "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
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
                <MenuItem
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
                <MenuItem
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

              <MenuItem
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
