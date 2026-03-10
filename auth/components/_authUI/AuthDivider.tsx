import React from "react";

interface AuthDividerProps {
  text?: string;
}

/**
 * Auth Divider — Horizontal rule with centred label (e.g. "Or", "Or continue
 * with email") used to separate OAuth and email/password sections.
 */
export const AuthDivider = ({ text = "Or" }: AuthDividerProps) => (
  <div className="relative my-4 sm:my-5 text-center">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200 dark:border-gray-700" />
    </div>
    <div className="relative inline-flex justify-center">
      <span className="px-3 text-xs font-medium text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 uppercase tracking-widest">
        {text}
      </span>
    </div>
  </div>
);

export default AuthDivider;
