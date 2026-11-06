import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { Settings, Shield, Bell, Moon, Globe, CheckCircle2, Sparkles, Monitor, Sun } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [defaultCountry, setDefaultCountry] = useState('IN');
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const THEMES: { id: ThemeMode; name: string; desc: string; icon: any; color: string }[] = [
    { id: 'cyber', name: 'Cyber Dark', desc: 'Deep navy glass with electric cyan accents', icon: Sparkles, color: 'text-cyan-400 border-cyan-500/40' },
    { id: 'midnight', name: 'Midnight OLED', desc: 'Pitch black backdrop with high-contrast neon blues', icon: Moon, color: 'text-blue-400 border-blue-500/40' },
    { id: 'matrix', name: 'Matrix Terminal', desc: 'Tactical green phosphorous CRT aesthetic', icon: Monitor, color: 'text-emerald-400 border-emerald-500/40' },
    { id: 'light', name: 'Frosted Crystal', desc: 'Ultra-clean frosted glass with luminous borders', icon: Sun, color: 'text-cyan-600 border-cyan-400/40' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="pb-4 border-b border-[var(--border-glass)]">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>Investigator & Workspace Preferences</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure visual themes, glassmorphism aesthetics, regional defaults, and quota alerts.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3.5 glass-card border-emerald-500/60 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      {/* Visual Theme Switcher Section */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Interface Theme & Glassmorphism Mode</span>
        </div>
        <p className="text-xs text-slate-400">
          Select your preferred tactical interface theme. Changes take effect instantly across all dashboards, dossiers, and investigation tools.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {THEMES.map((t) => {
            const Icon = t.icon;
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-xl text-left transition-all flex items-start space-x-3 ${
                  isSelected
                    ? 'bg-cyan-500/20 border-2 border-cyan-400 shadow-lg shadow-cyan-950/50'
                    : 'glass-card hover:border-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl glass-card ${t.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>{t.name}</span>
                    {isSelected && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSave} className="glass-panel p-6 sm:p-8 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-white mb-2">Account & RBAC Authorization</h3>
          <div className="grid grid-cols-2 gap-4 text-xs font-mono p-3.5 glass-card rounded-xl">
            <div>
              <span className="text-slate-500">Identity:</span> <span className="text-slate-200">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-500">RBAC Role:</span> <span className="text-cyan-400 uppercase font-bold">{user?.role}</span>
            </div>
            <div>
              <span className="text-slate-500">Quota Allocation:</span> <span className="text-slate-200">{user?.api_quota} queries</span>
            </div>
            <div>
              <span className="text-slate-500">Quota Used:</span> <span className="text-slate-200">{user?.quota_used} queries</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--border-glass)] space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Default Country Parsing Region</span>
            </label>
            <select
              value={defaultCountry}
              onChange={(e) => setDefaultCountry(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="IN" className="bg-slate-900 text-white">India (+91)</option>
              <option value="NP" className="bg-slate-900 text-white">Nepal (+977)</option>
              <option value="US" className="bg-slate-900 text-white">United States (+1)</option>
              <option value="GB" className="bg-slate-900 text-white">United Kingdom (+44)</option>
              <option value="AE" className="bg-slate-900 text-white">United Arab Emirates (+971)</option>
              <option value="SG" className="bg-slate-900 text-white">Singapore (+65)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3.5 glass-card rounded-xl text-xs font-mono">
            <div>
              <div className="text-slate-200 font-semibold">Bulk Job Completion Notifications</div>
              <div className="text-slate-400 text-[11px]">Send real-time alerts when batch jobs reach 100%</div>
            </div>
            <input
              type="checkbox"
              checked={notifyOnComplete}
              onChange={(e) => setNotifyOnComplete(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-900 border-slate-700"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/60 transition-colors"
        >
          Save Preferences
        </button>
      </form>
    </div>
  );
};
