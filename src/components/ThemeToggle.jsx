import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative p-2 rounded-full transition-all duration-300 flex items-center justify-center select-none ${
        isDark
          ? 'bg-slate-800 text-amber-300 hover:bg-slate-700 hover:text-amber-200 border border-slate-700 shadow-md'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-indigo-600 border border-slate-200 shadow-sm'
      } ${className}`}
      title={isDark ? "Switch to Light Mode ☀" : "Switch to Dark Mode ☾"}
      aria-label="Toggle Theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {isDark ? (
          <Sun className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100 fill-amber-300/20" />
        ) : (
          <Moon className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100 fill-indigo-600/20" />
        )}
      </div>
    </button>
  );
};
