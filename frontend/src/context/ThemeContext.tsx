import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'cyber' | 'midnight' | 'matrix' | 'light';

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  description: string;
  iconName: string;
  badgeBg: string;
  accentColor: string;
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: 'cyber',
    name: 'Cyber Dark',
    description: 'Deep navy obsidian with neon cyan & intelligence glow (Default)',
    iconName: 'Terminal',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    accentColor: '#06b6d4',
  },
  {
    id: 'midnight',
    name: 'Midnight OLED',
    description: 'Pitch black #000000 with electric violet & deep glass highlights',
    iconName: 'Moon',
    badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    accentColor: '#8b5cf6',
  },
  {
    id: 'matrix',
    name: 'Matrix Hacker',
    description: 'Phosphor hacker emerald neon on deep obsidian grid',
    iconName: 'Cpu',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    accentColor: '#10b981',
  },
  {
    id: 'light',
    name: 'Frosted Crystal (Light)',
    description: 'Clean frosted glass with high-contrast sharp typography',
    iconName: 'Sun',
    badgeBg: 'bg-blue-500/20 text-blue-700 border-blue-500/40',
    accentColor: '#2563eb',
  },
];

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  currentThemeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('numberintel_theme') as ThemeMode;
    return saved && ['cyber', 'midnight', 'matrix', 'light'].includes(saved) ? saved : 'cyber';
  });

  useEffect(() => {
    localStorage.setItem('numberintel_theme', theme);
    const root = document.documentElement;
    root.classList.remove('theme-cyber', 'theme-midnight', 'theme-matrix', 'theme-light');
    root.classList.add(`theme-${theme}`);
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const currentThemeConfig = AVAILABLE_THEMES.find((t) => t.id === theme) || AVAILABLE_THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentThemeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
