import React from "react";
import PropTypes from "prop-types";

/**
 * Auth Container — Full-viewport glassmorphism wrapper used as the outermost
 * shell for every auth page (login, signup, forgot password …).
 */
export const AuthContainer = ({ children, maxWidth = "md" }) => {
  const maxWidths = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Ambient blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />

      <div
        className={`w-full ${maxWidths[maxWidth]} relative z-10 animate-slideUpFade`}
      >
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700 shadow-2xl rounded-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5 mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

AuthContainer.propTypes = {
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
};

export default AuthContainer;
