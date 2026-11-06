import React, { useEffect, useState } from 'react';
import { auditService } from '../services/api';
import { ShieldCheck, RefreshCw, Lock, FileText, CheckCircle2 } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  details?: Record<string, any>;
  created_at: string;
}

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span>Security, Consent & DPDP Audit Trail</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable system audit logs tracking searches, bulk uploads, export events, and user consents.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Action Event</th>
                <th className="p-3.5">Resource</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5">Details</th>
                <th className="p-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-cyan-400 font-mono">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                    No audit records discovered.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <span className="font-bold text-cyan-400 uppercase tracking-wider">{l.action}</span>
                    </td>
                    <td className="p-3.5 text-slate-300 capitalize">{l.resource_type}</td>
                    <td className="p-3.5 text-slate-400">{l.ip_address || 'Internal/Loopback'}</td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px] truncate max-w-xs">
                      {JSON.stringify(l.details || {})}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(l.created_at).toLocaleDateString()}{' '}
                      {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
