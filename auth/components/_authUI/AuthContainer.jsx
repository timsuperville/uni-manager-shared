import React, { createContext, useContext } from "react";
import PropTypes from "prop-types";

/**
 * AuthShellContext — set to `true` by AuthLayout so nested AuthContainer
 * knows it is already inside a full-viewport shell and should NOT re-render
 * its own background, blobs, or min-h-screen centering.
 */
export const AuthShellContext = createContext(false);
export const useAuthShell = () => useContext(AuthShellContext);

/**
 * AuthContainer — Glass card wrapper for auth forms.
 *
 * **Standalone mode** (no AuthLayout parent):
 *   Renders a full-viewport centred shell with background + ambient blobs.
 *   This is the legacy behaviour — keeps backward compat for any route that
 *   renders a form without wrapping it in AuthLayout.
 *
 * **Nested mode** (inside AuthLayout):
 *   Strips the shell entirely (no min-h-screen, no background, no blobs).
 *   Renders only the glass card so AuthLayout's split panel is visible.
 */
export const AuthContainer = ({ children, maxWidth = "md" }) => {
  const isNested = useAuthShell();

  const maxWidths = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
  };

  const card = (
    <div
      className={`w-full ${maxWidths[maxWidth]} relative z-10 animate-slideUpFade`}
    >
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700 shadow-2xl rounded-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5 mx-auto">
        {children}
      </div>
    </div>
  );

  // Nested inside AuthLayout → just the card, no shell
  if (isNested) return card;

  // Standalone → full-viewport shell (legacy compat)
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Ambient blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
      {card}
    </div>
  );
};

AuthContainer.propTypes = {
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
};

export default AuthContainer;
