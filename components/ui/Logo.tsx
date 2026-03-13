import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  withText?: boolean;
}

/**
 * Liquid Glass SVG Logo for Uni-Manager
 * Automatically adopts the current app's colour variables if present.
 */
export const Logo: React.FC<LogoProps> = ({ 
  className = "h-8 w-8", 
  withText = false, 
  ...props 
}) => {
  return (
    <div className={`flex items-center gap-3 ${withText ? "w-fit" : ""}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
        style={{ color: "var(--primary, currentColor)" }}
        {...props}
      >
        <defs>
          <linearGradient id="logo-grad-top" x1="50" y1="0" x2="50" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="logo-grad-bottom" x1="50" y1="100" x2="50" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id="logo-glow" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Global ambient glow */}
        <circle cx="50" cy="50" r="45" fill="url(#logo-glow)" />

        {/* Top Arc - Represents Church/Work */}
        <path
          d="M 50 15 C 65 15, 75 25, 75 40 C 75 46, 72 50, 68 53 C 63 56, 58 52, 55 48 L 50 42 L 45 48 C 42 52, 37 56, 32 53 C 28 50, 25 46, 25 40 C 25 25, 35 15, 50 15 Z"
          fill="url(#logo-grad-top)"
        />
        
        {/* Bottom Arc - Represents Home/Personal */}
        <path
          d="M 50 85 C 35 85, 25 75, 25 60 C 25 54, 28 50, 32 47 C 37 44, 42 48, 45 52 L 50 58 L 55 52 C 58 48, 63 44, 68 47 C 72 50, 75 54, 75 60 C 75 75, 65 85, 50 85 Z"
          fill="url(#logo-grad-bottom)"
        />

        {/* Connecting Nodes */}
        <circle cx="28" cy="50" r="9" fill="currentColor" fillOpacity="0.45" />
        <circle cx="72" cy="50" r="9" fill="currentColor" fillOpacity="0.45" />

        {/* Core Nexus (white center spark) */}
        <circle cx="50" cy="50" r="7" fill="#ffffff" fillOpacity="0.95" />
      </svg>

      {withText && (
        <span className="font-semibold text-lg tracking-tight" style={{ color: "var(--foreground, currentColor)" }}>
          Uni-Manager
        </span>
      )}
    </div>
  );
};

export default Logo;
