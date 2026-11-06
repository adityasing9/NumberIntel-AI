import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, AVAILABLE_THEMES, ThemeMode } from '../../context/ThemeContext';
import {
  Shield,
  Bell,
  User,
  LogOut,
  Terminal,
  Activity,
  Palette,
  Moon,
  Sun,
  Cpu,
  Check,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme, currentThemeConfig } = useTheme();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemeIcon = (id: ThemeMode) => {
    switch (id) {
      case 'cyber':
        return <Terminal className="w-3.5 h-3.5 text-cyan-400" />;
      case 'midnight':
        return <Moon className="w-3.5 h-3.5 text-violet-400" />;
      case 'matrix':
        return <Cpu className="w-3.5 h-3.5 text-emerald-400" />;
      case 'light':
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <header className="h-16 glass-panel border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-30 shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-3 py-1 rounded-full shadow-inner shadow-cyan-950/40">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="tracking-wider font-semibold">SYSTEM LIVE</span>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>DPDP 2023 COMPLIANT • ZERO FABRICATION ENGINE</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* THEME SWITCHER DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl glass-button text-xs font-mono text-slate-200 hover:text-white transition-all shadow-sm"
            title="Switch Visual Theme"
          >
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline font-semibold">{currentThemeConfig.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {themeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl border border-white/15 p-2 shadow-2xl z-50 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-white/10 mb-1">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Display Theme</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold">Glassmorphism</span>
              </div>
              <div className="space-y-1">
                {AVAILABLE_THEMES.map((t) => {
                  const isActive = t.id === theme;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-cyan-500/20 text-white border border-cyan-500/40 shadow-inner'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 rounded-lg bg-black/40 border border-white/10">
                          {getThemeIcon(t.id)}
                        </div>
                        <div>
                          <div className="font-bold flex items-center space-x-1.5">
                            <span>{t.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans line-clamp-1">
                            {t.description.split('(')[0]}
                          </div>
                        </div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center space-x-3 pl-3 border-l border-white/10">
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold text-slate-100">{user.full_name || user.email}</div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">{user.role}</div>
            </div>
            <div className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-cyan-400 font-bold border border-cyan-500/30">
              <User className="w-4 h-4" />
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/30"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
