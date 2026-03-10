import React, { createContext, useContext } from "react";

/**
 * AuthShellContext — set to `true` by AuthLayout so nested AuthContainer
 * knows it is already inside a full-viewport shell and should NOT re-render
 * its own background, blobs, or min-h-screen centering.
 */
export const AuthShellContext = createContext(false);
export const useAuthShell = () => useContext(AuthShellContext);

type MaxWidth = "sm" | "md" | "lg" | "xl";

interface AuthContainerProps {
  children: React.ReactNode;
  maxWidth?: MaxWidth;
}

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
export const AuthContainer = ({ children, maxWidth = "md" }: AuthContainerProps) => {
  const isNested = useAuthShell();

  const maxWidths: Record<MaxWidth, string> = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
  };

  const card = (
    <div className={`w-full ${maxWidths[maxWidth]} relative z-10 animate-slideUpFade`}>
      <div
        className="backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden mx-auto"
        style={{
          background: "var(--glass-surface, hsla(265,28%,14%,0.76))",
          border: "1px solid var(--glass-outline, hsla(0,0%,100%,0.07))",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {children}
      </div>
    </div>
  );

  // Nested inside AuthLayout → just the card, no shell
  if (isNested) return card;

  // Standalone → full-viewport shell (legacy compat)
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden"
      style={{ background: "var(--bg-ecclesia, hsl(268,35%,5%))" }}
    >
      {/* Ambient blobs */}
      <div
        className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full blur-3xl"
        style={{ background: "var(--primary-glow, hsla(272,65%,62%,0.15))" }}
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-96 h-96 rounded-full blur-3xl"
        style={{ background: "var(--accent-amber-glow, hsla(38,90%,58%,0.08))" }}
      />
      {card}
    </div>
  );
};

export default AuthContainer;
