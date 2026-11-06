import React from 'react';
import { Share2, Lock, ShieldCheck, Compass, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PLATFORMS_SPEC = [
  {
    name: 'WhatsApp Business',
    category: 'Messaging',
    method: 'Official Meta WhatsApp Business Cloud API & Public Gateway',
    capability: 'Discovers verified public business catalogs and registered contact endpoints. Personal accounts protected without enumeration.',
    badge: 'Official API'
  },
  {
    name: 'Telegram',
    category: 'Messaging',
    method: 'Telegram Bot API (getChat) & Public Indexing',
    capability: 'Resolves public channels, verified bot accounts, and public group links. Personal private users strictly not enumerated.',
    badge: 'Bot API'
  },
  {
    name: 'Signal',
    category: 'Messaging',
    method: 'Protocol Design Verification',
    capability: 'Signal maintains zero-knowledge reverse directory. Platform results always transparently state: Not Publicly Verifiable.',
    badge: 'Zero-Knowledge'
  },
  {
    name: 'LinkedIn',
    category: 'Professional Network',
    method: 'Search Engine Indexing on Public Business Pages',
    capability: 'Matches corporate contact pages, public recruiter postings, and verified organization contact numbers.',
    badge: 'Public OSINT'
  },
  {
    name: 'Facebook & Instagram',
    category: 'Social Media',
    method: 'Official Business Directory Mentions',
    capability: 'Identifies publicly indexed company profiles, local business listings, and commercial contact pages.',
    badge: 'Public OSINT'
  },
  {
    name: 'X (Twitter)',
    category: 'Social Media',
    method: 'Indexed Press Releases & Verified Contact Feeds',
    capability: 'Detects public customer support lines, emergency response numbers, and corporate PR releases.',
    badge: 'Public OSINT'
  },
  {
    name: 'TikTok & Snapchat',
    category: 'Social Media',
    method: 'Public Commercial Bio Indexing',
    capability: 'Matches publicly indexed brand bios and creator business inquiries published intentionally for contact.',
    badge: 'Public OSINT'
  }
];

export const SocialDiscoveryPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-glass)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Share2 className="w-6 h-6 text-cyan-400" />
            <span>Digital Footprint Discovery Framework</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ethical, lawful cross-platform footprint discovery architecture across 9 messaging and social networks.
          </p>
        </div>
        <Link
          to="/investigations/new"
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/60 transition-colors"
        >
          Test Target Number
        </Link>
      </div>

      {/* Compliance Notice Banner */}
      <div className="glass-panel p-5 border-cyan-500/40 text-xs space-y-2">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>Strict Privacy-by-Design Compliance Standard</span>
        </div>
        <p className="text-slate-300 leading-relaxed font-sans">
          In strict compliance with the Indian Digital Personal Data Protection Act (DPDP Act 2023), GDPR, and platform Terms of Service,
          NumberIntel AI never bypasses login barriers, never scrapes private friend lists, and never executes contact-synchronization account enumeration.
          Results are categorized authoritatively as <strong>Verified Association</strong>, <strong>Possible Public Match</strong>, or explicitly <strong>Not Publicly Verifiable</strong>.
        </p>
      </div>

      {/* Platform Specification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS_SPEC.map((p, idx) => (
          <div key={idx} className="glass-card-interactive p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">{p.category}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full glass-card text-slate-300">
                {p.badge}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">{p.name}</h3>
            <div className="text-xs text-slate-400 font-mono">Method: {p.method}</div>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">{p.capability}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
