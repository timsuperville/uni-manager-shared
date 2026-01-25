import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, Plus, Building2 } from "lucide-react";

const ChurchSelector = ({ className = "" }) => {
  const { user, switchChurch, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const churches = user?.churches || [];
  const currentChurchId = user?.currentChurch?._id || user?.currentChurch;
  const currentChurch = churches.find(
    (c) => (c.church?._id || c.church) === currentChurchId,
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSwitchChurch = async (churchId) => {
    if (churchId === currentChurchId) {
      setIsOpen(false);
      return;
    }
    try {
      await switchChurch(churchId);
      setIsOpen(false);
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to switch church:", error);
    }
  };

  const handleManageChurches = () => {
    setIsOpen(false);
    navigate("/onboarding");
  };

  if (!user || churches.length === 0) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Optional Label */}
      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 px-2 mb-1 uppercase tracking-wider">
        Switch Church
      </span>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:ring-2 hover:ring-indigo-100 dark:hover:ring-indigo-900/50 rounded-lg transition-all"
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span className="font-medium text-gray-700 dark:text-gray-200 truncate">
            {currentChurch?.church?.name || "Select Church"}
          </span>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-xl z-60 overflow-hidden animate-in fade-in zoom-in-95 duration-100 w-full sm:min-w-[240px]">
          <div className="max-h-64 overflow-y-auto py-1">
            {churches.map((membership) => {
              const church = membership.church;
              const churchId = church?._id || church;
              const isCurrent = churchId === currentChurchId;

              return (
                <button
                  key={churchId}
                  onClick={() => handleSwitchChurch(churchId)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                    isCurrent
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex flex-col items-start truncate mr-2">
                    <span className="font-medium truncate max-w-[180px]">
                      {church?.name || "Unknown"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {membership.role}
                    </span>
                  </div>
                  {isCurrent && (
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 p-1 bg-gray-50/50 dark:bg-gray-700/20">
            <button
              onClick={handleManageChurches}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Manage Churches
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

ChurchSelector.propTypes = {
  className: PropTypes.string,
};

export default ChurchSelector;
