import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-xl border transition-all duration-300 flex items-center justify-center bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:border-white/10 dark:text-amber-400 shadow-sm ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          🌙 <span className="hidden md:inline"></span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          ☀️ <span className="hidden md:inline"></span>
        </span>
      )}
    </button>
  );
};
