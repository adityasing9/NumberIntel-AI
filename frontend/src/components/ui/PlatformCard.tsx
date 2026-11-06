import React, { useState } from 'react';
import { PlatformResult } from '../../types';
import { StatusBadge } from './StatusBadge';
import { ExternalLink, ChevronDown, ChevronUp, FileCode, CheckCircle2, ShieldAlert } from 'lucide-react';

interface PlatformCardProps {
  platform: PlatformResult;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({ platform }) => {
  const [showEvidence, setShowEvidence] = useState(false);

  const getPlatformIcon = (name: string) => {
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs uppercase text-cyan-400">
        {name.slice(0, 2)}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition-all shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {getPlatformIcon(platform.platform_name)}
          <div>
            <div className="text-sm font-semibold text-slate-100 capitalize">
              {platform.platform_name === 'x' ? 'X (Twitter)' : platform.platform_name}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Checked: {new Date(platform.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        <StatusBadge status={platform.verification_status} size="sm" />
      </div>

      {/* Profile info or not verifiable explanation */}
      <div className="mt-3 pt-3 border-t border-slate-800/80">
        {platform.profile_url ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 truncate max-w-[200px]">
              {platform.public_display_name || platform.public_username || platform.profile_url}
            </span>
            <a
              href={platform.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 shrink-0 ml-2"
            >
              <span>View Profile</span>
              <ExternalLink className="w-3 h-3" />
            </a>
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
          <span>Confidence</span>
          <span className="text-slate-200">{platform.confidence_level.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              platform.confidence_level >= 75
                ? 'bg-emerald-500'
                : platform.confidence_level >= 40
                ? 'bg-cyan-500'
                : 'bg-slate-600'
            }`}
            style={{ width: `${Math.max(5, platform.confidence_level)}%` }}
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
              <div className="mt-2 space-y-1.5 p-2 bg-slate-950/70 rounded-lg border border-slate-800 text-[11px] font-mono">
                {platform.evidence_records.map((ev) => (
                  <div key={ev.id} className="text-slate-300">
                    <div className="text-cyan-400/80 font-semibold">{ev.evidence_type}</div>
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
