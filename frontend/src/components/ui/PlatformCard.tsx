import React, { useState } from 'react';
import { PlatformResult } from '../../types';
import { StatusBadge } from './StatusBadge';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCode,
  CheckCircle2,
  ShieldAlert,
  MessageSquare,
  Share2,
  Globe,
  Camera,
  UserCheck
} from 'lucide-react';

interface PlatformCardProps {
  platform: PlatformResult;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({ platform }) => {
  const [showEvidence, setShowEvidence] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isConfirmed = platform.verification_status === 'verified_association' || (platform.confidence_level >= 50 && platform.verification_status !== 'not_found');
  const isNotFound = platform.verification_status === 'not_found' || platform.confidence_level === 0;

  const getPlatformIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n === 'whatsapp') {
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
          <MessageSquare className="w-4 h-4" />
        </div>
      );
    }
    if (n === 'telegram') {
      return (
        <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
          <Share2 className="w-4 h-4" />
        </div>
      );
    }
    if (n === 'signal') {
      return (
        <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
          <Share2 className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-xl glass-card flex items-center justify-center font-bold text-xs uppercase text-cyan-400 shadow-inner">
        {name.slice(0, 2)}
      </div>
    );
  };

  const primaryProfile = platform.public_profiles && platform.public_profiles.length > 0 ? platform.public_profiles[0] : null;

  return (
    <div className={`glass-card-interactive p-4 transition-all ${isConfirmed ? 'border-emerald-500/40 bg-emerald-950/10' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {getPlatformIcon(platform.platform_name)}
          <div>
            <div className="text-sm font-semibold text-slate-100 capitalize flex items-center space-x-1.5">
              <span>{platform.platform_name === 'x' ? 'X (Twitter)' : platform.platform_name}</span>
              {isConfirmed && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Checked: {new Date(platform.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        <StatusBadge status={platform.verification_status} size="sm" />
      </div>

      {/* Discovered Profile Avatar / Card */}
      {primaryProfile && primaryProfile.avatar_url && !imgError && (
        <div className="mt-3 p-2 rounded-xl bg-slate-950/60 border border-[var(--border-glass)] flex items-center space-x-3">
          <img
            src={primaryProfile.avatar_url}
            alt={primaryProfile.profile_identifier || 'Avatar'}
            onError={() => setImgError(true)}
            className="w-10 h-10 rounded-lg object-cover border border-cyan-400/50 shadow-md"
          />
          <div className="text-xs overflow-hidden">
            <div className="font-semibold text-white truncate flex items-center space-x-1">
              <span>{primaryProfile.bio || primaryProfile.profile_identifier || 'Verified User Profile'}</span>
              {primaryProfile.has_verified_badge && (
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              )}
            </div>
            <div className="text-[10px] text-cyan-300 font-mono truncate">
              Public Avatar Discovered
            </div>
          </div>
        </div>
      )}

      {/* Profile info or not verifiable explanation */}
      <div className="mt-3 pt-3 border-t border-[var(--border-glass)]">
        {platform.profile_url ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 truncate max-w-[200px]">
                {platform.public_display_name || platform.public_username || platform.profile_url}
              </span>
              <a
                href={platform.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center space-x-1 shrink-0 ml-2 text-xs font-mono px-2 py-0.5 rounded transition-colors ${
                  isConfirmed
                    ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-800 hover:bg-emerald-900'
                    : 'text-cyan-400 bg-slate-900/60 border border-slate-700 hover:text-cyan-300'
                }`}
              >
                <span>{platform.platform_name === 'whatsapp' ? (isConfirmed ? 'Open WhatsApp' : 'Test wa.me Link') : 'View Profile'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {isNotFound && platform.platform_name === 'whatsapp' && (
              <div className="text-[11px] text-slate-400 leading-snug">
                Not confirmed on WhatsApp. No public business profile or catalog indexed.
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            {platform.verification_status === 'not_publicly_verifiable'
              ? 'Private account protected. Not publicly verifiable through available sources.'
              : platform.verification_status === 'not_found'
              ? 'No publicly indexed association discovered in queried sources.'
              : 'Direct profile link not discovered.'}
          </div>
        )}

        {/* Confidence bar */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Match Confidence</span>
          <span className={`font-semibold ${isConfirmed ? 'text-emerald-400' : isNotFound ? 'text-slate-400' : 'text-cyan-300'}`}>
            {isNotFound ? '0% (Unconfirmed / Not Found)' : `${platform.confidence_level.toFixed(0)}%`}
          </span>
        </div>
        <div className="w-full bg-slate-950/60 rounded-full h-1.5 mt-1 overflow-hidden border border-[var(--border-glass)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              platform.confidence_level >= 75
                ? 'bg-emerald-500'
                : platform.confidence_level >= 40
                ? 'bg-cyan-500'
                : 'bg-slate-700'
            }`}
            style={{ width: isNotFound ? '0%' : `${platform.confidence_level}%` }}
          ></div>
        </div>

        {/* Collapsible evidence records */}
        {platform.evidence_records && platform.evidence_records.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-cyan-400 font-mono transition-colors"
            >
              <FileCode className="w-3 h-3" />
              <span>Evidence Sources ({platform.evidence_records.length})</span>
              {showEvidence ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showEvidence && (
              <div className="mt-2 space-y-1.5 p-2.5 glass-card rounded-xl text-[11px] font-mono">
                {platform.evidence_records.map((ev) => (
                  <div key={ev.id} className="text-slate-300">
                    <div className="text-cyan-400 font-semibold">{ev.evidence_type}</div>
                    <div className="text-slate-400 text-[10px] break-words">{ev.snippet}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
