import React, { useState, useEffect } from 'react';
import { truecallerService } from '../../services/truecallerService';
import { ShieldCheck, Phone, Key, X, CheckCircle2, AlertCircle, Loader2, RefreshCw, LogOut, ExternalLink } from 'lucide-react';

interface TruecallerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const TruecallerModal: React.FC<TruecallerModalProps> = ({ isOpen, onClose, onConnected }) => {
  const [activeTab, setActiveTab] = useState<'otp' | 'manual'>('otp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [currentPhone, setCurrentPhone] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentToken(truecallerService.getToken());
      setCurrentPhone(truecallerService.getPhone());
      setErrorMsg(null);
      setSuccessMsg(null);
      setRequestId(null);
      setOtp('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await truecallerService.sendOtp(phoneNumber);
      setRequestId(res.requestId);
      setSuccessMsg(res.message || 'OTP dispatched via SMS. Please enter the 6-digit code below.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch Truecaller SMS OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestId || !otp.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await truecallerService.verifyOtp(phoneNumber, requestId, otp);
      setSuccessMsg('Truecaller session established successfully! Real caller records enabled.');
      setCurrentToken(truecallerService.getToken());
      setCurrentPhone(phoneNumber);
      if (onConnected) onConnected();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid OTP code. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManualToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;

    truecallerService.setToken(manualToken);
    setCurrentToken(manualToken.trim());
    setSuccessMsg('Truecaller Installation ID saved successfully.');
    if (onConnected) onConnected();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleDisconnect = () => {
    truecallerService.clearToken();
    setCurrentToken(null);
    setCurrentPhone(null);
    setSuccessMsg('Truecaller session cleared.');
    if (onConnected) onConnected();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-panel relative max-w-md w-full shadow-2xl p-6 space-y-5 border-blue-500/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-glass)]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-900/40">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Truecaller Live Gateway</h2>
              <p className="text-[11px] text-slate-400 font-mono">Fetch real verified names, carriers & photos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        {currentToken ? (
          <div className="p-3.5 glass-card border-emerald-500/50 rounded-xl text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-emerald-300 font-bold">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Truecaller Session Active</span>
              </span>
              <button
                onClick={handleDisconnect}
                className="text-rose-400 hover:text-rose-300 flex items-center space-x-1 text-[11px]"
              >
                <LogOut className="w-3 h-3" />
                <span>Disconnect</span>
              </button>
            </div>
            <div className="text-[11px] text-slate-300">
              Account: <strong className="text-white">{currentPhone || 'Connected Device'}</strong>
            </div>
            <div className="text-[10px] text-slate-400">
              All telephone queries will automatically pull caller names, avatar photos, and carrier data from Truecaller's 350M+ database.
            </div>
          </div>
        ) : (
          <div className="p-3 glass-card border-blue-500/40 rounded-xl text-[11px] font-mono text-slate-300">
            Connect Truecaller to fetch caller names, carrier networks, and user avatar photos for any phone number.
          </div>
        )}

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 glass-card border-rose-500/60 rounded-xl text-rose-300 text-xs flex items-center space-x-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 glass-card border-emerald-500/60 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tabs */}
        {!currentToken && (
          <div className="space-y-4">
            <div className="flex rounded-xl glass-card p-1 text-xs font-mono">
              <button
                onClick={() => setActiveTab('otp')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'otp' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                SMS OTP Login
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'manual' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Paste Installation ID
              </button>
            </div>

            {/* TAB 1: OTP FLOW */}
            {activeTab === 'otp' && (
              <div className="space-y-3">
                {!requestId ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-300 mb-1 uppercase">
                        Your Mobile Number (To Receive Truecaller OTP)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. +91 9876543210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full glass-input rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                      <span>Send Truecaller OTP via SMS</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-300 mb-1 uppercase">
                        Enter 6-Digit SMS OTP
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full glass-input rounded-xl px-3.5 py-2 text-sm font-mono text-white placeholder-slate-500 tracking-widest text-center focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>Verify OTP & Authorize Truecaller</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestId(null)}
                      className="w-full text-center text-[10px] text-slate-400 hover:underline font-mono"
                    >
                      Resend OTP or Change Number
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: MANUAL TOKEN */}
            {activeTab === 'manual' && (
              <form onSubmit={handleSaveManualToken} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1 uppercase">
                    Truecaller Installation ID (Bearer Token)
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. a1i0W--..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="w-full glass-input rounded-xl p-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Obtained from <code>truecallerpy --installationid</code> or <code>truecallerjs --installationid</code>.
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono rounded-xl shadow-lg transition-colors"
                >
                  Save Truecaller Token
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-[var(--border-glass)] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Official Android Gateway</span>
          <a
            href="https://www.truecaller.com"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline flex items-center space-x-1"
          >
            <span>truecaller.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
