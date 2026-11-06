import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { numberService } from '../services/api';
import { FullNumberReportResponse, PhotoSource } from '../types';
import { PlatformCard } from '../components/ui/PlatformCard';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  User,
  Radio,
  Clock,
  AlertTriangle,
  Cpu,
  ExternalLink,
  RefreshCw,
  Share2,
  MapPin,
  AtSign,
  Phone,
  Maximize2,
  X,
  CheckCircle2,
  Globe,
  Camera,
  Layers,
  Search,
  Lock,
  MessageSquare
} from 'lucide-react';

export const NumberDossierPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [report, setReport] = useState<FullNumberReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

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
      <div className="flex flex-col items-center justify-center h-96 space-y-4 text-cyan-400 font-mono">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="text-sm">Compiling Forensic Intelligence Dossier & Validating Telecom Metadata...</span>
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center max-w-md mx-auto my-12">
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

  const cleanDigits = report.e164_format.replace(/\D/g, '');
  const primaryAvatar = report.avatar_url || (report.photo_sources && report.photo_sources[0]?.url);
  const hasPhotos = (report.photo_sources && report.photo_sources.length > 0) || !!primaryAvatar;
  const isPrivateSubscriber = !report.business_name && (report.public_name?.includes('Private Subscriber') || report.overall_verification_status === 'unindexed_private');

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <Link
          to="/investigations"
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Investigation Table</span>
        </Link>
        <div className="flex items-center space-x-3 text-xs font-mono text-slate-500">
          <span>Task: <strong className="text-slate-300">{report.task_id}</strong></span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 font-semibold uppercase">{report.task_status}</span>
          </span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: USER IDENTITY & PROFILE HERO SHOWCASE (NAME, AVATAR, PROFILE)
         ========================================================================= */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Avatar + User Name & Bio */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* User Avatar Card */}
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-cyan-500/60 shadow-xl shadow-cyan-950/60 bg-slate-950 flex items-center justify-center relative">
                {primaryAvatar ? (
                  <img
                    src={primaryAvatar}
                    alt={report.public_name || 'Verified Entity Logo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(report.public_name || report.e164_format)}&backgroundColor=0f172a&textColor=38bdf8`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 text-cyan-400 font-mono text-center p-2">
                    <Radio className="w-8 h-8 text-cyan-400 mb-1" />
                    <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase">{report.country_iso2 || 'INTL'}</span>
                    <span className="text-[9px] text-slate-500 truncate max-w-[84px]">{report.carrier_name?.split(' ')[0] || 'Mobile'}</span>
                  </div>
                )}

                {/* Click to enlarge overlay if photo exists */}
                {primaryAvatar && (
                  <button
                    onClick={() => setActivePhotoModal(primaryAvatar)}
                    className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-cyan-300 transition-opacity"
                    title="Enlarge User Photo"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Status indicator on avatar */}
              <div className="absolute -bottom-2 -right-2 bg-slate-950 rounded-full p-1 border border-slate-700 shadow-md">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            {/* Name, Handle, Location, Bio */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {report.business_name || (isPrivateSubscriber ? 'Private Individual Subscriber' : (report.public_name || 'Unindexed Subscriber'))}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold flex items-center space-x-1 ${
                  report.business_name
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-950 text-cyan-400 border border-slate-700'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{report.business_name ? 'Verified Commercial Entity' : 'Protected Subscriber (DPDP Act 2023)'}</span>
                </span>
              </div>

              {/* Handle & Business */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                {report.user_handle && (
                  <span className="text-cyan-400 font-semibold flex items-center space-x-1 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/50">
                    <AtSign className="w-3 h-3" />
                    <span>{report.user_handle.replace('@', '')}</span>
                  </span>
                )}
                {report.business_name && (
                  <span className="text-slate-300 flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{report.business_name}</span>
                  </span>
                )}
                <span className="text-slate-300 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{report.carrier_circle || report.location || 'National Region'}</span>
                </span>
              </div>

              {/* Bio / Description */}
              <p className="text-xs text-slate-300 max-w-xl font-sans leading-relaxed pt-1 border-t border-slate-800/80">
                {report.bio || report.summary}
              </p>

              {/* E164 and Country Quick Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
                <span className="text-cyan-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {report.e164_format}
                </span>
                <span className="text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Country: <strong className="text-white">{report.country_iso2} (+{report.country_code})</strong>
                </span>
                <span className="text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Network: <strong className="text-cyan-300">{report.carrier_name}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Confidence Score & Verification Badge */}
          <div className="flex flex-col items-start lg:items-end justify-center p-4 bg-slate-950/80 border border-slate-800 rounded-xl min-w-[180px] font-mono shadow-inner">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Technical Confidence</div>
            <div className={`text-3xl font-extrabold mt-0.5 ${report.confidence_score >= 70 ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {report.confidence_score.toFixed(0)}%
            </div>
            <div className="text-[11px] font-semibold text-slate-300 mt-1 uppercase tracking-wide">
              {report.is_valid ? 'ITU E.164 ROUTEABLE' : 'INVALID ROUTING'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              TRAI & ITU Allocation Validated
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: LIVE OSINT INVESTIGATION TOOLKIT (ONE-CLICK REAL VERIFICATION)
         ========================================================================= */}
      <div className="bg-slate-900/90 rounded-xl border border-cyan-900/40 p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Live OSINT Investigation Toolkit</h2>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800 px-2.5 py-0.5 rounded">
            Interactive Verification Gateways
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Execute external, legal verification checks using official platform endpoints and search engine dorks for target <strong className="text-slate-200">{report.e164_format}</strong>.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {/* WhatsApp Direct */}
          <a
            href={`https://wa.me/${cleanDigits}`}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <MessageSquare className="w-4 h-4" />
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">WhatsApp Profile</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Check Live DP & About</div>
            </div>
          </a>

          {/* Telegram Direct */}
          <a
            href={`https://t.me/+${cleanDigits}`}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/50 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-sky-400 mb-2">
              <Share2 className="w-4 h-4" />
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-sky-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 group-hover:text-sky-300">Telegram Check</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Inspect open t.me route</div>
            </div>
          </a>

          {/* Truecaller Web Search */}
          <a
            href={`https://www.truecaller.com/search/in/${cleanDigits}`}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-cyan-400 mb-2">
              <Phone className="w-4 h-4" />
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">Truecaller Web</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Official caller registry</div>
            </div>
          </a>

          {/* Google Dork Exact Query */}
          <a
            href={`https://www.google.com/search?q=%22%2B${cleanDigits}%22`}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <Globe className="w-4 h-4" />
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300">Google Exact Dork</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Search indexed websites</div>
            </div>
          </a>

          {/* DuckDuckGo Search */}
          <a
            href={`https://duckduckgo.com/?q=%22%2B${cleanDigits}%22`}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-purple-400 mb-2">
              <Search className="w-4 h-4" />
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-purple-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 group-hover:text-purple-300">DuckDuckGo</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Unfiltered web citations</div>
            </div>
          </a>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: CARRIER & TELECOM NETWORK INTELLIGENCE (TRAI & ITU-T ACCURATE)
         ========================================================================= */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Allocated Carrier & Telecom Infrastructure Metadata</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
            TRAI & ITU-T E.164 Validated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Card 1: Network Operator */}
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-500 uppercase text-[10px] flex items-center space-x-1">
              <Radio className="w-3 h-3 text-cyan-400" />
              <span>Network Operator</span>
            </div>
            <div className="text-sm font-bold text-cyan-300">
              {report.carrier_name || 'Allocated Network'}
            </div>
            <div className="text-[10px] text-slate-400">
              Licensed Telecom Service Provider
            </div>
          </div>

          {/* Card 2: Circle / Numbering Region */}
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-500 uppercase text-[10px] flex items-center space-x-1">
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>Telecom Circle / Zone</span>
            </div>
            <div className="text-sm font-bold text-slate-100">
              {report.carrier_circle || 'National Region'}
            </div>
            <div className="text-[10px] text-slate-400">
              DoT Allocation Service Area
            </div>
          </div>

          {/* Card 3: Line Type & Technology */}
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-500 uppercase text-[10px] flex items-center space-x-1">
              <Phone className="w-3 h-3 text-purple-400" />
              <span>Line Type & Technology</span>
            </div>
            <div className="text-sm font-bold text-slate-100 capitalize">
              {report.line_type || report.number_type}
            </div>
            <div className="text-[10px] text-slate-400">
              {report.number_type === 'toll_free' ? 'Enterprise Toll-Free' : 'VoLTE / 4G / 5G Capable'}
            </div>
          </div>

          {/* Card 4: ITU Format Validation */}
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-500 uppercase text-[10px] flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>ITU Format & Routing</span>
            </div>
            <div className={`text-sm font-bold ${report.is_valid ? 'text-emerald-400' : 'text-rose-400'}`}>
              {report.is_valid ? 'Valid & Routeable' : 'Invalid Routing'}
            </div>
            <div className="text-[10px] text-slate-400">
              Google libphonenumber v8.13
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: USER PHOTOS & VISUAL FOOTPRINT (AUTHENTIC & HONEST)
         ========================================================================= */}
      {hasPhotos ? (
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Discovered User Photos & Visual Footprint</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Public profile portraits collected from authorized gateways and indexed corporate directories.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2.5 py-0.5 rounded">
              {(report.photo_sources?.length || 1)} Visual Sources Discovered
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {report.photo_sources && report.photo_sources.length > 0 ? (
              report.photo_sources.map((photo, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group hover:border-cyan-500/50 transition-colors"
                >
                  <div className="relative aspect-square w-full bg-slate-900 overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => setActivePhotoModal(photo.url)}
                      className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-cyan-300 font-mono text-xs space-x-1.5 transition-opacity"
                    >
                      <Maximize2 className="w-4 h-4" />
                      <span>Inspect Photo</span>
                    </button>
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-950/80 text-cyan-400 border border-slate-800 backdrop-blur-sm">
                      {photo.platform}
                    </span>
                  </div>
                  <div className="p-3 text-xs space-y-1">
                    <div className="font-medium text-slate-200 truncate">{photo.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      Source: {photo.platform.toUpperCase()} Gateway
                    </div>
                  </div>
                </div>
              ))
            ) : primaryAvatar ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group hover:border-cyan-500/50 transition-colors max-w-xs">
                <div className="relative aspect-square w-full bg-slate-900 overflow-hidden">
                  <img
                    src={primaryAvatar}
                    alt={report.public_name || 'Public avatar'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => setActivePhotoModal(primaryAvatar)}
                    className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-cyan-300 font-mono text-xs space-x-1.5 transition-opacity"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>Inspect Photo</span>
                  </button>
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-950/80 text-cyan-400 border border-slate-800 backdrop-blur-sm">
                    Verified Avatar
                  </span>
                </div>
                <div className="p-3 text-xs space-y-1">
                  <div className="font-medium text-slate-200">Public Profile Portrait</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Caller ID Gateway Resolution
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Public Photo & Avatar Intelligence</span>
            </h2>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              0 Public Images Found
            </span>
          </div>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-400 space-y-2">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>No Public Profile Picture Indexed in Open Directories</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Reverse search performed across open search engine indexes, Gravatar hashes, and authorized messaging endpoints. In accordance with platform privacy controls (e.g. WhatsApp / Telegram "My Contacts Only" settings) and Section 8 of the Indian Digital Personal Data Protection (DPDP) Act 2023, private subscriber photos are not publicly harvestable without authorized consent.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <a
                href={`https://wa.me/${cleanDigits}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs rounded-lg transition-colors font-mono"
              >
                <span>Check DP Directly in WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`https://www.google.com/search?tbm=isch&q=%22%2B${cleanDigits}%22`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg transition-colors font-mono"
              >
                <span>Search Google Images</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 5: PUBLIC IDENTITY & BUSINESS RECORDS
         ========================================================================= */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span>Public Identity & Business Directory Cross-References</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
            <div className="text-slate-500 font-mono uppercase text-[10px]">Public / Caller Entity Name</div>
            <div className="text-base font-semibold text-slate-100 font-sans">
              {report.business_name || (isPrivateSubscriber ? 'Private Individual Subscriber' : (report.public_name || 'Unindexed Subscriber'))}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Attribution: {report.business_name ? 'Official business listings' : 'Protected under Indian DPDP Act 2023'}
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
            <div className="text-slate-500 font-mono uppercase text-[10px]">Registered Business Name</div>
            <div className="text-base font-semibold text-slate-100 font-sans">
              {report.business_name || 'No corporate directory listing mapped'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Attribution: MCA / Google Business / Corporate Registries
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 6: SOCIAL MEDIA & MESSAGING DISCOVERY (9 PLATFORMS)
         ========================================================================= */}
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

      {/* =========================================================================
          SECTION 7: SPAM INTELLIGENCE & FORENSIC AI AGENT
         ========================================================================= */}
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
              No abusive reports found across Open Threat Feeds, StopForumSpam, or Spamhaus databases.
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
                <div className="text-[11px] text-purple-400 font-bold mb-1">? Protected Attributes (DPDP Compliant):</div>
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

      {/* =========================================================================
          MODAL: FULL PHOTO INSPECTION LIGHTBOX
         ========================================================================= */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActivePhotoModal(null)}
        >
          <div
            className="relative max-w-lg w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-cyan-400">High-Resolution Profile Inspection</span>
              <button
                onClick={() => setActivePhotoModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="my-4 max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl bg-slate-950">
              <img
                src={activePhotoModal}
                alt="Enlarged Profile Portrait"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
              <span>{report.public_name || report.e164_format}</span>
              <a
                href={activePhotoModal}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center space-x-1"
              >
                <span>Open original</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
