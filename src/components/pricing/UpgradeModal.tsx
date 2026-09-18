import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Zap, 
  Shield, 
  Sparkles, 
  Crown, 
  HardDrive,
  Check,
  Gift,
  Share2,
  Lock,
  Cloud,
  UserCheck,
  Heart,
  Infinity as InfinityIcon,
  Smile,
  Layers,
  FileCheck2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuotaGb?: number;
  onUpdateStorageQuota?: (newQuotaGb: number) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, 
  onClose,
  currentQuotaGb = 2000,
  onUpdateStorageQuota
}) => {
  const [selectedStorageGb, setSelectedStorageGb] = useState<number>(2000);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'free-pass' | 'storage-addon' | 'free-rewards'>('free-pass');
  const [claimedTasks, setClaimedTasks] = useState<{ [key: string]: boolean }>({});
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const freePerks = [
    {
      title: 'Unlimited Daily Tasks & Conversions',
      desc: 'Convert as many files as you need with zero daily limits or queues.',
      icon: InfinityIcon,
      color: 'text-brand-600 bg-brand-50 dark:bg-brand-950/60 dark:text-brand-400'
    },
    {
      title: '2 TB Free Lifetime Cloud Storage',
      desc: 'Generous 2 TB encrypted cloud space included for all your PDF and media archives.',
      icon: HardDrive,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400'
    },
    {
      title: 'Full AI Document Assistant',
      desc: 'Summarize, ask questions, generate MCQ quizzes, and compare diffs without limits.',
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400'
    },
    {
      title: 'Neural OCR & Table Extraction',
      desc: 'Extract editable text and tables from multi-page scanned PDFs at $0.',
      icon: Layers,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400'
    },
    {
      title: 'Batch Processing & No Watermarks',
      desc: 'Process dozens of documents at once with pristine, watermark-free exports.',
      icon: FileCheck2,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400'
    },
    {
      title: 'Privacy-First Client-Side Speed',
      desc: 'Runs directly in your browser with 256-bit encryption and automatic shredding.',
      icon: Shield,
      color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60 dark:text-cyan-400'
    }
  ];

  const storageOptions = [
    { gb: 1000, label: '1 TB', desc: 'Starter Free Space' },
    { gb: 2000, label: '2 TB (Default)', desc: 'Standard Free Lifetime Pass' },
    { gb: 5000, label: '5 TB', desc: 'Power Creator Studio Vault' },
    { gb: 10000, label: '10 TB', desc: 'High-Volume Enterprise Cloud' },
    { gb: 15000, label: '15 TB', desc: 'Massive Document Archive' },
    { gb: 20000, label: '20 TB', desc: 'Maximum Unlimited Cloud Vault' },
  ];

  const freeStorageTasks = [
    {
      id: 'referral',
      title: 'Invite Friends & Colleagues',
      rewardGb: 50,
      desc: 'Share ConvertPro with your team or peers. Earn +50 GB bonus cloud storage.',
      actionLabel: 'Copy Share Link & Claim +50 GB',
      icon: Share2,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
    },
    {
      id: '2fa',
      title: 'Enable 2FA Security Protection',
      rewardGb: 25,
      desc: 'Add two-factor authentication to protect your private document vault.',
      actionLabel: 'Claim +25 GB Reward',
      icon: Lock,
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
    },
    {
      id: 'cloud-drive',
      title: 'Connect Google Drive / Dropbox Sync',
      rewardGb: 50,
      desc: 'Link your cloud drive account for automated export backups.',
      actionLabel: 'Connect & Claim +50 GB',
      icon: Cloud,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
    },
    {
      id: 'profile',
      title: 'Complete Workspace Profile',
      rewardGb: 15,
      desc: 'Set your name, avatar, and custom PDF watermark preference.',
      actionLabel: 'Claim +15 GB Reward',
      icon: UserCheck,
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
    },
    {
      id: 'milestone',
      title: 'Convert Your First 5 Documents',
      rewardGb: 20,
      desc: 'Try any 5 converters (PDF, DOCX, Images, OCR) to unlock the Power Converter badge.',
      actionLabel: 'Claim +20 GB Reward',
      icon: Zap,
      color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
    }
  ];

  const handleClaimFreeStorage = (taskId: string, rewardGb: number) => {
    if (claimedTasks[taskId]) return;

    if (taskId === 'referral') {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }

    setClaimedTasks(prev => ({ ...prev, [taskId]: true }));
    confetti({ particleCount: 100, spread: 70 });

    if (onUpdateStorageQuota) {
      onUpdateStorageQuota(currentQuotaGb + rewardGb);
    }
  };

  const handleApplyStorage = () => {
    setIsSuccess(true);
    confetti({ particleCount: 120, spread: 80 });

    if (onUpdateStorageQuota) {
      onUpdateStorageQuota(selectedStorageGb);
    }

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-sm">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Omnify 100% Free Forever
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <Heart className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                  NO CHARGES • UNLIMITED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Active Quota: <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentQuotaGb >= 1000 ? `${(currentQuotaGb / 1000).toFixed(currentQuotaGb % 1000 === 0 ? 0 : 1)} TB` : `${currentQuotaGb} GB`}</span> &bull; All Features Unlocked
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Sub Navigation Tabs */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('free-pass')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'free-pass' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-500'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Unlimited Free Pass</span>
              </button>
              <button
                onClick={() => setActiveTab('storage-addon')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'storage-addon' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-500'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Free Cloud Storage (Up to 20 TB)</span>
              </button>
              <button
                onClick={() => setActiveTab('free-rewards')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'free-rewards' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500'
                }`}
              >
                <Gift className="w-3.5 h-3.5 text-emerald-500" />
                <span>Free Storage Bonus Tasks</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 px-1.5 py-0.2 rounded font-extrabold">+160 GB</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Unlimited Free Pass Overview */}
          {activeTab === 'free-pass' && (
            <div className="space-y-6">
              
              {/* Hero Callout */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-indigo-900 to-purple-950 text-white p-6 shadow-md border border-indigo-700/40">
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    <Sparkles className="w-3 h-3" />
                    <span>LIFETIME UNLIMITED ACCESS &bull; $0 FOREVER</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Omnify is 100% Free with Unlimited Tasks!
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-2xl">
                    We believe essential document conversion and productivity tools should be completely accessible to everyone. No credit card required, no daily conversion limits, and no hidden subscriptions.
                  </p>
                </div>
              </div>

              {/* Grid of Unlocked Free Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {freePerks.map((perk, idx) => {
                  const Icon = perk.icon;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3.5 group hover:border-brand-400 transition-all"
                    >
                      <div className={`p-2.5 rounded-xl ${perk.color} flex-shrink-0 mt-0.5`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {perk.title}
                          </h4>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded">
                            FREE
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {perk.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status footer button */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Your workspace is already activated with full Unlimited Free Pro privileges.</span>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap"
                >
                  Start Converting Now
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: Free Cloud Storage (Up to 5 TB Free) */}
          {activeTab === 'storage-addon' && (
            <div className="space-y-6">
              <div className="text-center space-y-2 max-w-lg mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Gift className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Free Lifetime Storage Quotas</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  <HardDrive className="w-5 h-5 text-brand-600" />
                  <span>Configure Your Free Cloud Storage</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select your preferred free storage quota for keeping your converted PDFs, images, and document history saved securely.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {storageOptions.map((opt) => {
                  const isSelected = selectedStorageGb === opt.gb;
                  return (
                    <div
                      key={opt.gb}
                      onClick={() => setSelectedStorageGb(opt.gb)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {opt.label}
                          </span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                            $0 FREE
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-semibold">
                        <span className={isSelected ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}>
                          {isSelected ? '✓ Selected Free Tier' : 'Click to select'}
                        </span>
                        {isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-800/40 shadow-md">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Free Storage Allocation</span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    Set workspace quota to <span className="text-amber-300">{selectedStorageGb >= 1000 ? `${(selectedStorageGb / 1000).toFixed(selectedStorageGb % 1000 === 0 ? 0 : 1)} TB` : `${selectedStorageGb} GB`}</span>
                  </h4>
                  <p className="text-xs text-emerald-200">100% Free Forever &bull; Instant allocation with zero downtime.</p>
                </div>

                <button
                  onClick={handleApplyStorage}
                  disabled={isSuccess}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {isSuccess ? <Check className="w-4 h-4 text-white" /> : <Zap className="w-4 h-4 text-white" />}
                  <span>{isSuccess ? 'Storage Quota Updated!' : `Set ${selectedStorageGb >= 1000 ? `${(selectedStorageGb / 1000).toFixed(selectedStorageGb % 1000 === 0 ? 0 : 1)} TB` : `${selectedStorageGb} GB`} Free Quota`}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: 🎁 Free Bonus Storage Tasks */}
          {activeTab === 'free-rewards' && (
            <div className="space-y-6">
              
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border border-emerald-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    <Gift className="w-3 h-3" />
                    <span>FREE STORAGE REWARDS PROGRAM</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Claim Extra Free Bonus Storage (+160 GB)
                  </h3>
                  <p className="text-xs text-emerald-100/80">
                    Earn permanent bonus cloud storage by completing quick actions or sharing ConvertPro with colleagues.
                  </p>
                </div>

                <div className="text-right flex-shrink-0 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <span className="text-[10px] text-emerald-200 font-medium block">Current Space</span>
                  <span className="text-xl font-black text-white">{currentQuotaGb >= 1000 ? `${(currentQuotaGb / 1000).toFixed(currentQuotaGb % 1000 === 0 ? 0 : 1)} TB` : `${currentQuotaGb} GB`}</span>
                </div>
              </div>

              {/* Free Task Action Cards */}
              <div className="space-y-3">
                {freeStorageTasks.map((task) => {
                  const Icon = task.icon;
                  const isClaimed = claimedTasks[task.id];

                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-emerald-400 transition-all"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`p-2.5 rounded-xl ${task.color} flex-shrink-0 mt-0.5`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {task.title}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                              +{task.rewardGb} GB Free
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {task.desc}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleClaimFreeStorage(task.id, task.rewardGb)}
                        disabled={isClaimed}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
                          isClaimed
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md'
                        }`}
                      >
                        {isClaimed ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Claimed (+{task.rewardGb} GB)</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{task.id === 'referral' && copiedLink ? 'Link Copied (+50 GB Claimed!)' : task.actionLabel}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
