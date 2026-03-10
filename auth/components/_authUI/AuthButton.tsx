import React from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "danger";
type ButtonType = "button" | "submit" | "reset";

interface AuthButtonProps {
  children: React.ReactNode;
  type?: ButtonType;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * Auth Button — Primary action button for auth forms.
 * Supports primary / secondary / success / danger variants with an
 * optional loading spinner.
 *
 * The `primary` variant intentionally uses CSS custom properties
 * (`--primary-resonance`, `--primary-hover`) so that each app's
 * design token overrides drive the button colour automatically.
 * Apps that do not define these tokens fall back to a violet-indigo
 * gradient that harmonises with the default Liquid Glass spec.
 */
export const AuthButton = ({
  children,
  type = "button",
  onClick,
  disabled = false,
  variant = "primary",
  fullWidth = true,
  loading = false,
  className = "",
}: AuthButtonProps) => {
  const base =
    "inline-flex items-center justify-center px-4 py-3 sm:py-3.5 border border-transparent text-sm sm:text-base font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 transform active:scale-[0.98]";

  const variants: Record<ButtonVariant, string> = {
    primary:   "", // style applied inline below for CSS-var fidelity
    secondary: "bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white focus:ring-white/50",
    success:   "text-white bg-linear-to-r from-emerald-500 to-teal-700 hover:from-emerald-600 hover:to-teal-800 focus:ring-emerald-500 shadow-emerald-500/30 hover:shadow-emerald-500/40",
    danger:    "text-white bg-linear-to-r from-red-500 to-rose-700 hover:from-red-600 hover:to-rose-800 focus:ring-red-500 shadow-red-500/30 hover:shadow-red-500/40",
  };

  const primaryStyle: React.CSSProperties | undefined =
    variant === "primary"
      ? {
          background: "linear-gradient(135deg, var(--primary-resonance, hsl(272,65%,62%)), var(--accent-indigo, hsl(239,72%,66%)))",
          boxShadow: "0 4px 18px var(--primary-glow, hsla(272,65%,62%,0.32))",
          color: "white",
        }
      : undefined;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      style={primaryStyle}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default AuthButton;
