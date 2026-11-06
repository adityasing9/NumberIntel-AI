import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Square,
  Trash2,
  AlertTriangle,
  Radio,
  ShieldCheck,
  Building2,
  Layers
} from 'lucide-react';

export const InvestigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  // Deletion Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      setSelectedIds(selectedIds.filter((item) => item !== taskId));
    } else {
      setSelectedIds([...selectedIds, taskId]);
    }
  };

  const handleDeleteCase = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await investigationService.delete(id);
      setIsDeleteModalOpen(false);
      navigate('/investigations');
    } catch (err) {
      console.error('Failed to delete investigation case:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Navigation & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-glass)]">
        <div>
          <Link
            to="/investigations"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Investigations History</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-3">
            <span>{investigation?.title || 'Investigation Case Dossier'}</span>
            {investigation && (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase ${
                investigation.status === 'completed'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
              }`}>
                {investigation.status}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {investigation?.total_numbers || 0} total ingested records • {investigation?.verified_matches || 0} verified matches • {investigation?.spam_count || 0} spam flags
          </p>
        </div>

        {/* Action Controls & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Delete Investigation Case */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-mono text-rose-300 hover:text-rose-200 transition-colors"
            title="Delete this entire investigation case"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Case</span>
          </button>

          {id && (
            <>
              <a
                href={investigationService.export(id, 'csv')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl glass-button text-xs font-mono text-slate-300 hover:text-cyan-400 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>CSV</span>
              </a>
              <a
                href={investigationService.export(id, 'xlsx')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl glass-button text-xs font-mono text-slate-300 hover:text-emerald-400 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </a>
              <a
                href={investigationService.export(id, 'json')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl glass-button text-xs font-mono text-slate-300 hover:text-purple-400 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>JSON</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters Bar (Glassmorphic) */}
      <div className="glass-panel p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search phone, carrier, raw number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 glass-button text-xs font-mono text-slate-200 rounded-xl hover:border-cyan-500"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="glass-input rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
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
            className="p-1.5 glass-button rounded-xl text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Results Data Table (Glassmorphism) */}
      <div className="glass-panel overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-[var(--border-glass)] uppercase tracking-wider text-[11px]">
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
            <tbody className="divide-y divide-[var(--border-glass)] text-slate-300">
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
                  <tr key={item.task_id} className="hover:bg-cyan-500/5 transition-colors">
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
                      <span className="font-bold text-slate-200">{item.country_iso2}</span>
                      <span className="text-slate-500 ml-1">(+{item.country_code})</span>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-200 font-semibold">{item.carrier_name || 'Allocated Network'}</div>
                      <div className="text-[10px] text-cyan-400">{item.carrier_circle || 'National Region'}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{item.number_type.replace('_', ' ')}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2.5">
                        {item.avatar_url ? (
                          <img
                            src={item.avatar_url}
                            alt={item.public_name || 'Avatar'}
                            className="w-8 h-8 rounded-lg object-cover border border-cyan-500/40 bg-slate-950 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.public_name || item.e164_format)}&backgroundColor=0f172a&textColor=38bdf8`;
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-950/80 border border-[var(--border-glass)] flex items-center justify-center text-cyan-400 font-mono text-[10px] font-bold flex-shrink-0">
                            {item.country_iso2 || 'TEL'}
                          </div>
                        )}
                        <div className="min-w-0">
                          {item.business_name || item.public_name ? (
                            <div>
                              <div className="font-medium text-slate-100 truncate">
                                {item.business_name || (item.public_name?.includes('Private Subscriber') ? 'Private Subscriber Line' : item.public_name)}
                              </div>
                              {item.user_handle ? (
                                <div className="text-[10px] text-cyan-400 font-mono truncate">{item.user_handle}</div>
                              ) : (
                                <div className="text-[10px] text-slate-500 font-mono truncate">
                                  {item.business_name ? 'Verified Commercial' : 'Protected (DPDP Act)'}
                                </div>
                              )}
                              {item.business_name && item.public_name && (
                                <div className="text-[10px] text-slate-400 truncate">{item.business_name}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">Unindexed / Private</span>
                          )}
                        </div>
                      </div>
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
                          : 'bg-slate-950 text-slate-400 border border-[var(--border-glass)]'
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
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg glass-button text-cyan-400 hover:text-cyan-300 transition-colors"
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
          <div className="p-4 bg-slate-950/60 border-t border-[var(--border-glass)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
            <div>
              Showing {tableData.items.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, tableData.total)} of {tableData.total} records
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg glass-button text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {page} of {tableData.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(tableData.total_pages, p + 1))}
                disabled={page >= tableData.total_pages}
                className="p-1.5 rounded-lg glass-button text-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="glass-panel relative max-w-md w-full p-6 space-y-4 border-rose-500/40 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Entire Case?</h3>
                <p className="text-xs text-slate-400">Case ID: {id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Are you sure you want to delete this entire investigation case? All {investigation?.total_numbers || 0} phone number records and their cached reports will be permanently removed.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 glass-button text-xs font-mono text-slate-300 hover:text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCase}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg shadow-rose-950/60 transition-colors flex items-center space-x-1.5"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Case'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
