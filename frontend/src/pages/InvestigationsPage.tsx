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
  AlertCircle
} from 'lucide-react';

export const InvestigationsPage: React.FC = () => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const data = await investigationService.list();
      setInvestigations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this investigation dossier?')) return;
    try {
      await investigationService.delete(id);
      setInvestigations(investigations.filter((i) => i.id !== id));
    } catch (err) {
      alert('Failed to delete investigation.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Investigation Dossiers & Case History</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Archived digital footprint records, bulk jobs, and exported OSINT forensics.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInvestigations}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            to="/bulk-lookup"
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition-colors"
          >
            <span>+ New Investigation</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-cyan-400 font-mono space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Retrieving investigation logs...</span>
        </div>
      ) : investigations.length === 0 ? (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-12 text-center">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No Investigations Recorded</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Initiate a single telephone lookup or upload a bulk file to generate your first forensic dossier.
          </p>
          <Link
            to="/bulk-lookup"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-cyan-600 text-slate-950 font-semibold text-xs"
          >
            Launch Investigation
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Investigation Title</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Total Numbers</th>
                  <th className="p-3.5">Verified Matches</th>
                  <th className="p-3.5">Spam Flagged</th>
                  <th className="p-3.5">Created At</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                {investigations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-sans">
                      <Link
                        to={`/investigations/${inv.id}`}
                        className="font-medium text-slate-100 hover:text-cyan-400 flex items-center space-x-1.5"
                      >
                        <span>{inv.title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </Link>
                      {inv.description && (
                        <div className="text-[11px] text-slate-500 truncate max-w-sm font-mono mt-0.5">
                          {inv.description}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        inv.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-200 font-bold">{inv.total_numbers}</td>
                    <td className="p-3.5 text-emerald-400">{inv.verified_matches}</td>
                    <td className="p-3.5 text-rose-400">{inv.spam_count}</td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(inv.created_at).toLocaleDateString()}{' '}
                      {new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <div className="inline-flex items-center space-x-1">
                        <a
                          href={investigationService.export(inv.id, 'csv')}
                          title="Export CSV"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 rounded transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={investigationService.export(inv.id, 'xlsx')}
                          title="Export Excel"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded transition-colors"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={(e) => handleDelete(inv.id, e)}
                          title="Delete Dossier"
                          className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
