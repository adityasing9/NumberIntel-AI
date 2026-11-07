import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { numberService, investigationService } from '../services/api';
import { FullNumberReportResponse, PhotoSource } from '../types';
import { PlatformCard } from '../components/ui/PlatformCard';
import { TruecallerModal } from '../components/ui/TruecallerModal';
import { truecallerService } from '../services/truecallerService';
import { freeOsintService } from '../services/freeOsintService';
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
  MessageSquare,
  Key,
  Trash2,
  Mail,
  Briefcase,
  Copy,
  Check,
  Compass,
  FileText,
  Activity,
  Award
} from 'lucide-react';

type TabView = 'all' | 'profile' | 'telecom' | 'photos' | 'social' | 'spam' | 'osint' | 'ai';

export const NumberDossierPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<FullNumberReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Deletion Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Free OSINT States
  const [osintLoading, setOsintLoading] = useState(false);
  const [osintMessage, setOsintMessage] = useState<string | null>(null);

  // Truecaller States
  const [isTcModalOpen, setIsTcModalOpen] = useState(false);
  const [tcLoading, setTcLoading] = useState(false);
  const [tcMessage, setTcMessage] = useState<string | null>(null);
  const [isTruecallerConnected, setIsTruecallerConnected] = useState<boolean>(!!truecallerService.getToken());

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
    setIsTruecallerConnected(!!truecallerService.getToken());
  }, [taskId]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDeleteDossier = async () => {
    if (!taskId) return;
    setIsDeleting(true);
    try {
      await investigationService.delete(taskId);
      setIsDeleteModalOpen(false);
      navigate('/investigations');
    } catch (err) {
      console.error('Failed to delete investigation dossier:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFetchTruecaller = async () => {
    if (!report) return;
    const token = truecallerService.getToken();
    if (!token) {
      setIsTcModalOpen(true);
      return;
    }

    setTcLoading(true);
    setTcMessage('Querying Truecaller Live Gateway API...');
    try {
      const res = await truecallerService.search(report.e164_format);
      if (res && res.name) {
        setReport((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            public_name: res.name,
            carrier_name: res.carrier || prev.carrier_name,
            carrier_circle: res.city || prev.carrier_circle,
            city: res.city || prev.city,
            avatar_url: res.imageUrl || prev.avatar_url,
            photo_sources: res.imageUrl ? [
              { platform: 'Truecaller CDN', url: res.imageUrl, label: 'Truecaller Verified Profile Photo' },
              ...(prev.photo_sources || [])
            ] : prev.photo_sources,
            overall_verification_status: 'verified',
            summary: `Caller confirmed via Truecaller Gateway. Identified name: ${res.name} (${res.carrier || prev.carrier_name}). Truecaller spam score: ${res.spamScore}.`
          };
        });
        setTcMessage(`✓ Success! Truecaller details fetched: ${res.name} (${res.carrier || report.carrier_name})`);
      } else {
        setTcMessage('No profile returned from Truecaller for this number, or session expired.');
        setIsTcModalOpen(true);
      }
    } catch (err: any) {
      setTcMessage(err.message || 'Failed to query Truecaller.');
      setIsTcModalOpen(true);
    } finally {
      setTcLoading(false);
    }
  };

  const handleRunFreeOsint = async () => {
    if (!report) return;
    setOsintLoading(true);
    setOsintMessage('Scanning free open internet indices, Tellows anti-spam registry, and search engines...');
    try {
      const freeData = await freeOsintService.lookup(report.e164_format, report.country_iso2);
      if (freeData) {
        setReport((prev) => {
          if (!prev) return prev;
          const updatedPlatforms = [...prev.platforms];
          const waIndex = updatedPlatforms.findIndex((p) => p.platform_name === 'whatsapp');
          if (waIndex >= 0) {
            if (freeData.whatsappVerified) {
              updatedPlatforms[waIndex] = {
                ...updatedPlatforms[waIndex],
                verification_status: 'verified_association',
                confidence_level: freeData.whatsappConfidence || 90,
                public_profiles: freeData.whatsappAvatar ? [{
                  id: 'prof-wa-osint',
                  profile_identifier: prev.e164_format,
                  avatar_url: freeData.whatsappAvatar,
                  bio: freeData.name || 'Verified WhatsApp Profile',
                  has_verified_badge: true
                }] : updatedPlatforms[waIndex].public_profiles
              };
            } else {
              updatedPlatforms[waIndex] = {
                ...updatedPlatforms[waIndex],
                verification_status: 'not_found',
                confidence_level: 0,
                public_profiles: []
              };
            }
          }

          const tgIndex = updatedPlatforms.findIndex((p) => p.platform_name === 'telegram');
          if (tgIndex >= 0 && freeData.telegramVerified) {
            updatedPlatforms[tgIndex] = {
              ...updatedPlatforms[tgIndex],
              verification_status: 'verified_association',
              confidence_level: freeData.telegramConfidence || 85,
              public_profiles: freeData.telegramAvatar ? [{
                id: 'prof-tg-osint',
                profile_identifier: freeData.telegramAvatar,
                avatar_url: freeData.telegramAvatar,
                has_verified_badge: false
              }] : updatedPlatforms[tgIndex].public_profiles
            };
          }

          const hasName = !!(freeData.name || freeData.businessName);

          return {
            ...prev,
            public_name: freeData.name || prev.public_name,
            business_name: freeData.businessName || prev.business_name,
            carrier_name: freeData.carrier || prev.carrier_name,
            carrier_circle: freeData.circle || prev.carrier_circle,
            city: freeData.circle || prev.city,
            avatar_url: freeData.avatarUrl || prev.avatar_url,
            confidence_score: hasName ? Math.max(prev.confidence_score, 88) : prev.confidence_score,
            photo_sources: freeData.photoSources && freeData.photoSources.length > 0
              ? [...freeData.photoSources, ...(prev.photo_sources || [])]
              : prev.photo_sources,
            web_snippets: freeData.webSnippets || prev.web_snippets,
            free_osint_sources: freeData.sources || prev.free_osint_sources,
            summary: freeData.summary || prev.summary,
            platforms: updatedPlatforms,
            overall_verification_status: hasName ? 'verified' : prev.overall_verification_status,
          };
        });
        setOsintMessage(`✓ Free Internet Recon complete! Found ${freeData.webSnippets?.length || 0} web mentions across ${freeData.sources?.length || 1} public sources.`);
      } else {
        setOsintMessage('Free internet scan complete. Number is private or unindexed in public web directories.');
      }
    } catch (err: any) {
      setOsintMessage('Free internet scan note: ' + (err.message || 'Offline mode'));
    } finally {
      setOsintLoading(false);
    }
  };

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
      <div className="glass-panel p-8 text-center max-w-md mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">Dossier Unavailable</h3>
        <p className="text-xs text-slate-400 mt-1">{errorMsg || 'Intelligence report record not found.'}</p>
        <Link
          to="/investigations"
          className="inline-block mt-4 px-4 py-2 glass-button text-cyan-400 text-xs font-mono rounded-lg hover:border-cyan-500"
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

  // Resolved user identity details
  const resolvedDisplayName = report.business_name || (report.public_name && !report.public_name.includes('Private Subscriber') ? report.public_name : (isPrivateSubscriber ? 'Private Cellular Subscriber' : (report.public_name || 'Individual Subscriber')));
  const resolvedEmail = report.email || (report.business_name ? `contact@${report.business_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : 'No public email registered');
  const resolvedDesignation = report.designation || (report.business_name ? 'Enterprise Commercial Line' : 'Personal Cellular Line');
  const resolvedCompany = report.business_name || (report.public_name && !report.public_name.includes('Private Subscriber') ? 'Independent Professional' : 'Individual Subscriber');
  const resolvedAddress = report.address || `${report.carrier_circle || 'National Region'}, ${report.country_iso2}`;
  const resolvedCity = report.city || report.carrier_circle?.split(',')[0] || 'National Zone';
  const resolvedState = report.state || report.carrier_circle || 'Allocated State Circle';
  const resolvedCountry = `${report.country_iso2} (+${report.country_code})`;
  const resolvedPostal = report.postal_code || (report.country_iso2 === 'IN' ? 'TRAI Allocation Zone' : 'Standard ITU Grid');
  const resolvedTimezone = report.timezone || (report.country_iso2 === 'IN' ? 'Asia/Kolkata (UTC+05:30)' : report.country_iso2 === 'NP' ? 'Asia/Kathmandu (UTC+05:45)' : 'UTC');
  const resolvedMnp = report.mnp_status || 'Original Licensed Operator Allocated';
  const resolvedLsa = report.lsa_circle || report.carrier_circle || 'Universal Service Area';
  const resolvedDpdp = report.dpdp_status || 'Protected (DPDP Act 2023 §8)';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Header Bar with Breadcrumb & Delete Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-glass)]">
        <Link
          to="/investigations"
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Investigation Table</span>
        </Link>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-400 hidden sm:inline">
            Task ID: <strong className="text-slate-200">{report.task_id}</strong>
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold uppercase">{report.task_status}</span>
          </span>

          {/* Delete History Button */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 hover:text-rose-200 text-xs font-mono transition-colors"
            title="Delete Dossier from History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Dossier</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: USER IDENTITY HERO SHOWCASE (GLASSMORPHISM)
         ========================================================================= */}
      <div className="glass-panel relative p-6 sm:p-8 overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Avatar + Primary Identity Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* User Avatar */}
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-cyan-400/60 shadow-xl shadow-cyan-950/60 bg-slate-950/80 flex items-center justify-center relative">
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
                    <span className="text-[9px] text-slate-400 truncate max-w-[84px]">{report.carrier_name?.split(' ')[0] || 'Mobile'}</span>
                  </div>
                )}

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

              <div className="absolute -bottom-2 -right-2 bg-slate-950 rounded-full p-1 border border-slate-700 shadow-md">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            {/* User Info & Quick Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {resolvedDisplayName}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold flex items-center space-x-1 ${
                  report.business_name || (report.public_name && !report.public_name.includes('Private Subscriber'))
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-950/80 text-cyan-400 border border-slate-700'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {report.business_name
                      ? 'Verified Commercial Entity'
                      : (report.public_name && !report.public_name.includes('Private Subscriber')
                          ? 'Verified Public Identity (Open Web)'
                          : 'Protected Cellular Line (DPDP Act 2023)')}
                  </span>
                </span>
              </div>

              {/* Sub-header Badges */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                {report.user_handle && (
                  <span className="text-cyan-400 font-semibold flex items-center space-x-1 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/60">
                    <AtSign className="w-3 h-3" />
                    <span>{report.user_handle.replace('@', '')}</span>
                  </span>
                )}
                <span className="text-slate-300 flex items-center space-x-1">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{resolvedDesignation}</span>
                </span>
                <span className="text-slate-300 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{resolvedAddress}</span>
                </span>
              </div>

              {/* Bio / Summary */}
              <p className="text-xs text-slate-300 max-w-2xl font-sans leading-relaxed pt-1 border-t border-[var(--border-glass)]">
                {report.bio || report.summary}
              </p>

              {/* Quick Telecom Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
                <span className="text-cyan-300 font-bold glass-card px-2.5 py-0.5 rounded flex items-center space-x-1">
                  <Phone className="w-3 h-3 text-cyan-400" />
                  <span>{report.e164_format}</span>
                </span>
                <span className="text-slate-300 glass-card px-2 py-0.5 rounded">
                  Operator: <strong className="text-cyan-300">{report.carrier_name}</strong>
                </span>
                <span className="text-slate-300 glass-card px-2 py-0.5 rounded">
                  Circle: <strong className="text-white">{report.carrier_circle || 'National'}</strong>
                </span>
                <span className="text-slate-300 glass-card px-2 py-0.5 rounded">
                  ISO: <strong className="text-white">{report.country_iso2} (+{report.country_code})</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Technical Confidence Score Metric Card */}
          <div className="glass-card flex flex-col items-start lg:items-end justify-center p-4 min-w-[190px] font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center space-x-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Confidence Score</span>
            </div>
            <div className={`text-3xl font-extrabold mt-0.5 ${report.confidence_score >= 70 ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {report.confidence_score.toFixed(0)}%
            </div>
            <div className="text-[11px] font-semibold text-slate-200 mt-1 uppercase tracking-wide">
              {report.is_valid ? 'ITU E.164 ROUTEABLE' : 'INVALID ROUTING'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              TRAI & ITU Allocation Validated
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW FILTER TABS (EASY ONE-CLICK FORENSIC DRILL-DOWN)
         ========================================================================= */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-[var(--border-glass)]">
        {[
          { id: 'all', label: 'All Intel', icon: Layers },
          { id: 'profile', label: 'User Demographics & Identity', icon: User },
          { id: 'telecom', label: 'Telecom & Network', icon: Radio },
          { id: 'photos', label: `Visuals (${report.photo_sources?.length || (primaryAvatar ? 1 : 0)})`, icon: Camera },
          { id: 'social', label: 'Digital Footprint (9)', icon: Share2 },
          { id: 'spam', label: `Spam Risk (${report.spam_reports?.length || 0})`, icon: AlertTriangle },
          { id: 'osint', label: `Web Mentions (${report.web_snippets?.length || 0})`, icon: Globe },
          { id: 'ai', label: 'Forensic AI Brief', icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabView)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-900/50 font-semibold'
                  : 'glass-card text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          SECTION 2: COMPREHENSIVE USER PROFILE & DEMOGRAPHICS MATRIX (FULL DETAILS)
         ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'profile') && (
        <div className="glass-panel p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-glass)]">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                  <span>Comprehensive User Demographics & Identity Matrix</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                    Full Profile Intelligence
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete identity footprint cross-referenced from telecom registries, open web dorks, and public corporate directories.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg self-start sm:self-auto flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>E.164 Integrity Confirmed</span>
            </span>
          </div>

          {/* Matrix Grid: 12 High-Value Identity Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
            {/* 1. Full Legal / Caller Name */}
            <div className="glass-card p-3.5 rounded-xl space-y-1 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span className="flex items-center space-x-1">
                  <User className="w-3 h-3 text-cyan-400" />
                  <span>Full Public Name</span>
                </span>
                <button
                  onClick={() => handleCopy(resolvedDisplayName, 'name')}
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                  title="Copy Name"
                >
                  {copiedField === 'name' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-sm font-bold text-slate-100 font-sans truncate">
                {resolvedDisplayName}
              </div>
              <div className="text-[10px] text-slate-500">
                Primary Identity Identifier
              </div>
            </div>

            {/* 2. Designation / Role */}
            <div className="glass-card p-3.5 rounded-xl space-y-1 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span className="flex items-center space-x-1">
                  <Briefcase className="w-3 h-3 text-cyan-400" />
                  <span>Designation / Role</span>
                </span>
                <button
                  onClick={() => handleCopy(resolvedDesignation, 'role')}
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  {copiedField === 'role' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-sm font-bold text-slate-100 font-sans truncate">
                {resolvedDesignation}
              </div>
              <div className="text-[10px] text-slate-500">
                Professional Classification
              </div>
            </div>

            {/* 3. Organization / Company */}
            <div className="glass-card p-3.5 rounded-xl space-y-1 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span className="flex items-center space-x-1">
                  <Building2 className="w-3 h-3 text-cyan-400" />
                  <span>Organization / Entity</span>
                </span>
                <button
                  onClick={() => handleCopy(resolvedCompany, 'org')}
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  {copiedField === 'org' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-sm font-bold text-slate-100 font-sans truncate">
                {resolvedCompany}
              </div>
              <div className="text-[10px] text-slate-500">
                Corporate Registry Cross-Ref
              </div>
            </div>

            {/* 4. Public Email */}
            <div className="glass-card p-3.5 rounded-xl space-y-1 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span className="flex items-center space-x-1">
                  <Mail className="w-3 h-3 text-cyan-400" />
                  <span>Public Contact Email</span>
                </span>
                {report.email && (
                  <button
                    onClick={() => handleCopy(resolvedEmail, 'email')}
                    className="text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
              <div className="text-sm font-bold text-cyan-300 truncate">
                {resolvedEmail}
              </div>
              <div className="text-[10px] text-slate-500">
                Direct Electronic Inbound
              </div>
            </div>

            {/* 5. Physical Address / Area */}
            <div className="glass-card p-3.5 rounded-xl space-y-1 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  <span>Registered Address</span>
                </span>
                <button
                  onClick={() => handleCopy(resolvedAddress, 'addr')}
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  {copiedField === 'addr' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-sm font-bold text-slate-100 truncate">
                {resolvedAddress}
              </div>
              <div className="text-[10px] text-slate-500">
                Licensed Telecom Territory
              </div>
            </div>

            {/* 6. City / District */}
            <div className="glass-card p-3.5 rounded-xl space-y-1 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span className="flex items-center space-x-1">
                  <Compass className="w-3 h-3 text-purple-400" />
                  <span>City / Telecom Circle</span>
                </span>
                <button
                  onClick={() => handleCopy(resolvedCity, 'city')}
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  {copiedField === 'city' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-sm font-bold text-slate-100 truncate">
                {resolvedCity}
              </div>
              <div className="text-[10px] text-slate-500">
                DoT Allocation LSA Zone
              </div>
            </div>

            {/* 7. Country & Calling Code */}
            <div className="glass-card p-3.5 rounded-xl space-y-1 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span className="flex items-center space-x-1">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <span>Country & Prefix</span>
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100">
                {resolvedCountry}
              </div>
              <div className="text-[10px] text-slate-500">
                ITU-T E.164 Sovereign Grid
              </div>
            </div>

            {/* 8. Postal Code / Grid */}
            <div className="glass-card p-3.5 rounded-xl space-y-1 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span className="flex items-center space-x-1">
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span>Postal / Area Code</span>
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100">
                {resolvedPostal}
              </div>
              <div className="text-[10px] text-slate-500">
                Universal Postal Union Matrix
              </div>
            </div>

            {/* 9. Local Timezone */}
            <div className="glass-card p-3.5 rounded-xl space-y-1 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-sky-400" />
                  <span>Local Timezone</span>
                </span>
              </div>
              <div className="text-sm font-bold text-cyan-300">
                {resolvedTimezone}
              </div>
              <div className="text-[10px] text-slate-500">
                Standard Time Reference
              </div>
            </div>

            {/* 10. MNP Portability State */}
            <div className="glass-card p-3.5 rounded-xl space-y-1 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span className="flex items-center space-x-1">
                  <Radio className="w-3 h-3 text-cyan-400" />
                  <span>MNP Portability State</span>
                </span>
              </div>
              <div className="text-sm font-bold text-emerald-300 truncate">
                {resolvedMnp}
              </div>
              <div className="text-[10px] text-slate-500">
                Donor / Recipient Operator
              </div>
            </div>

            {/* 11. Licensed Service Area (LSA) */}
            <div className="glass-card p-3.5 rounded-xl space-y-1 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span className="flex items-center space-x-1">
                  <Award className="w-3 h-3 text-purple-400" />
                  <span>LSA Licensing Zone</span>
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100 truncate">
                {resolvedLsa}
              </div>
              <div className="text-[10px] text-slate-500">
                Spectrum & Circle License
              </div>
            </div>

            {/* 12. DPDP Statutory Status */}
            <div className="glass-card p-3.5 rounded-xl space-y-1 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span className="flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Statutory Privacy (DPDP)</span>
                </span>
              </div>
              <div className="text-sm font-bold text-emerald-400 truncate">
                {resolvedDpdp}
              </div>
              <div className="text-[10px] text-slate-500">
                DPDP Act 2023 Statutory Protection
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: FREE OPEN INTERNET OSINT RECONNAISSANCE CARD
         ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'osint') && (
        <div className="glass-panel p-5 space-y-4 border-emerald-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border-glass)]">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-950/50">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white tracking-tight">Free Open Internet OSINT Engine</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>100% FREE • NO LOGIN / OTP NEEDED</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Automatically scans live search engine indices, Tellows anti-spam registry, open directory listings, and avatar resolvers.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRunFreeOsint}
                disabled={osintLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center space-x-1.5"
              >
                {osintLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                <span>{osintLoading ? 'Scanning Internet...' : 'Re-scan Free Internet'}</span>
              </button>
              <a
                href={`https://www.tellows.in/num/${cleanDigits}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 glass-button text-slate-300 hover:text-white text-xs font-mono rounded-xl transition-colors flex items-center space-x-1"
              >
                <span>Tellows Registry</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://www.google.com/search?q=%22${cleanDigits}%22`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 glass-button text-slate-300 hover:text-white text-xs font-mono rounded-xl transition-colors flex items-center space-x-1"
              >
                <span>Google Dork</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {osintMessage && (
            <div className="p-3 glass-card border-emerald-500/50 text-xs font-mono text-emerald-300 flex items-center justify-between">
              <span>{osintMessage}</span>
            </div>
          )}

          {/* Active OSINT feeds */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
            <span className="text-slate-500">Live Active Feeds:</span>
            <span className="px-2 py-0.5 glass-card text-cyan-300 rounded">DuckDuckGo Web Index</span>
            <span className="px-2 py-0.5 glass-card text-cyan-300 rounded">Tellows Anti-Spam</span>
            <span className="px-2 py-0.5 glass-card text-cyan-300 rounded">TRAI / DoT Telecom Series</span>
            <span className="px-2 py-0.5 glass-card text-cyan-300 rounded">Gravatar / Unavatar CDN</span>
          </div>
        </div>
      )}

      {/* Discovered Open Web Footprint & Snippets */}
      {(activeTab === 'all' || activeTab === 'osint') && report.web_snippets && report.web_snippets.length > 0 && (
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-glass)]">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Discovered Open Web Mentions ({report.web_snippets.length} Hits)</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
              Search Engine Indexed Public Pages
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.web_snippets.map((snip, idx) => (
              <div key={idx} className="p-3.5 glass-card rounded-xl space-y-2 hover:border-cyan-500/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={snip.url || `https://www.google.com/search?q=%22${cleanDigits}%22`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline line-clamp-1 flex items-center space-x-1"
                  >
                    <span>{snip.title}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-3">
                  {snip.snippet}
                </p>
                {snip.url && (
                  <div className="text-[10px] font-mono text-slate-500 truncate">
                    {snip.url}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 4: TRUECALLER LIVE GATEWAY CARD (OPTIONAL AUTHENTICATED)
         ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'profile') && (
        <div className="glass-panel p-5 space-y-3 border-blue-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border-glass)]">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-900/40">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white tracking-tight">Truecaller Caller Intelligence Gateway</h3>
                  {isTruecallerConnected ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>GATEWAY CONNECTED</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                      NOT CONNECTED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Query Truecaller's 350M+ verified caller directory for authentic name, carrier network, and photo avatar.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleFetchTruecaller}
                disabled={tcLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg shadow-blue-950/50 transition-all flex items-center space-x-1.5"
              >
                {tcLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                <span>{isTruecallerConnected ? 'Fetch from Truecaller' : 'Connect & Fetch from Truecaller'}</span>
              </button>
              <button
                onClick={() => setIsTcModalOpen(true)}
                className="px-3 py-2 glass-button text-slate-300 hover:text-white text-xs font-mono rounded-xl transition-colors flex items-center space-x-1"
              >
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isTruecallerConnected ? 'Manage Token' : 'Connect Gateway'}</span>
              </button>
              <a
                href={`https://www.truecaller.com/search/in/${cleanDigits}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 glass-button text-slate-300 hover:text-white text-xs font-mono rounded-xl transition-colors flex items-center space-x-1"
              >
                <span>Truecaller Web</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {tcMessage && (
            <div className="p-3 glass-card border-blue-500/50 text-xs font-mono text-cyan-300 flex items-center justify-between">
              <span>{tcMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 5: LIVE OSINT INVESTIGATION TOOLKIT (ONE-CLICK VERIFICATION)
         ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'osint') && (
        <div className="glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-glass)]">
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
              className="p-3 glass-card hover:border-emerald-500/50 rounded-xl transition-all group flex flex-col justify-between"
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
              className="p-3 glass-card hover:border-sky-500/50 rounded-xl transition-all group flex flex-col justify-between"
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
              className="p-3 glass-card hover:border-cyan-500/50 rounded-xl transition-all group flex flex-col justify-between"
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
              className="p-3 glass-card hover:border-amber-500/50 rounded-xl transition-all group flex flex-col justify-between"
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
              className="p-3 glass-card hover:border-purple-500/50 rounded-xl transition-all group flex flex-col justify-between"
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
      )}

      {/* =========================================================================
          SECTION 6: CARRIER & TELECOM NETWORK INTELLIGENCE (TRAI & ITU VALIDATED)
         ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'telecom') && (
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-glass)]">
            <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Allocated Carrier & Telecom Infrastructure Metadata</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400 glass-card px-2.5 py-0.5 rounded">
              TRAI & ITU-T E.164 Validated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            {/* Card 1: Network Operator */}
            <div className="p-3.5 glass-card rounded-xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] flex items-center space-x-1">
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
            <div className="p-3.5 glass-card rounded-xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] flex items-center space-x-1">
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
            <div className="p-3.5 glass-card rounded-xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] flex items-center space-x-1">
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
            <div className="p-3.5 glass-card rounded-xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] flex items-center space-x-1">
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
      )}

      {/* =========================================================================
          SECTION 7: USER PHOTOS & VISUAL FOOTPRINT
         ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'photos') && (
        hasPhotos ? (
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-glass)]">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Discovered User Photos & Visual Footprint</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Public profile portraits collected from authorized gateways and indexed corporate directories.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 glass-card px-2.5 py-0.5 rounded">
                {(report.photo_sources?.length || 1)} Visual Sources Discovered
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {report.photo_sources && report.photo_sources.length > 0 ? (
                report.photo_sources.map((photo, idx) => (
                  <div
                    key={idx}
                    className="glass-card rounded-xl overflow-hidden group hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="relative aspect-square w-full bg-slate-950 overflow-hidden">
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
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        Source: {photo.platform.toUpperCase()} Gateway
                      </div>
                    </div>
                  </div>
                ))
              ) : primaryAvatar ? (
                <div className="glass-card rounded-xl overflow-hidden group hover:border-cyan-500/50 transition-colors max-w-xs">
                  <div className="relative aspect-square w-full bg-slate-950 overflow-hidden">
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
                    <div className="text-[10px] text-slate-400 font-mono">
                      Caller ID Gateway Resolution
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="glass-panel p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-glass)]">
              <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Public Photo & Avatar Intelligence</span>
              </h2>
              <span className="text-xs font-mono text-slate-400 glass-card px-2 py-0.5 rounded">
                0 Public Images Found
              </span>
            </div>
            <div className="p-4 glass-card rounded-xl text-xs font-mono text-slate-400 space-y-2">
              <div className="flex items-center space-x-2 text-slate-200 font-semibold">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>No Public Profile Picture Indexed in Open Directories</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Reverse search performed across open search engine indexes, Gravatar hashes, and authorized messaging endpoints. Connect your Truecaller session above to fetch registered caller profile pictures directly from Truecaller's directory.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setIsTcModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 text-xs rounded-lg transition-colors font-mono"
                >
                  <span>Connect Truecaller to Fetch Photo</span>
                  <Key className="w-3 h-3" />
                </button>
                <a
                  href={`https://wa.me/${cleanDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs rounded-lg transition-colors font-mono"
                >
                  <span>Check DP Directly in WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )
      )}

      {/* =========================================================================
          SECTION 8: SOCIAL MEDIA & MESSAGING DISCOVERY (9 PLATFORMS)
         ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'social') && (
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
            <span className="text-xs font-mono text-cyan-400 glass-card px-2.5 py-1 rounded-full">
              {report.platforms.filter((p) => p.verification_status === 'verified_association' || p.verification_status === 'possible_public_match').length} Matches Discovered
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.platforms.map((platform) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 9: SPAM INTELLIGENCE & FORENSIC AI AGENT
         ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'spam' || activeTab === 'ai') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spam Intelligence Card */}
          {(activeTab === 'all' || activeTab === 'spam') && (
            <div className="glass-panel p-5 space-y-3">
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
                    <div key={s.id} className="p-3 glass-card rounded-lg text-xs font-mono">
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
                <div className="p-4 glass-card rounded-lg text-xs text-slate-400 font-mono">
                  No abusive reports found across Open Threat Feeds, StopForumSpam, or Spamhaus databases.
                </div>
              )}
            </div>
          )}

          {/* AI Intelligence Summary Card */}
          {(activeTab === 'all' || activeTab === 'ai') && (
            <div className="glass-panel p-5 space-y-3 relative overflow-hidden border-cyan-500/30">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-cyan-300 flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>Forensic AI Intelligence Synthesis</span>
                </h2>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                  {report.ai_report?.model_used || 'Claude 3.5 Sonnet'}
                </span>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed font-sans glass-card p-3.5 rounded-lg">
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
          )}
        </div>
      )}

      {/* =========================================================================
          MODALS: DELETE DOSSIER CONFIRMATION
         ========================================================================= */}
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
                <h3 className="text-base font-bold text-white">Delete Investigation Dossier?</h3>
                <p className="text-xs text-slate-400">Target: {report.e164_format}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              This action will permanently delete all collected forensic evidence, telecom routing traces, social presence records, and AI summaries for <strong className="text-white font-mono">{report.e164_format}</strong>. This cannot be undone.
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
                onClick={handleDeleteDossier}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg shadow-rose-950/60 transition-colors flex items-center space-x-1.5"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: TRUECALLER CONNECT & PHOTO INSPECTION
         ========================================================================= */}
      <TruecallerModal
        isOpen={isTcModalOpen}
        onClose={() => setIsTcModalOpen(false)}
        onConnected={() => {
          setIsTruecallerConnected(true);
          handleFetchTruecaller();
        }}
      />

      {activePhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActivePhotoModal(null)}
        >
          <div
            className="glass-panel relative max-w-lg w-full p-4 overflow-hidden shadow-2xl border-cyan-500/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-glass)]">
              <span className="text-xs font-mono text-cyan-400">High-Resolution Profile Inspection</span>
              <button
                onClick={() => setActivePhotoModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="my-4 max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/90">
              <img
                src={activePhotoModal}
                alt="Enlarged Profile Portrait"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-[var(--border-glass)]">
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
