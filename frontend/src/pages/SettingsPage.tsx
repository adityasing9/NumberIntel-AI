import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Shield, Bell, Moon, Globe, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [defaultCountry, setDefaultCountry] = useState('IN');
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>Investigator & Workspace Preferences</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure regional defaults, quota alerts, and notification preferences.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">Account & Role</h3>
          <div className="grid grid-cols-2 gap-4 text-xs font-mono p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-500">Identity:</span> <span className="text-slate-200">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-500">RBAC Role:</span> <span className="text-cyan-400 uppercase">{user?.role}</span>
            </div>
            <div>
              <span className="text-slate-500">Quota Allocation:</span> <span className="text-slate-200">{user?.api_quota} queries</span>
            </div>
            <div>
              <span className="text-slate-500">Quota Used:</span> <span className="text-slate-200">{user?.quota_used} queries</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Default Country Parsing Region</span>
            </label>
            <select
              value={defaultCountry}
              onChange={(e) => setDefaultCountry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="IN">India (+91)</option>
              <option value="US">United States (+1)</option>
              <option value="GB">United Kingdom (+44)</option>
              <option value="AE">United Arab Emirates (+971)</option>
              <option value="SG">Singapore (+65)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
            <div>
              <div className="text-slate-200 font-semibold">Bulk Job Completion Notifications</div>
              <div className="text-slate-500 text-[11px]">Send real-time alerts when batch jobs reach 100%</div>
            </div>
            <input
              type="checkbox"
              checked={notifyOnComplete}
              onChange={(e) => setNotifyOnComplete(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-600 focus:ring-0 bg-slate-900 border-slate-700"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-900/30 transition-colors"
        >
          Save Preferences
        </button>
      </form>
    </div>
  );
};
