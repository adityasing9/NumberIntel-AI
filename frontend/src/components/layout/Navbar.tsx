import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Bell, User, LogOut, Terminal, Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>SYSTEM ACTIVE</span>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>DPDP 2023 COMPLIANT • ZERO FABRICATION POLICY</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
            <div className="text-right hidden md:block">
              <div className="text-sm font-medium text-slate-200">{user.full_name || user.email}</div>
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">{user.role}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold">
              <User className="w-4 h-4" />
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
