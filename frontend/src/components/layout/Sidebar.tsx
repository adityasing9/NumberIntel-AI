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
  Radio
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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/40">
          <Radio className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-white flex items-center space-x-1">
            <span>NumberIntel</span>
            <span className="text-cyan-400">AI</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">OSINT & Telecom Intelligence</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
          Main Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-700/50">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>v1.0.0 Pro</span>
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Online</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
