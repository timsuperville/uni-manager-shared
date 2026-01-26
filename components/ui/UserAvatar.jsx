import React from "react";
import { getUserInitials } from "../../utils";

/**
 * UserAvatar Component
 * Displays user avatar or initials with dynamic background color
 */
const UserAvatar = ({ user, appConfig, size = "md", className = "" }) => {
    const initials = getUserInitials(user);

    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-9 h-9 text-sm",
        lg: "w-10 h-10 text-base",
    };

    const baseClass = `rounded-full flex items-center justify-center font-semibold shadow-sm object-cover border border-gray-200 dark:border-gray-700 ${sizeClasses[size] || sizeClasses.md} ${className}`;

    if (user.avatarUrl) {
        return (
            <img
                src={user.avatarUrl}
                alt={`${user.firstName}'s avatar`}
                className={baseClass}
            />
        );
    }

    // Fallback color if appConfig is missing
    const bgColor = appConfig?.branding?.primaryColor || "#4F46E5";

    return (
        <div
            style={{ backgroundColor: bgColor }}
            className={`${baseClass} text-white`}
        >
            {initials}
        </div>
    );
};

export default UserAvatar;
