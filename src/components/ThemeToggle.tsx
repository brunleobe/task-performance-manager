import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-xl border transition-all duration-300 flex items-center justify-center bg-slate-200/80 hover:bg-slate-300/80 border-slate-300 text-blue-900 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 dark:border-blue-800/50 dark:text-sky-300 shadow-sm ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          🌙 <span className="hidden md:inline">Dark</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          ☀️ <span className="hidden md:inline">Light</span>
        </span>
      )}
    </button>
  );
};
