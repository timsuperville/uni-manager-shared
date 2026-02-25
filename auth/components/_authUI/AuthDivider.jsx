import React from "react";
import PropTypes from "prop-types";

/**
 * Auth Divider — Horizontal rule with centred label (e.g. "Or", "Or continue
 * with email") used to separate OAuth and email/password sections.
 */
export const AuthDivider = ({ text = "Or" }) => (
  <div className="relative my-6 sm:my-8 text-center">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200 dark:border-gray-700" />
    </div>
    <div className="relative inline-flex justify-center">
      <span className="px-4 text-sm text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full">
        {text}
      </span>
    </div>
  </div>
);

AuthDivider.propTypes = {
  text: PropTypes.string,
};

export default AuthDivider;
