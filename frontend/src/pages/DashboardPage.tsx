import React, { useEffect, useState } from 'react';
import { analyticsService, investigationService } from '../services/api';
import { DashboardAnalytics, Investigation } from '../types';
import {
  ShieldCheck,
  AlertTriangle,
  Building2,
  Users,
  Search,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  RefreshCw,
  FileText,
  Activity,
  Layers,
  Globe
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [recentInvs, setRecentInvs] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dash, invs] = await Promise.all([
        analyticsService.getDashboard(),
        investigationService.list(),
      ]);
      setData(dash);
      setRecentInvs(invs.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96 space-x-3 text-cyan-400 font-mono">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span>Synthesizing Intelligence Metrics...</span>
      </div>
    );
  }

  const metrics = data?.metrics || {
    total_numbers_processed: 0,
    verified_public_matches: 0,
    possible_profile_matches: 0,
    spam_associated_numbers: 0,
    business_numbers_identified: 0,
    failed_lookups: 0,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-glass)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Threat Intelligence & OSINT Operations</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time telemetry, digital footprint discovery, and cross-border spam classification.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl glass-button text-xs font-mono text-slate-300 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
          <Link
            to="/bulk-lookup"
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-950/60"
          >
            <span>+ New Bulk Investigation</span>
          </Link>
        </div>
      </div>

      {/* 6 Key Metric Cards (Glassmorphic) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Processed */}
        <div className="glass-card-interactive p-4 relative overflow-hidden">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Processed</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{metrics.total_numbers_processed}</div>
          <div className="text-[10px] text-cyan-400 mt-1 flex items-center space-x-1">
            <Search className="w-3 h-3" />
            <span>E.164 Ingestion</span>
          </div>
          <div className="absolute right-2 bottom-2 opacity-10">
            <Search className="w-12 h-12 text-cyan-400" />
          </div>
        </div>

        {/* Verified Public Matches */}
        <div className="glass-card-interactive p-4 relative overflow-hidden">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Verified Matches</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{metrics.verified_public_matches}</div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Official APIs</span>
          </div>
          <div className="absolute right-2 bottom-2 opacity-10">
            <ShieldCheck className="w-12 h-12 text-emerald-400" />
          </div>
        </div>

        {/* Possible Profile Matches */}
        <div className="glass-card-interactive p-4 relative overflow-hidden">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Possible Matches</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{metrics.possible_profile_matches}</div>
          <div className="text-[10px] text-cyan-400 mt-1 flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span>Indexed Citations</span>
          </div>
          <div className="absolute right-2 bottom-2 opacity-10">
            <Users className="w-12 h-12 text-cyan-400" />
          </div>
        </div>

        {/* Spam Associated */}
        <div className="glass-card-interactive p-4 relative overflow-hidden">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Spam / Fraud</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{metrics.spam_associated_numbers}</div>
          <div className="text-[10px] text-rose-400 mt-1 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Threat Feeds</span>
          </div>
          <div className="absolute right-2 bottom-2 opacity-10">
            <AlertTriangle className="w-12 h-12 text-rose-400" />
          </div>
        </div>

        {/* Business Lines Identified */}
        <div className="glass-card-interactive p-4 relative overflow-hidden">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Business Lines</div>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-1">{metrics.business_numbers_identified}</div>
          <div className="text-[10px] text-purple-400 mt-1 flex items-center space-x-1">
            <Building2 className="w-3 h-3" />
            <span>Toll-Free & UAN</span>
          </div>
          <div className="absolute right-2 bottom-2 opacity-10">
            <Building2 className="w-12 h-12 text-purple-400" />
          </div>
        </div>

        {/* Failed Lookups */}
        <div className="glass-card-interactive p-4 relative overflow-hidden">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Failed Lookups</div>
          <div className="text-2xl font-bold font-mono text-slate-400 mt-1">{metrics.failed_lookups}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1">
            <XCircle className="w-3 h-3" />
            <span>Rate / Format</span>
          </div>
          <div className="absolute right-2 bottom-2 opacity-10">
            <XCircle className="w-12 h-12 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main Charts Grid (Glassmorphism) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Investigation Activity Over Time</h2>
              <p className="text-xs text-slate-400">Total lookups vs verified matches and spam detections</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 glass-card px-2 py-0.5 rounded">
              7-Day Rolling
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.timeline || []}>
                <defs>
                  <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-glass)', borderRadius: '12px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="searches" stroke="#06b6d4" fillOpacity={1} fill="url(#colorSearches)" name="Searches" />
                <Area type="monotone" dataKey="verified" stroke="#10b981" fillOpacity={1} fill="url(#colorVerified)" name="Verified Matches" />
                <Area type="monotone" dataKey="spam" stroke="#ef4444" fillOpacity={0.2} fill="#ef4444" name="Spam Detected" />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Footprint Chart */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Results by Platform & Status</h2>
              <p className="text-xs text-slate-400">Verified official matches vs possible indexed mentions</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 glass-card px-2 py-0.5 rounded">9 Core Platforms</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.platforms || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="platform" stroke="#64748b" fontSize={10} interval={0} angle={-25} textAnchor="end" height={40} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-glass)', borderRadius: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="verified" fill="#10b981" name="Verified Match" stackId="a" />
                <Bar dataKey="possible" fill="#06b6d4" name="Possible Match" stackId="a" />
                <Bar dataKey="unverified" fill="#475569" name="Not Verifiable / Clean" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts: Countries, Spam, Recent Invs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results by Country */}
        <div className="glass-panel p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-white mb-1">Top Numbering Regions</h2>
          <p className="text-xs text-slate-400 mb-4">Allocated ITU-T countries</p>
          <div className="space-y-3">
            {data?.countries && data.countries.length > 0 ? (
              data.countries.map((c) => (
                <div key={c.code} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-cyan-400 font-bold glass-card px-2 py-0.5 rounded">
                      {c.code}
                    </span>
                    <span className="text-slate-300">{c.country}</span>
                  </div>
                  <span className="font-mono text-slate-400 font-semibold">{c.count} lookups</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 font-mono">No international data recorded yet.</div>
            )}
          </div>
        </div>

        {/* Spam Distribution */}
        <div className="glass-panel p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-white mb-1">Spam Category Breakdown</h2>
          <p className="text-xs text-slate-400 mb-4">Threat report distribution</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.spam_distribution || []}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {(data?.spam_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-glass)', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Investigations List */}
        <div className="glass-panel p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Investigations</h2>
            <Link to="/investigations" className="text-xs text-cyan-400 hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentInvs.length > 0 ? (
              recentInvs.map((inv) => (
                <Link
                  key={inv.id}
                  to={`/investigations/${inv.id}`}
                  className="block p-2.5 rounded-xl glass-card hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-200 truncate max-w-[170px]">{inv.title}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      inv.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1 flex justify-between">
                    <span>{inv.total_numbers} numbers</span>
                    <span>{new Date(inv.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-xs text-slate-500 font-mono py-4 text-center">No investigations recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
