import React, { useState } from 'react';
import { spamService } from '../services/api';
import { AlertTriangle, ShieldCheck, Send, CheckCircle2, AlertCircle } from 'lucide-react';

const SPAM_CATEGORIES = [
  { value: 'telemarketing', label: 'Telemarketing / Cold Calling' },
  { value: 'suspected_fraud', label: 'Suspected Fraud / Impersonation' },
  { value: 'financial_scam', label: 'Financial Scam / Phishing' },
  { value: 'robocall', label: 'Automated Robocall' },
  { value: 'unwanted_marketing', label: 'Unwanted Marketing / SMS Spam' },
];

export const SpamIntelligencePage: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [spamCategory, setSpamCategory] = useState('telemarketing');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await spamService.report(phoneNumber, spamCategory, description || undefined);
      setSuccessMsg(`Abuse report recorded successfully for ${phoneNumber}. Aggregated threat score updated.`);
      setPhoneNumber('');
      setDescription('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit spam report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            <span>Spam & Fraud Intelligence Node</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Community threat reporting, StopForumSpam feeds, and automated scam classification.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center space-x-2 font-mono">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-white">Submit Abuse / Fraud Incident Report</h2>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          Reports are anonymized using salted SHA-256 IP hashing to prevent abuse and false flag attacks. AI models do not label individuals as criminals without verifiable threat intelligence records.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
              Phone Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. +91 99999 88888"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
              Threat Category
            </label>
            <select
              value={spamCategory}
              onChange={(e) => setSpamCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {SPAM_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
              Incident Context / Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Robocall offering unsolicited loans; spoofed caller ID."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !phoneNumber.trim()}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Submit Threat Incident Report</span>
          </button>
        </form>
      </div>
    </div>
  );
};
