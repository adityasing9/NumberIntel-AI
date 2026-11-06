import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { numberService } from '../services/api';
import { truecallerService } from '../services/truecallerService';
import { TruecallerModal } from '../components/ui/TruecallerModal';
import { Search, Globe, AlertCircle, Loader2, ArrowRight, Phone, CheckCircle2, Key } from 'lucide-react';

const COUNTRIES = [
  { code: 'IN', name: 'India (+91)' },
  { code: 'US', name: 'United States (+1)' },
  { code: 'GB', name: 'United Kingdom (+44)' },
  { code: 'AE', name: 'United Arab Emirates (+971)' },
  { code: 'SG', name: 'Singapore (+65)' },
  { code: 'DE', name: 'Germany (+49)' },
  { code: 'FR', name: 'France (+33)' },
  { code: 'CA', name: 'Canada (+1)' },
  { code: 'AU', name: 'Australia (+61)' },
];

export const NewInvestigationPage: React.FC = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [defaultCountry, setDefaultCountry] = useState('IN');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTcModalOpen, setIsTcModalOpen] = useState(false);
  const [isTruecallerConnected, setIsTruecallerConnected] = useState(false);

  useEffect(() => {
    setIsTruecallerConnected(!!truecallerService.getToken());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await numberService.singleLookup(phoneNumber, defaultCountry, title || undefined);
      navigate(`/numbers/${res.task_id}/report`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to complete phone number lookup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">New Target Investigation</h1>
        <p className="text-xs text-slate-400 font-mono">
          Execute single target phone number intelligence, Truecaller directory lookups, and social footprint discovery.
        </p>
      </div>

      {/* Truecaller Gateway Status Bar */}
      {/* Free Internet OSINT Engine Banner */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-900/50 rounded-2xl flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white font-bold flex items-center space-x-1.5">
              <span>Free Open Internet OSINT Engine</span>
              <span className="text-[10px] text-emerald-400 flex items-center space-x-1 font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>100% FREE ACTIVE</span>
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Scans open web search indices, Tellows anti-spam registry, TRAI/ITU grids, and public directories automatically without requiring logins or OTP.
            </div>
          </div>
        </div>

        <span className="hidden sm:inline-block px-2.5 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-lg text-[10px] font-semibold">
          Auto-Harvest Enabled
        </span>
      </div>

      {/* Truecaller Gateway (Optional) */}
      <div className="p-3.5 bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-900 border border-blue-900/50 rounded-2xl flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white font-bold flex items-center space-x-1.5">
              <span>Truecaller Live Gateway</span>
              {isTruecallerConnected && (
                <span className="text-[10px] text-emerald-400 flex items-center space-x-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ACTIVE</span>
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              {isTruecallerConnected
                ? 'Queries will pull real caller names, carrier networks, and photos from Truecaller.'
                : 'Connect Truecaller via SMS OTP to fetch real caller names & profile pictures.'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsTcModalOpen(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg shadow transition-colors flex items-center space-x-1"
        >
          <Key className="w-3 h-3" />
          <span>{isTruecallerConnected ? 'Manage' : 'Connect'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center space-x-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
            Target Telephone Number
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              placeholder="e.g., +91 98765 43210 or 1-800-273-8255"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Default Numbering Region</span>
            </label>
            <select
              value={defaultCountry}
              onChange={(e) => setDefaultCountry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
              Investigation Label
            </label>
            <input
              type="text"
              placeholder="e.g., Case #408 Target Audit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !phoneNumber.trim()}
          className="w-full mt-2 py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-900/40 flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Investigating Across Truecaller & 12 Intelligence Feeds...</span>
            </>
          ) : (
            <>
              <span>Launch Target Intelligence Dossier</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <TruecallerModal
        isOpen={isTcModalOpen}
        onClose={() => setIsTcModalOpen(false)}
        onConnected={() => setIsTruecallerConnected(true)}
      />
    </div>
  );
};
