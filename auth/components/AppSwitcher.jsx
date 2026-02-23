/**
 * SSO App Switcher Component
 *
 * Provides a unified interface for switching between applications
 * Displays available apps based on user permissions
 */

import React, { useState, useRef, useEffect } from "react";
import { useSSO } from "../context/SSOContext.jsx";

const AppSwitcher = () => {
  const {
    currentApp,
    availableApps,
    switchToApp,
    hasAppPermission,
    getAppInfo,
    ssoLoading,
    ssoError,
  } = useSSO();

  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen]);

  const handleAppSwitch = async (appId) => {
    if (appId === currentApp || switching) return;

    try {
      setSwitching(appId);
      setIsOpen(false);
      await switchToApp(appId);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("App switch failed:", error);
      }
      // Error handling is managed by SSOContext
    } finally {
      setSwitching(null);
    }
  };

  const getCurrentAppInfo = () => {
    return getAppInfo(currentApp);
  };

  const getAppIcon = (appId) => {
    const icons = {
      church: "⛪",
      admin: "🔧",
      business: "💼",
      home: "🏠",
      personal: "👤",
      playback: "▶️",
    };
    return icons[appId] || "📱";
  };

  const getAppDisplayName = (appId) => {
    const names = {
      church: "Church Management",
      admin: "Administration",
      business: "Business Tools",
      home: "Home Services",
      personal: "Personal Dashboard",
      playback: "Media Playback",
    };
    return names[appId] || "Unknown App";
  };

  if (ssoLoading || !currentApp) {
    return (
      <div className="relative inline-block opacity-70">
        <button
          disabled
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 min-w-40 box-shadow-admin cursor-not-allowed"
        >
          <span className="flex items-center justify-center w-5 h-5 text-base">
            📱
          </span>
          <span>Loading...</span>
        </button>
      </div>
    );
  }

  const filteredApps = availableApps.filter(
    (app) => app.id !== currentApp && hasAppPermission(app.id),
  );

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        className={`flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 min-w-40 transition-all duration-200 cursor-pointer shadow-admin ${
          isOpen
            ? "bg-gray-100 border-gray-500"
            : "hover:bg-gray-50 hover:border-gray-400 hover:shadow-admin-lg"
        } focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 disabled:cursor-not-allowed`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center justify-center w-5 h-5 text-base">
          {getAppIcon(currentApp)}
        </span>
        <span className="flex-1 text-left truncate">
          {getAppDisplayName(currentApp)}
        </span>
        <span
          className={`text-xs text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg shadow-lg z-1000 overflow-hidden animate-in fade-in"
          role="listbox"
        >
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            <span>Switch Application</span>
          </div>

          {filteredApps.length === 0 ? (
            <div className="px-3 py-4 text-center text-gray-600 text-sm italic">
              <span>No other apps available</span>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {filteredApps.map((app) => (
                <button
                  key={app.id}
                  className={`flex items-center gap-3 w-full px-3 py-3 border-b border-gray-100 text-left transition-colors duration-150 hover:bg-gray-50 focus:outline-none focus:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed ${
                    switching === app.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleAppSwitch(app.id)}
                  disabled={switching}
                  role="option"
                >
                  <span className="flex items-center justify-center w-5 h-5 text-base">
                    {getAppIcon(app.id)}
                  </span>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="font-medium text-gray-900 text-sm">
                      {getAppDisplayName(app.id)}
                    </span>
                    <span className="text-xs text-gray-600 line-clamp-1">
                      {app.description}
                    </span>
                  </div>
                  {switching === app.id && (
                    <span className="text-xs animate-spin">🔄</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
            <span className="font-medium">
              Currently in: {getAppDisplayName(currentApp)}
            </span>
          </div>
        </div>
      )}

      {ssoError && (
        <div
          className="absolute left-0 right-0 mt-1 bg-red-50 border border-red-300 rounded-lg px-3 py-2 flex items-center gap-1.5 text-xs text-red-700 z-999 animate-in slide-down"
          role="alert"
        >
          <span className="text-sm">⚠️</span>
          <span className="flex-1">{ssoError}</span>
        </div>
      )}

      {switching && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 animate-in fade-in">
          <div className="bg-white px-8 py-6 rounded-lg shadow-xl flex items-center gap-3 text-base font-medium text-gray-900">
            <span className="text-xl animate-spin">🔄</span>
            <span>Switching to {getAppDisplayName(switching)}...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppSwitcher;
