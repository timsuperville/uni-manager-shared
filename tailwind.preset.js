import { colors, typography } from './theme/index.js';

/** @type {import('tailwindcss').Config} */
export default {
    theme: {
        extend: {
            colors: {
                ...colors,
                // Make sure 'slate' is available as the default gray if needed, or mapped
                gray: colors.slate,
            },
            fontFamily: typography.fontFamily,
            // Common animations can be added here
            animation: {
                "fade-in": "fadeIn 0.3s ease-in-out",
                "slide-in": "slideIn 0.3s ease-out",
                "slide-up": "slideUp 0.3s ease-out",
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "gradient-xy": "gradient-xy 15s ease infinite",
                "blob": "blob 7s infinite",
                "slideRightFade": "slideRightFade 0.5s ease-out",
                "slideUpFade": "slideUpFade 0.5s ease-out",
                "fadeIn": "fadeIn 0.5s ease-out", // Alias for easier usage matches variable name
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideIn: {
                    "0%": { transform: "translateX(-100%)" },
                    "100%": { transform: "translateX(0)" },
                },
                slideUp: {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                "gradient-xy": {
                    "0%, 100%": {
                        "background-size": "400% 400%",
                        "background-position": "left center"
                    },
                    "50%": {
                        "background-size": "200% 200%",
                        "background-position": "right center"
                    }
                },
                blob: {
                    "0%": { transform: "translate(0px, 0px) scale(1)" },
                    "33%": { transform: "translate(30px, -50px) scale(1.1)" },
                    "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
                    "100%": { transform: "translate(0px, 0px) scale(1)" }
                },
                slideRightFade: {
                    "0%": { opacity: "0", transform: "translateX(-20px)" },
                    "100%": { opacity: "1", transform: "translateX(0)" }
                },
                slideUpFade: {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" }
                }
            },
        },
    },
    plugins: [],
};
