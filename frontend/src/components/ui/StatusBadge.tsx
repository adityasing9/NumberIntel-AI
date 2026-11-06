import React from 'react';
import { ShieldCheck, Compass, SearchX, Lock, AlertCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status?.toLowerCase() || 'unknown';

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  if (norm === 'verified_association' || norm === 'verified') {
    return (
      <span className={`inline-flex items-center space-x-1 font-mono font-medium rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 ${sizeClasses}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Verified Match</span>
      </span>
    );
  }

  if (norm === 'possible_public_match' || norm === 'possible_match') {
    return (
      <span className={`inline-flex items-center space-x-1 font-mono font-medium rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 ${sizeClasses}`}>
        <Compass className="w-3.5 h-3.5 text-cyan-400" />
        <span>Possible Match</span>
      </span>
    );
  }

  if (norm === 'not_publicly_verifiable') {
    return (
      <span className={`inline-flex items-center space-x-1 font-mono font-medium rounded-full bg-purple-950/80 text-purple-300 border border-purple-700/60 ${sizeClasses}`}>
        <Lock className="w-3.5 h-3.5 text-purple-400" />
        <span>Not Publicly Verifiable</span>
      </span>
    );
  }

  if (norm === 'not_found' || norm === 'clean') {
    return (
      <span className={`inline-flex items-center space-x-1 font-mono font-medium rounded-full bg-slate-900 text-slate-400 border border-slate-700/60 ${sizeClasses}`}>
        <SearchX className="w-3.5 h-3.5 text-slate-400" />
        <span>Not Found</span>
      </span>
    );
  }

  if (norm === 'api_unavailable') {
    return (
      <span className={`inline-flex items-center space-x-1 font-mono font-medium rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60 ${sizeClasses}`}>
        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
        <span>API Unavailable</span>
      </span>
    );
  }

  if (norm === 'search_failed' || norm === 'failed') {
    return (
      <span className={`inline-flex items-center space-x-1 font-mono font-medium rounded-full bg-rose-950/80 text-rose-300 border border-rose-700/60 ${sizeClasses}`}>
        <XCircle className="w-3.5 h-3.5 text-rose-400" />
        <span>Search Failed</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center space-x-1 font-mono font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}>
      <span>{status}</span>
    </span>
  );
};
