"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="w-8 h-8 flex items-center justify-center text-mist hover:text-mist-2 transition-colors"
    >
      {theme === "dark" ? (
        // Sun — switch to light
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="7.5" cy="7.5" r="2.8" />
          <line x1="7.5" y1="1"   x2="7.5" y2="2.5" />
          <line x1="7.5" y1="12.5" x2="7.5" y2="14" />
          <line x1="1"   y1="7.5" x2="2.5" y2="7.5" />
          <line x1="12.5" y1="7.5" x2="14"  y2="7.5" />
          <line x1="2.9" y1="2.9" x2="3.9" y2="3.9" />
          <line x1="11.1" y1="11.1" x2="12.1" y2="12.1" />
          <line x1="12.1" y1="2.9" x2="11.1" y2="3.9" />
          <line x1="3.9"  y1="11.1" x2="2.9" y2="12.1" />
        </svg>
      ) : (
        // Moon — switch to dark
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M6.5 1.5a5.5 5.5 0 1 0 6 6 4 4 0 0 1-6-6z" />
        </svg>
      )}
    </button>
  );
}
