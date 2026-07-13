import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  // Read stored preference once on mount
  useEffect(() => {
    const stored = localStorage.getItem('crm-theme');
    if (stored) setIsDark(stored === 'dark');
  }, []);

  // Apply dark class to DOM whenever isDark changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('crm-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  return <ThemeContext.Provider value={{ isDark, toggle }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
