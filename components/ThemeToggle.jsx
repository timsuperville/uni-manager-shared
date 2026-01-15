import React from 'react';
import { useTheme } from './ThemeProvider';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ className = '', ...props }) {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            aria-label="Toggle theme"
            type="button"
            {...props}
        >
            <span className="sr-only">Toggle theme</span>
            {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
            ) : (
                <Moon className="h-5 w-5" />
            )}
        </button>
    );
}

export default ThemeToggle;
