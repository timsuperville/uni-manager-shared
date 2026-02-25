import React from "react";
import PropTypes from "prop-types";

/**
 * Auth Card Content — Inner padding wrapper for the content inside an
 * AuthContainer card.
 */
export const AuthCardContent = ({ children }) => (
  <div className="px-6 py-8 sm:px-10 sm:py-12 space-y-6 sm:space-y-8">
    {children}
  </div>
);

AuthCardContent.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthCardContent;
