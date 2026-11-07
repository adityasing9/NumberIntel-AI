import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { investigationService } from '../services/api';
import { truecallerService } from '../services/truecallerService';
import { getLocalInvestigations, getLocalTableItems, clearAllLocalData } from '../services/localIntelligence';
import {
  Settings,
  Shield,
  Bell,
  Moon,
  Globe,
  CheckCircle2,
  Sparkles,
  Monitor,
  Sun,
  Trash2,
  AlertTriangle,
  Database,
  Key,
  RefreshCw,
  HardDrive,
  FileText,
  X
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [defaultCountry, setDefaultCountry] = useState('IN');
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);
  const [dataMsg, setDataMsg] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Storage metrics
  const [invCount, setInvCount] = useState(0);
  const [phoneCount, setPhoneCount] = useState(0);
  const [storageKb, setStorageKb] = useState(0);
  const [hasTcToken, setHasTcToken] = useState(false);

  // Modals
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [isFactoryResetModalOpen, setIsFactoryResetModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const calculateStorage = () => {
    try {
      const invs = getLocalInvestigations();
      const items = getLocalTableItems();
      setInvCount(invs.length);

      let totalPhones = 0;
      Object.values(items).forEach((arr) => {
        totalPhones += arr.length;
      });
      setPhoneCount(totalPhones);

      // Estimate storage bytes in localStorage
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('numberintel')) {
          totalBytes += (localStorage.getItem(key) || '').length * 2;
        }
      }
      setStorageKb(Math.max(1, Math.round(totalBytes / 1024)));
      setHasTcToken(!!truecallerService.getToken());
    } catch (e) {
      // Fallback
    }
  };

  useEffect(() => {
    calculateStorage();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      await investigationService.deleteAll();
      calculateStorage();
      setIsClearHistoryModalOpen(false);
      setDataMsg({ text: 'All investigation dossiers and compiled phone records successfully deleted.', type: 'success' });
      setTimeout(() => setDataMsg(null), 5000);
    } catch (err) {
      setDataMsg({ text: 'Failed to clear investigation history.', type: 'danger' });
    } finally {
      setIsClearing(false);
    }
  };

  const handleDisconnectTruecaller = () => {
    truecallerService.clearToken();
    calculateStorage();
    setDataMsg({ text: 'Truecaller gateway credentials and token removed.', type: 'success' });
    setTimeout(() => setDataMsg(null), 4000);
  };

  const handleFactoryReset = async () => {
    setIsClearing(true);
    try {
      await investigationService.clearAllData(true);
      calculateStorage();
      setIsFactoryResetModalOpen(false);
      setDataMsg({ text: 'Application factory reset complete. All local records, keys, and cached data wiped.', type: 'success' });
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (err) {
      setDataMsg({ text: 'Factory reset encountered an error.', type: 'danger' });
    } finally {
      setIsClearing(false);
    }
  };

  const THEMES: { id: ThemeMode; name: string; desc: string; icon: any; color: string }[] = [
    { id: 'cyber', name: 'Cyber Dark', desc: 'Deep navy glass with electric cyan accents', icon: Sparkles, color: 'text-cyan-400 border-cyan-500/40' },
    { id: 'midnight', name: 'Midnight OLED', desc: 'Pitch black backdrop with high-contrast neon blues', icon: Moon, color: 'text-blue-400 border-blue-500/40' },
    { id: 'matrix', name: 'Matrix Terminal', desc: 'Tactical green phosphorous CRT aesthetic', icon: Monitor, color: 'text-emerald-400 border-emerald-500/40' },
    { id: 'light', name: 'Frosted Crystal', desc: 'Ultra-clean frosted glass with luminous borders', icon: Sun, color: 'text-cyan-600 border-cyan-400/40' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Page Header */}
      <div className="pb-4 border-b border-[var(--border-glass)]">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>Investigator & Workspace Preferences</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure visual themes, regional telephone defaults, storage management, and statutory privacy controls.
        </p>
      </div>

      {/* Status Notifications */}
      {savedMsg && (
        <div className="p-3.5 glass-card border-emerald-500/60 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      {dataMsg && (
        <div className={`p-3.5 glass-card rounded-xl text-xs flex items-center space-x-2 font-mono ${
          dataMsg.type === 'success' ? 'border-emerald-500/60 text-emerald-300' : 'border-rose-500/60 text-rose-300'
        }`}>
          {dataMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{dataMsg.text}</span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: DATA MANAGEMENT & PRIVACY CONTROLS (CLEAR ALL DATA)
         ========================================================================= */}
      <div className="glass-panel p-6 sm:p-7 space-y-5 border-rose-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-glass)]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/15 rounded-xl border border-rose-500/30 text-rose-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Data Management & Storage Footprint</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/80 text-rose-300 border border-rose-800">
                  DPDP 2023 Compliant
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Permanently purge search records, cached dossiers, gateway credentials, or perform a complete factory wipe.
              </p>
            </div>
          </div>

          <button
            onClick={calculateStorage}
            className="self-start sm:self-auto px-2.5 py-1.5 glass-button text-xs font-mono text-slate-300 hover:text-white flex items-center space-x-1 rounded-lg"
            title="Refresh memory metrics"
          >
            <RefreshCw className="w-3 h-3 text-cyan-400" />
            <span>Recalculate</span>
          </button>
        </div>

        {/* Live Storage Footprint Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="glass-card p-3 rounded-xl space-y-1">
            <div className="text-slate-400 text-[10px] uppercase">Dossier Cases</div>
            <div className="text-lg font-bold text-white">{invCount}</div>
            <div className="text-[10px] text-slate-500">Recorded cases</div>
          </div>

          <div className="glass-card p-3 rounded-xl space-y-1">
            <div className="text-slate-400 text-[10px] uppercase">Target Records</div>
            <div className="text-lg font-bold text-cyan-300">{phoneCount}</div>
            <div className="text-[10px] text-slate-500">Phone dossiers compiled</div>
          </div>

          <div className="glass-card p-3 rounded-xl space-y-1">
            <div className="text-slate-400 text-[10px] uppercase">Storage Usage</div>
            <div className="text-lg font-bold text-slate-200">{storageKb} KB</div>
            <div className="text-[10px] text-slate-500">Local cache footprint</div>
          </div>

          <div className="glass-card p-3 rounded-xl space-y-1">
            <div className="text-slate-400 text-[10px] uppercase">Truecaller Gateway</div>
            <div className={`text-xs font-bold mt-1 ${hasTcToken ? 'text-emerald-400' : 'text-slate-500'}`}>
              {hasTcToken ? 'Active Session' : 'Not Connected'}
            </div>
            <div className="text-[10px] text-slate-500">Token credentials</div>
          </div>
        </div>

        {/* Action Buttons for Clearing Data */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Action 1: Clear History */}
          <button
            type="button"
            onClick={() => setIsClearHistoryModalOpen(true)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Clear Investigation History & Dossiers</span>
          </button>

          {/* Action 2: Truecaller Disconnect (if connected) */}
          {hasTcToken && (
            <button
              type="button"
              onClick={handleDisconnectTruecaller}
              className="px-4 py-2.5 rounded-xl glass-button text-amber-300 hover:text-amber-200 border-amber-500/40 text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>Disconnect Truecaller</span>
            </button>
          )}

          {/* Action 3: Complete Factory Reset */}
          <button
            type="button"
            onClick={() => setIsFactoryResetModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center justify-center space-x-2 shadow-lg shadow-rose-950/60 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Factory Reset (Clear All Data)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: VISUAL THEME SWITCHER
         ========================================================================= */}
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

      {/* =========================================================================
          SECTION 3: ACCOUNT & RBAC FORM
         ========================================================================= */}
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

      {/* =========================================================================
          MODAL 1: CLEAR INVESTIGATION HISTORY CONFIRMATION
         ========================================================================= */}
      {isClearHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel border border-rose-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2.5 text-rose-400">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-bold text-white">Clear All Investigation History</h3>
              </div>
              <button
                onClick={() => setIsClearHistoryModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Are you sure you want to delete all <strong className="text-rose-300">{invCount} investigation dossier(s)</strong> and <strong className="text-rose-300">{phoneCount} phone record(s)</strong> from your workspace?
            </p>

            <div className="p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl text-[11px] font-mono text-rose-300">
              ⚠️ Warning: This action permanently removes compiled dossiers and search history. Your login session and theme preferences will be kept.
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearHistoryModalOpen(false)}
                className="px-4 py-2 glass-button text-slate-300 hover:text-white rounded-xl text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={isClearing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg shadow-rose-950/60 flex items-center space-x-1.5"
              >
                {isClearing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Yes, Clear History</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: FACTORY RESET (CLEAR ALL DATA) CONFIRMATION
         ========================================================================= */}
      {isFactoryResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel border-2 border-rose-600 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/30">
              <div className="flex items-center space-x-2.5 text-rose-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-white">Factory Reset & Complete Data Wipe</h3>
              </div>
              <button
                onClick={() => setIsFactoryResetModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-200 font-sans leading-relaxed">
              This is the <strong className="text-rose-400">master purge option</strong>. It will permanently wipe:
            </p>

            <ul className="text-xs font-mono text-slate-300 space-y-1.5 pl-4 list-disc">
              <li>All {invCount} investigation dossiers & cases</li>
              <li>All {phoneCount} compiled telephone intel records</li>
              <li>Connected Truecaller Gateway API tokens</li>
              <li>Cached OSINT queries, avatars & search snippets</li>
              <li>Stored credentials and local session tokens</li>
            </ul>

            <div className="p-3 bg-rose-950/60 border border-rose-700 rounded-xl text-[11px] font-mono text-rose-200 font-semibold">
              🚨 Caution: You will be logged out and the workspace will return to a clean, empty state.
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFactoryResetModalOpen(false)}
                className="px-4 py-2 glass-button text-slate-300 hover:text-white rounded-xl text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFactoryReset}
                disabled={isClearing}
                className="px-4 py-2 bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 text-white rounded-xl text-xs font-mono font-bold shadow-xl shadow-rose-950/80 flex items-center space-x-1.5"
              >
                {isClearing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>Wipe Everything & Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
