import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { investigationService } from '../services/api';
import { Investigation } from '../types';
import {
  History,
  FileSpreadsheet,
  FileText,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
  Download,
  AlertCircle,
  CheckSquare,
  Square,
  ShieldCheck,
  AlertTriangle,
  FolderX,
  X,
  Check
} from 'lucide-react';

export const InvestigationsPage: React.FC = () => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const data = await investigationService.list();
      setInvestigations(data);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const handleDeleteOne = async (id: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!confirm('Are you sure you want to permanently delete this investigation dossier?')) return;
    try {
      await investigationService.delete(id);
      setInvestigations((prev) => prev.filter((i) => i.id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } catch (err) {
      alert('Failed to delete investigation dossier.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} selected investigation dossier(s)?`)) return;
    setIsDeleting(true);
    try {
      await investigationService.deleteMultiple(selectedIds);
      setInvestigations((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
      setSelectedIds([]);
    } catch (err) {
      alert('Failed to delete selected investigations.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAllHistory = async (factoryReset = false) => {
    setIsDeleting(true);
    try {
      if (factoryReset) {
        await investigationService.clearAllData(true);
        window.location.href = '/login';
      } else {
        await investigationService.deleteAll();
        setInvestigations([]);
        setSelectedIds([]);
        setIsClearAllModalOpen(false);
      }
    } catch (err) {
      alert('Failed to clear investigation data.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInvestigations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvestigations.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredInvestigations = investigations.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.title.toLowerCase().includes(q) ||
      (inv.description && inv.description.toLowerCase().includes(q)) ||
      inv.id.toLowerCase().includes(q)
    );
  });

  const totalNumbersAll = investigations.reduce((acc, curr) => acc + (curr.total_numbers || 0), 0);
  const totalVerifiedAll = investigations.reduce((acc, curr) => acc + (curr.verified_matches || 0), 0);
  const totalSpamAll = investigations.reduce((acc, curr) => acc + (curr.spam_count || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER & QUICK STATS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center space-x-2.5">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Investigation Dossiers & History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Archived telephone intelligence cases, digital footprints, and exported evidence dossiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsClearAllModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-sm"
            title="Clear Data & Search History"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear All Data</span>
          </button>

          <button
            onClick={fetchInvestigations}
            className="px-3 py-2 rounded-xl glass-button text-xs font-mono text-slate-300 hover:text-white flex items-center space-x-1.5"
            title="Refresh history logs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Refresh</span>
          </button>

          <Link
            to="/investigations/new"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-cyan-950/60 transition-all flex items-center space-x-1.5"
          >
            <span>+ New Single Lookup</span>
          </Link>

          <Link
            to="/bulk-lookup"
            className="px-4 py-2 rounded-xl glass-button text-cyan-300 hover:text-cyan-200 font-bold text-xs font-mono transition-all flex items-center space-x-1.5 border-cyan-500/30"
          >
            <span>+ Bulk Job</span>
          </Link>
        </div>
      </div>

      {/* GLASSMORPHISM STATS STRIP */}
      {investigations.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-4 flex items-center space-x-3.5">
            <div className="p-3 bg-cyan-500/15 rounded-xl border border-cyan-500/30 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Cases</div>
              <div className="text-xl font-extrabold text-white mt-0.5">{investigations.length}</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex items-center space-x-3.5">
            <div className="p-3 bg-blue-500/15 rounded-xl border border-blue-500/30 text-blue-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Numbers Audited</div>
              <div className="text-xl font-extrabold text-cyan-300 mt-0.5">{totalNumbersAll}</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex items-center space-x-3.5">
            <div className="p-3 bg-emerald-500/15 rounded-xl border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Verified Public</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{totalVerifiedAll}</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex items-center space-x-3.5">
            <div className="p-3 bg-rose-500/15 rounded-xl border border-rose-500/30 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Spam Flagged</div>
              <div className="text-xl font-extrabold text-rose-400 mt-0.5">{totalSpamAll}</div>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH AND BULK SELECTION ACTIONS BAR */}
      {investigations.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Filter by case title or target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2 text-xs font-mono placeholder-slate-500 focus:outline-none"
            />
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end animate-in fade-in duration-200">
              <span className="text-xs font-mono text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                Selected: <strong className="text-cyan-400 font-bold">{selectedIds.length}</strong> case(s)
              </span>
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center space-x-1.5 shadow-lg shadow-rose-950/50 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 rounded-xl glass-button text-xs font-mono text-slate-400 hover:text-white"
              >
                Deselect
              </button>
            </div>
          )}
        </div>
      )}

      {/* TABLE / CONTENT */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-cyan-400 font-mono space-x-2 glass-panel rounded-2xl">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-sm">Retrieving investigation history from storage...</span>
        </div>
      ) : investigations.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-white/10 p-12 text-center shadow-2xl">
          <FolderX className="w-14 h-14 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Investigation History Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto font-sans leading-relaxed">
            All investigation history has been deleted or none has been created yet. Launch a single telephone inquiry or upload a bulk CSV to generate your forensic dossiers.
          </p>
          <div className="flex items-center justify-center space-x-3 mt-5">
            <Link
              to="/investigations/new"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono shadow-lg transition-colors"
            >
              Start Single Lookup
            </Link>
            <Link
              to="/bulk-lookup"
              className="px-4 py-2 rounded-xl glass-button text-slate-300 hover:text-white text-xs font-mono transition-colors"
            >
              Import Bulk Numbers
            </Link>
          </div>
        </div>
      ) : filteredInvestigations.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center text-xs font-mono text-slate-400">
          No investigations matching "{searchQuery}". Clear your search query to see all dossiers.
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-black/40 text-slate-300 border-b border-white/10 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-white transition-colors"
                      title={selectedIds.length === filteredInvestigations.length ? 'Deselect All' : 'Select All'}
                    >
                      {selectedIds.length === filteredInvestigations.length && filteredInvestigations.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5">Investigation Dossier</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Target Count</th>
                  <th className="p-3.5">Verified Public</th>
                  <th className="p-3.5">Spam / Risk</th>
                  <th className="p-3.5">Recorded At</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-transparent text-slate-300">
                {filteredInvestigations.map((inv) => {
                  const isSelected = selectedIds.includes(inv.id);
                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-white/5 transition-colors ${
                        isSelected ? 'bg-cyan-500/10' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => toggleSelectOne(inv.id)}
                          className="text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 font-sans">
                        <Link
                          to={`/investigations/${inv.id}`}
                          className="font-bold text-white hover:text-cyan-400 flex items-center space-x-1.5 group"
                        >
                          <span className="group-hover:underline">{inv.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                        </Link>
                        {inv.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-sm font-mono mt-0.5">
                            {inv.description}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          inv.status === 'completed'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                            : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-white font-bold">{inv.total_numbers}</td>
                      <td className="p-3.5 text-emerald-400 font-bold">{inv.verified_matches}</td>
                      <td className="p-3.5 text-rose-400 font-bold">{inv.spam_count}</td>
                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {new Date(inv.created_at).toLocaleDateString()}{' '}
                        {new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <div className="inline-flex items-center space-x-1.5">
                          <a
                            href={investigationService.export(inv.id, 'csv')}
                            title="Export Case CSV"
                            className="p-1.5 glass-button text-slate-300 hover:text-cyan-400 rounded-lg transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={investigationService.export(inv.id, 'xlsx')}
                            title="Export Case Excel"
                            className="p-1.5 glass-button text-slate-300 hover:text-emerald-400 rounded-lg transition-colors"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={(e) => handleDeleteOne(inv.id, e)}
                            title="Permanently Delete This Case"
                            className="p-1.5 glass-button text-slate-400 hover:text-rose-400 hover:border-rose-500/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLEAR ALL DATA CONFIRMATION MODAL */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel border border-rose-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2.5 text-rose-400">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-bold text-white">Clear Workspace Data & History</h3>
              </div>
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Select which workspace data to purge. In accordance with the Indian DPDP Act 2023, you have the statutory right to erase stored intelligence records at any time.
            </p>

            <div className="space-y-3 pt-1">
              {/* Option 1: Clear History Only */}
              <button
                type="button"
                onClick={() => handleClearAllHistory(false)}
                disabled={isDeleting}
                className="w-full text-left p-3.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 transition-all flex items-start space-x-3 group"
              >
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-105 transition-transform">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Clear Investigation History ({investigations.length} cases)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Deletes all investigation dossiers and compiled phone records. Keeps your login and preferences.
                  </div>
                </div>
              </button>

              {/* Option 2: Factory Reset */}
              <button
                type="button"
                onClick={() => handleClearAllHistory(true)}
                disabled={isDeleting}
                className="w-full text-left p-3.5 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-700/70 transition-all flex items-start space-x-3 group"
              >
                <div className="p-2 rounded-lg bg-red-500/30 text-rose-300 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-200">
                    Factory Reset (Clear All Data)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Wipes all dossiers, Truecaller API keys, local accounts, and session tokens.
                  </div>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 glass-button text-slate-300 hover:text-white rounded-xl text-xs font-mono"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
