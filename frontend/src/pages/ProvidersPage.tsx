import React, { useEffect, useState } from 'react';
import { providerService } from '../services/api';
import { SourceProvider } from '../types';
import { Server, Key, Activity, CheckCircle2, AlertCircle, RefreshCw, Lock } from 'lucide-react';

export const ProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<SourceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [testResult, setTestResult] = useState<{ id: string; status: string; message: string } | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const data = await providerService.list();
      setProviders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSaveKey = async (providerId: string) => {
    if (!apiKeyInput.trim()) return;
    try {
      await providerService.update(providerId, { api_key: apiKeyInput });
      setEditingId(null);
      setApiKeyInput('');
      fetchProviders();
      alert('API key encrypted and saved successfully.');
    } catch (err) {
      alert('Failed to update API key.');
    }
  };

  const handleTest = async (providerId: string) => {
    setTestResult(null);
    try {
      const res = await providerService.test(providerId);
      setTestResult({ id: providerId, status: res.status, message: res.message });
    } catch (err) {
      setTestResult({ id: providerId, status: 'error', message: 'Connectivity test failed.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Server className="w-6 h-6 text-cyan-400" />
            <span>Intelligence Feeds & API Providers</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure external telecom APIs, search engine keys, spam feeds, and OpenRouter AI models.
          </p>
        </div>
        <button
          onClick={fetchProviders}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Providers</span>
        </button>
      </div>

      <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Provider Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Base Endpoint</th>
                <th className="p-3.5">Rate Limit / Min</th>
                <th className="p-3.5">Daily Quota</th>
                <th className="p-3.5">Credential Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-cyan-400 font-mono">
                    Loading providers catalogue...
                  </td>
                </tr>
              ) : (
                providers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-white capitalize">{p.name.replace(/_/g, ' ')}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 uppercase text-[10px]">
                        {p.provider_type}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 truncate max-w-[200px]">{p.base_url || 'Internal Engine'}</td>
                    <td className="p-3.5">{p.rate_limit_per_minute} req/min</td>
                    <td className="p-3.5">{p.daily_quota.toLocaleString()}</td>
                    <td className="p-3.5">
                      {p.name === 'libphonenumber_engine' ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Built-in Engine</span>
                        </span>
                      ) : p.has_api_key ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>AES-256 Encrypted</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Not Configured</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleTest(p.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] transition-colors"
                      >
                        Test Probe
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(p.id);
                          setApiKeyInput('');
                        }}
                        className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-[11px] transition-colors"
                      >
                        Set API Key
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test probe feedback */}
      {testResult && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs flex items-center space-x-2">
          {testResult.status === 'online' || testResult.status === 'configured' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="text-slate-300">{testResult.message}</span>
        </div>
      )}

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>Configure Secret API Key</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Credentials are encrypted with AES-256 Fernet cipher before storage. They are never sent to the client browser.
            </p>
            <input
              type="password"
              placeholder="Paste raw secret API key..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-mono rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveKey(editingId)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono rounded-lg"
              >
                Encrypt & Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
