import React from 'react';

interface AuthCardContentProps {
  children: React.ReactNode;
}

/**
 * Auth Card Content — Inner padding wrapper for the content inside an
 * AuthContainer card.
 */
export const AuthCardContent = ({ children }: AuthCardContentProps) => (
  <div className="px-6 py-5 sm:px-10 sm:py-8 space-y-4 sm:space-y-6">
    {children}
  </div>
);

export default AuthCardContent;
