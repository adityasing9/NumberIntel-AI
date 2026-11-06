import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  UploadCloud,
  History,
  Share2,
  AlertTriangle,
  FileText,
  Server,
  Settings,
  ShieldCheck,
  Radio,
  Sparkles
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'New Investigation', path: '/investigations/new', icon: Search },
  { name: 'Bulk Lookup', path: '/bulk-lookup', icon: UploadCloud, badge: '10K' },
  { name: 'Investigation History', path: '/investigations', icon: History },
  { name: 'Social Discovery', path: '/social-discovery', icon: Share2 },
  { name: 'Spam Intelligence', path: '/spam-intelligence', icon: AlertTriangle },
  { name: 'Reports & Exports', path: '/reports', icon: FileText },
  { name: 'API Providers', path: '/providers', icon: Server },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Security & Audit', path: '/audit-logs', icon: ShieldCheck },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 glass-panel border-r border-white/10 flex flex-col h-screen sticky top-0 z-40 select-none shadow-2xl">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/50 border border-white/20">
          <Radio className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="text-base font-extrabold tracking-tight text-white flex items-center space-x-1">
            <span>NumberIntel</span>
            <span className="text-cyan-400">AI</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">OSINT Intelligence</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
          <span>Main Modules</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80"></span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-white border border-cyan-500/40 shadow-inner font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Glassmorphism Engine</span>
          </span>
          <span className="flex items-center space-x-1 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Online</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
