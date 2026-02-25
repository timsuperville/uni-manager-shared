import React from "react";
import PropTypes from "prop-types";

/**
 * Auth Card Content — Inner padding wrapper for the content inside an
 * AuthContainer card.
 */
export const AuthCardContent = ({ children }) => (
  <div className="px-6 py-6 sm:px-10 sm:py-10 space-y-5 sm:space-y-7">
    {children}
  </div>
);

AuthCardContent.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthCardContent;
