import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { investigationService } from '../services/api';
import { Investigation, BulkResultTableItem, PaginatedTableResponse } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  CheckSquare,
  Square
} from 'lucide-react';

export const InvestigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [tableData, setTableData] = useState<PaginatedTableResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [inv, tbl] = await Promise.all([
        investigationService.get(id),
        investigationService.getTable(id, page, pageSize, search, statusFilter),
      ]);
      setInvestigation(inv);
      setTableData(tbl);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, page, pageSize, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const toggleSelectAll = () => {
    if (!tableData) return;
    if (selectedIds.length === tableData.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tableData.items.map((i) => i.task_id));
    }
  };

  const toggleSelect = (taskId: string) => {
    if (selectedIds.includes(taskId)) {
      setSelectedIds(selectedIds.filter((id) => id !== taskId));
    } else {
      setSelectedIds([...selectedIds, taskId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <Link
            to="/investigations"
            className="text-xs font-mono text-cyan-400 hover:underline flex items-center space-x-1 mb-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Investigations History</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-3">
            <span>{investigation?.title || 'Investigation Case Dossier'}</span>
            {investigation && (
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                investigation.status === 'completed'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                  : 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
              }`}>
                {investigation.status}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {investigation?.total_numbers || 0} total ingested records • {investigation?.verified_matches || 0} verified matches • {investigation?.spam_count || 0} spam flags
          </p>
        </div>

        {/* Export buttons */}
        {id && (
          <div className="flex items-center space-x-2">
            <a
              href={investigationService.export(id, 'csv')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-400 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CSV</span>
            </a>
            <a
              href={investigationService.export(id, 'xlsx')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-emerald-400 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </a>
            <a
              href={investigationService.export(id, 'json')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-purple-400 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>JSON</span>
            </a>
          </div>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search phone, carrier, raw number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded-lg border border-slate-700"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <button
            onClick={fetchData}
            title="Refresh Table"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Results Data Table */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3 w-8">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                    {tableData && selectedIds.length === tableData.items.length && tableData.items.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3">Phone Number</th>
                <th className="p-3">Country</th>
                <th className="p-3">Carrier / Line</th>
                <th className="p-3">Public / Business Identity</th>
                <th className="p-3">WhatsApp</th>
                <th className="p-3">Telegram</th>
                <th className="p-3">Spam Risk</th>
                <th className="p-3">Confidence</th>
                <th className="p-3 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-cyan-400 font-mono">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading investigation data...</span>
                    </div>
                  </td>
                </tr>
              ) : tableData && tableData.items.length > 0 ? (
                tableData.items.map((item) => (
                  <tr key={item.task_id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3">
                      <button onClick={() => toggleSelect(item.task_id)} className="text-slate-400 hover:text-white">
                        {selectedIds.includes(item.task_id) ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="p-3">
                      <Link
                        to={`/numbers/${item.task_id}/report`}
                        className="text-cyan-400 font-semibold hover:underline flex items-center space-x-1"
                      >
                        <span>{item.e164_format}</span>
                      </Link>
                      <div className="text-[10px] text-slate-500">{item.raw_input}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-300">{item.country_iso2}</span>
                      <span className="text-slate-500 ml-1">(+{item.country_code})</span>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-200">{item.carrier_name || 'Allocated Network'}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{item.number_type.replace('_', ' ')}</div>
                    </td>
                    <td className="p-3 font-sans">
                      {item.business_name || item.public_name ? (
                        <div>
                          <div className="font-medium text-slate-100">{item.business_name || item.public_name}</div>
                          {item.business_name && item.public_name && (
                            <div className="text-[11px] text-slate-400">{item.public_name}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px]">Unindexed / Private</span>
                      )}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={item.whatsapp_status} size="sm" />
                    </td>
                    <td className="p-3">
                      <StatusBadge status={item.telegram_status} size="sm" />
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        item.spam_risk_level === 'critical' || item.spam_risk_level === 'high'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : item.spam_risk_level === 'moderate'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        {item.spam_risk_level}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`font-bold ${item.confidence_score >= 70 ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {item.confidence_score.toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/numbers/${item.task_id}/report`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 font-mono">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Controls */}
        {tableData && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
            <div>
              Showing {tableData.items.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, tableData.total)} of {tableData.total} records
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {page} of {tableData.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(tableData.total_pages, p + 1))}
                disabled={page >= tableData.total_pages}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
