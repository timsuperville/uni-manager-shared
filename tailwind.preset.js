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
            },
        },
    },
    plugins: [],
};
