import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { numberService } from '../services/api';
import { FullNumberReportResponse } from '../types';
import { PlatformCard } from '../components/ui/PlatformCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  User,
  Radio,
  Clock,
  AlertTriangle,
  Cpu,
  FileCheck2,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  Hash,
  Share2
} from 'lucide-react';

export const NumberDossierPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [report, setReport] = useState<FullNumberReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDossier = async () => {
    if (!taskId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await numberService.getReport(taskId);
      setReport(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to load intelligence dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 space-x-3 text-cyan-400 font-mono">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span>Compiling Comprehensive Intelligence Dossier...</span>
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center max-w-md mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">Dossier Unavailable</h3>
        <p className="text-xs text-slate-400 mt-1">{errorMsg || 'Intelligence report record not found.'}</p>
        <Link
          to="/investigations"
          className="inline-block mt-4 px-4 py-2 bg-slate-800 text-cyan-400 text-xs font-mono rounded-lg hover:bg-slate-700"
        >
          Return to Investigations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <Link
          to="/investigations"
          className="text-xs font-mono text-cyan-400 hover:underline flex items-center space-x-1"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Back to Investigation Table</span>
        </Link>
        <div className="text-xs text-slate-500 font-mono">
          Task ID: {report.task_id} • Status: <span className="text-cyan-400">{report.task_status}</span>
        </div>
      </div>

      {/* SECTION A: Number Overview Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-extrabold font-mono text-white tracking-tight">
                {report.e164_format}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold flex items-center space-x-1 ${
                report.is_valid
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
              }`}>
                <span>{report.is_valid ? 'ITU Valid' : 'Format Invalid'}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
              <div>Raw Input: <span className="text-slate-200">{report.phone_number}</span></div>
              <div>National: <span className="text-slate-200">{report.national_format || 'N/A'}</span></div>
              <div>Country: <span className="text-cyan-400 font-bold">{report.country_iso2} (+{report.country_code})</span></div>
              <div>Line Type: <span className="text-slate-200 capitalize">{report.line_type || report.number_type}</span></div>
              <div>Network Carrier: <span className="text-slate-200 font-semibold">{report.carrier_name || 'Allocated Network'}</span></div>
            </div>
          </div>

          <div className="flex flex-col items-end justify-center p-4 bg-slate-950/70 border border-slate-800 rounded-xl min-w-[160px] text-right font-mono">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Confidence Score</div>
            <div className={`text-3xl font-extrabold mt-0.5 ${report.confidence_score >= 70 ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {report.confidence_score.toFixed(0)}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {report.overall_verification_status.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: Public Identity & Business Resolution */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span>Public Identity & Business Records</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="text-slate-500 font-mono uppercase text-[10px]">Public / Caller Entity Name</div>
            <div className="text-sm font-medium text-slate-100 mt-1 font-sans">
              {report.public_name || 'Not publicly indexed in lawful caller registries'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              Attribution: Official business listings & public search indices
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="text-slate-500 font-mono uppercase text-[10px]">Registered Business Name</div>
            <div className="text-sm font-medium text-slate-100 mt-1 font-sans">
              {report.business_name || 'No corporate directory listing mapped'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              Attribution: Google Business / Authorized Web Mentions
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C: Social Media & Messaging Discovery Grid (9 Platforms) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span>Social Media & Messaging Discovery (9 Platforms)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Complies with platform terms of service. Differentiates verified business associations from protected private accounts.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2.5 py-1 rounded-full">
            {report.platforms.filter((p) => p.verification_status === 'verified_association' || p.verification_status === 'possible_public_match').length} Matches Discovered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.platforms.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
        </div>
      </div>

      {/* SECTION D & E: Spam Intelligence + AI Intelligence Agent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spam Intelligence Card */}
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Spam & Fraud Reputation Intelligence</span>
            </h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
              report.spam_reports.length > 0
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {report.spam_reports.length > 0 ? `${report.spam_reports.length} Threat Reports` : 'Clean Reputation'}
            </span>
          </div>

          {report.spam_reports.length > 0 ? (
            <div className="space-y-2.5">
              {report.spam_reports.map((s) => (
                <div key={s.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-200">
                    <span className="capitalize text-rose-400 font-bold">{s.spam_category.replace('_', ' ')}</span>
                    <span className="text-slate-400">{s.report_count} incident report(s)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Risk Level: <span className="uppercase text-amber-400 font-semibold">{s.risk_level}</span> • Confidence: {s.confidence_score.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800 text-xs text-slate-400 font-mono">
              No reports found in Open Threat Feeds or StopForumSpam databases.
            </div>
          )}
        </div>

        {/* AI Intelligence Summary Card */}
        <div className="bg-slate-900/80 rounded-xl border border-cyan-900/40 p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-cyan-300 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Forensic AI Intelligence Synthesis</span>
            </h2>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
              {report.ai_report?.model_used || 'Claude 3.5 Sonnet'}
            </span>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            {report.summary || report.ai_report?.reliability_assessment || 'Forensic analysis completed.'}
          </div>

          {/* Verified Facts vs Missing Attributes */}
          <div className="space-y-2 text-xs font-mono">
            {report.ai_report?.key_findings && report.ai_report.key_findings.length > 0 && (
              <div>
                <div className="text-[11px] text-emerald-400 font-bold mb-1">✓ Verified Facts:</div>
                <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                  {report.ai_report.key_findings.map((f, i) => (
                    <li key={i}>{f.statement}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.ai_report?.missing_information && report.ai_report.missing_information.length > 0 && (
              <div className="pt-2">
                <div className="text-[11px] text-purple-400 font-bold mb-1">? Protected / Unverified Attributes:</div>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                  {report.ai_report.missing_information.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
