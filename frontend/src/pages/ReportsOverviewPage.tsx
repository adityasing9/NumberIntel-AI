import React, { useEffect, useState } from 'react';
import { investigationService } from '../services/api';
import { Investigation } from '../types';
import { FileText, FileSpreadsheet, FileCode, Download, RefreshCw, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReportsOverviewPage: React.FC = () => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await investigationService.list();
      setInvestigations(data.filter((i) => i.status === 'completed' || i.total_numbers > 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Forensic Reports & Data Export Hub</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Export verified telephone intelligence dossiers, evidence hashes, and bulk datasets.
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {investigations.map((inv) => (
          <div key={inv.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-white line-clamp-1">{inv.title}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {inv.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-2 space-y-1">
                <div>Total Numbers: <span className="text-white font-bold">{inv.total_numbers}</span></div>
                <div>Verified Matches: <span className="text-emerald-400">{inv.verified_matches}</span></div>
                <div>Spam Flagged: <span className="text-rose-400">{inv.spam_count}</span></div>
                <div>Created: {new Date(inv.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <Link
                to={`/investigations/${inv.id}`}
                className="text-xs text-cyan-400 hover:underline flex items-center space-x-1"
              >
                <span>View Table</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <div className="flex space-x-1.5">
                <a
                  href={investigationService.export(inv.id, 'csv')}
                  title="Download CSV"
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 text-xs font-mono rounded transition-colors flex items-center space-x-1"
                >
                  <FileText className="w-3 h-3" />
                  <span>CSV</span>
                </a>
                <a
                  href={investigationService.export(inv.id, 'xlsx')}
                  title="Download Excel"
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 text-xs font-mono rounded transition-colors flex items-center space-x-1"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>XLSX</span>
                </a>
                <a
                  href={investigationService.export(inv.id, 'json')}
                  title="Download JSON"
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-purple-400 text-xs font-mono rounded transition-colors flex items-center space-x-1"
                >
                  <FileCode className="w-3 h-3" />
                  <span>JSON</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
