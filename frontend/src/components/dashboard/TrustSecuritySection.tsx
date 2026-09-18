import React from 'react';
import { ShieldCheck, Clock, Lock, EyeOff, CheckCircle2, FileCheck2, Cpu, Activity, Server } from 'lucide-react';

export const TrustSecuritySection: React.FC = () => {
  const trustPoints = [
    {
      icon: ShieldCheck,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      title: 'End-to-End Encryption',
      description: 'Streamed via TLS 1.3 & AES-256 GCM. All data transmissions are completely cryptographically secure.'
    },
    {
      icon: Clock,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      title: '24h Ephemeral Auto-Shred',
      description: 'All converted files and cached buffers are automatically wiped clean after 24 hours.'
    },
    {
      icon: Lock,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      title: 'Enterprise Compliance',
      description: 'Built following strict SOC2 Type II, GDPR, and ISO 27001 security and privacy architectures.'
    },
    {
      icon: EyeOff,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      title: 'Zero-Knowledge Privacy',
      description: 'We never read, harvest, or train AI models on your private documents. 100% client-isolated.'
    }
  ];

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/3 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
                Enterprise-Grade Privacy & Security
              </span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Your Files & Confidential Data Are 100% Protected
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>SOC2 & GDPR Compliant</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 text-indigo-200 border border-white/10 backdrop-blur-md">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>99.99% Uptime SLA</span>
            </span>
          </div>
        </div>

        {/* 4 Trust Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trustPoints.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 space-y-3 group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white mb-1.5 group-hover:text-brand-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Telemetry live status strip */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>High-Speed Global Processing Nodes Active (North America, Europe, Asia)</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Average Parallel Latency: <span className="text-emerald-400 font-bold">380ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
